# 모니터링 & 침입 탐지 가이드 (Monitoring & Detection)

- 작성일: 2026-05-14
- 우선순위: **낮음** — [security-review.md](./security-review.md)의 **T0~T2 항목이 끝난 뒤** 착수
- 대상: 4인 팀이 현실적으로 운영 가능한 범위
- 핵심 질문: "Firebase가 침입을 자동으로 탐지해주는가? 우리가 따로 뭘 해야 하는가?"

이 문서는 보안 **방어**(security-review.md)가 아니라 보안 **탐지·관측**에 관한 것이다. 두 가지는 분리해야 한다:

- **방어 (Prevention)**: 공격이 성공하지 못하게 막는다 — Firestore 규칙, App Check, 입력 검증
- **탐지 (Detection)**: 공격 시도가 일어났음을 알아차린다 — 로그, 알림, 감사 로그
- **대응 (Response)**: 탐지 후 무엇을 할지 — 계정 차단, 키 회전, 사용자 공지

먼저 방어가 튼튼해야 탐지가 의미 있다. 무방비 상태에서 탐지만 켜면 매일 알람만 울린다.

---

## 0. Executive Summary

| 영역 | Firebase 기본 제공 | 우리가 설정해야 할 것 | 비용 |
|------|------|------|------|
| TLS / 패킷 가로채기 방어 | ✅ 자동 | 없음 | 무료 |
| Firestore 인증 우회 시도 탐지 | 📊 로그만 (알림 X) | Cloud Monitoring 알림 | ~$2/월 |
| 비정상 데이터 접근 패턴 (스크래핑) | ❌ 없음 | 알림 + honeypot | ~$1/월 |
| 봇/스크립트 차단 | ❌ 없음 | App Check 활성화 | 무료 |
| 코치 부정행위 (환불 남발 등) | ❌ 없음 | Audit log 컬렉션 | ~$1/월 |
| Auth abuse (비밀번호 brute force) | ✅ 일부 (rate limit) | 추가 알림 | 무료 |
| Cloud Function 오용 | 📊 로그만 | 알림 | 무료 |
| DDoS / volumetric | ✅ GCP 레벨에서 자동 | 없음 | 무료 |

**현실 인식**: 의지가 있는 숙련된 공격자는 막을 수 없다. 이 문서의 목표는 **기회주의적 공격자와 봇의 95%를 차단**하고, 사고 발생 시 **포렌식할 수 있는 증거를 남기는 것**이다. SIEM을 구축하지 않는다.

---

## 1. Firebase가 자동으로 처리해주는 영역

### 1.1. Transport Layer Security (TLS)

모든 Firebase ↔ 클라이언트 통신은 HTTPS다 (TLS 1.2+). 네트워크상 패킷 스니핑은 사실상 무의미하다.

**MITM이 가능한 시나리오**:
- 공격자가 사용자 기기를 물리적으로 통제 (custom root CA 설치)
- 사용자 기기가 jailbreak/root돼 있고 공격자가 인증서 검증 우회
- 회사 네트워크에서 corporate proxy로 TLS interception (정상적 보안 운영이지만 사용자 동의 필요)

이 세 경우는 모두 **기기 측 침해**다. Firebase가 막을 수 있는 영역이 아니며, **certificate pinning**을 추가해도 root된 기기에서는 우회 가능. 4인 팀이 신경 쓸 일 아님.

### 1.2. NoSQL "Injection"은 거의 무의미

전통적 SQL injection (`'; DROP TABLE users; --`)은 Firestore에서 작동하지 않는다. 이유:
- Firestore 쿼리는 파라미터화돼 있음
- `where(field, '==', userInput)` 패턴에서 userInput은 코드로 해석되지 않음
- Firestore 자체에 "임의 쿼리 실행" API가 없음

**유일한 위험 시나리오**: Cloud Functions가 사용자 입력을 직접 Firestore write에 사용하는 경우. 우리 함수들은 [push.js](../../../sweatBridge-app/functions/push.js)와 [email.js](../../../sweatBridge-app/functions/email.js)뿐이고, 둘 다 입력을 그대로 저장하지는 않으니 현재 위험 없음.

### 1.3. Firebase Auth Rate Limiting

기본 제공:
- 동일 IP에서 실패 로그인이 누적되면 일시 차단 (`auth/too-many-requests`)
- 동일 계정에 대한 실패 로그인 누적도 차단
- 신규 가입 시도가 짧은 시간에 폭주하면 자동 throttle

**한계**:
- 임계치가 비공개라서 정확한 정책 모름
- 분산 공격(다수 IP)에는 효과 제한적
- App Check가 켜져 있지 않으면 봇이 다른 IP로 우회 쉬움

### 1.4. DDoS / Volumetric Attack

GCP 인프라 레벨에서 자동 mitigation. 우리가 신경 쓸 영역 아님.

### 1.5. 신규 디바이스 로그인 알림

Firebase Auth가 사용자에게 "새 기기에서 로그인되었습니다" 이메일을 자동 발송 (Auth Settings에서 활성화 필요).

---

## 2. Firebase가 로그만 남기고 알림하지 않는 영역

이 영역이 우리가 **Cloud Monitoring 알림으로 메워야 할 곳**이다. Firebase는 모든 활동을 Cloud Logging에 기록하지만, **임계치 초과 시 알람을 울리지는 않는다**.

### 2.1. 권장 알림 정책 5개

각 알림은 Firebase Console → **Monitoring → Alerting → Create Policy**에서 설정.

#### 알림 #1: Firestore `permission_denied` 급증 → 규칙 우회 시도

```
조건:
  메트릭: firestore.googleapis.com/api/request_count
  필터: response_code = "PERMISSION_DENIED"
  집계: 5분 합계
  임계치: > 50

알림:
  Slack webhook 또는 이메일
```

**해석**: 정상 운영 시 `permission_denied`는 거의 0이어야 한다 (UI가 권한 없는 행위를 차단하므로). 5분에 50건 넘게 발생하면 누군가 콘솔에서 직접 Firestore 호출하며 규칙 한계를 탐색 중일 가능성.

**오탐 가능성**: 새 기능 배포 후 클라이언트 코드 버그로 잘못된 경로 접근 시. 그래도 알 가치 있음.

#### 알림 #2: 미인증 Firestore 요청 급증 → API 키 abuse

```
조건:
  메트릭: firestore.googleapis.com/api/request_count
  필터: response_code = "UNAUTHENTICATED"
  집계: 5분 합계
  임계치: > 100

알림: 이메일
```

**해석**: 공개된 API 키로 누군가 인증 없이 직접 Firestore에 접근 시도 중. App Check가 켜져 있다면 거의 안 일어나야 함 (즉 이 알림은 App Check가 우회되거나 비활성화된 상황을 잡음).

#### 알림 #3: Auth 가입 실패율 급증 → 봇 / credential stuffing

```
조건:
  메트릭: identitytoolkit.googleapis.com/operation_count
  필터: method_name = "SignUp", response_code != "OK"
  집계: 5분 합계
  임계치: > 20

알림: 이메일
```

**해석**: 정상 가입은 시간당 수 건. 5분에 20건 실패면 봇 또는 가짜 가입 시도 중.

#### 알림 #4: 단일 사용자 대량 read → 데이터 스크래핑

이건 Cloud Monitoring 기본 메트릭으로는 잡기 어렵다. **Custom logs-based metric** 필요:

```
1. Cloud Logging → 새 logs-based metric 생성
   - 이름: firestore_reads_per_user
   - 필터: resource.type="firestore.googleapis.com/Database"
            AND protoPayload.methodName="google.firestore.v1.Firestore.RunQuery"
   - Label: principal_email (사용자 이메일)
   
2. Cloud Monitoring → Alert
   - 메트릭: 위 custom metric
   - 집계: 1분 합계 by principal_email
   - 임계치: > 1000 / min by single user
```

**해석**: 단일 사용자가 1분에 1000건 이상 read는 정상 사용 패턴이 아님. 거의 확실히 스크래핑.

**전제**: Cloud Audit Logs (Data Access)를 활성화해야 함 — 별도 비용 발생 (free tier 초과 시 GB당 $0.50). 작은 박스라면 월 $1~5 수준.

#### 알림 #5: Cloud Function 오류율 급증 → 함수 abuse 또는 버그

```
조건:
  메트릭: cloudfunctions.googleapis.com/function/execution_count
  필터: status != "ok"
  집계: 5분 비율
  임계치: > 5% errors

알림: 이메일
```

**해석**: 함수가 5% 이상 실패면 클라이언트가 잘못된 인자로 호출 중이거나 함수가 인풋을 거부 중. 보안 관점에서는 abuse 시도일 수 있음.

### 2.2. 설정 시간

5개 알림 전체 설정: **2~3시간** (한 번에 끝낼 수 있음). Slack webhook 연동까지 포함.

---

## 3. Firebase가 전혀 해주지 않는 영역

### 3.1. 비정상 행위 패턴 탐지 (Anomaly Detection)

- "이 코치가 평소엔 환불 안 하는데 갑자기 오늘 10건 환불"
- "이 회원이 한 시간 만에 50개 클래스 예약 후 취소 반복"
- "월요일 새벽 3시에 누군가 매출 데이터 전체 다운로드"

Firebase는 이런 패턴을 모른다. 직접 만들거나, **§4의 audit log**로 사후 검토하는 수밖에 없다.

### 3.2. PII Exit / DLP

데이터가 유출되는 것을 자동 감지하지 않는다. Cloud DLP API를 별도 연동해야 하며, Firestore에는 native 통합 없음. 4인 팀이 다룰 수준 아님.

### 3.3. In-app Fraud Detection

코치가 자기 친구를 무료 회원으로 등록하고 매출에 가짜 100만원 결제 기록하는 시나리오. 결제 게이트웨이가 별도라면(예: Stripe) 거기서 잡히지만, 현재 시스템은 자체 입력이라 탐지 불가능. **§4 audit log**가 유일한 사후 추적 수단.

### 3.4. 봇 탐지 (App Check 외)

App Check는 "이 요청이 진짜 우리 앱 인스턴스인가"만 검증한다. **앱을 통과한 후의** 봇 행위(예: 자동화된 정상 사용자처럼 보이는 스크립트)는 잡지 않는다.

---

## 4. 4인 팀에 현실적인 추가 조치 (우선순위 순)

이 항목들은 모두 [security-review.md](./security-review.md)의 T0~T2가 끝난 뒤 적용한다.

### 4.1. ⭐ App Check 활성화 (1순위)

[security-review.md §11](./security-review.md)에 이미 포함된 항목. 다시 강조하는 이유: **모니터링·탐지 측면에서 가장 큰 단일 효과**.

- 봇/스크립트의 95%를 입구에서 차단
- §2.1 알림 #2가 거의 0이 됨
- 작업량: 2 인일 (웹 + Android + iOS)

### 4.2. ⭐ 5개 Cloud Monitoring 알림 설정 (2순위)

§2.1 위 5개. 2~3시간 작업.

### 4.3. ⭐ Audit Log 컬렉션 (3순위)

[security-review.md §15](./security-review.md)에 이미 포함된 항목. 모니터링 측면에서 핵심:
- 모든 금전 행위 (회원권 추가/환불/삭제, 락커 배정/해지) 기록
- `actor`, `target`, `before`, `after`, `at` 필수 필드
- 규칙: append-only (`allow update, delete: if false`)
- 작업량: 1~2 인일

### 4.4. 🍯 Honeypot 문서 (4순위)

저비용 / 고가치:

```
1. Firestore에 미끼 문서 생성
   - 경로: /box/{boxName}/_decoy/admin_keys
   - 내용: 그럴듯한 가짜 데이터 (예: { "apiKey": "fake-stripe-..." })

2. Firestore 규칙: allow read 허용 (그래야 미끼 작동)
   match /box/{boxName}/_decoy/{doc} {
     allow read: if isSignedIn();  // 모든 인증 사용자가 읽을 수 있음
     allow write: if false;
   }

3. Cloud Logging logs-based metric으로 이 경로 read를 트래킹
   - 필터: protoPayload.resourceName ~ ".*_decoy/admin_keys"

4. 이 경로가 한 번이라도 read되면 즉시 알림
```

**작동 원리**: 합법적인 클라이언트 코드는 이 경로를 절대 읽지 않는다 (UI에서 호출하지 않으므로). 누군가 이걸 읽었다면, **DB를 직접 탐색 중인 공격자**다.

**비용**: 거의 0. **효과**: 결정적 시그널 (false positive 거의 없음).
**작업량**: 1~2시간.

### 4.5. Firebase Auth 추가 보안 설정

Firebase Console → Authentication → Settings에서:
- ✅ User actions: Enabled (로그인/로그아웃 이벤트 로깅)
- ✅ Email enumeration protection: Enabled (Firebase가 최근 추가한 기능, 비밀번호 재설정 시 사용자 존재 여부 노출 방지)
- ✅ Password policy: Enabled — 최소 8자 (보안 리뷰 §12)
- ✅ Multi-factor authentication for users: Optional (코치 계정에 적용 권장 — 박스 자체 정책으로)

**작업량**: 30분.

### 4.6. 주간 정기 점검 (자동화)

매주 월요일 오전 9시에 자동 실행되는 Cloud Function:

```js
// functions/weekly-security-check.js
exports.weeklySecurityCheck = onSchedule("every monday 09:00", async () => {
  const report = {
    permissionDeniedCount: await queryLogs('PERMISSION_DENIED', '7d'),
    signupFailureCount: await queryLogs('signup_failed', '7d'),
    decoyAccessCount: await queryLogs('_decoy', '7d'),
    largestSingleUserReads: await queryLogs('top_readers', '7d'),
    auditLogTopActions: await queryAuditLog('7d'),
  };
  
  // sweatbridgecontact@gmail.com 으로 요약 이메일
  await sendReport(report);
});
```

**작업량**: 0.5~1 인일.
**효과**: 주간 단위로 "지난 주 우리 시스템에 무슨 일이 있었나" 한눈에 파악.

---

## 5. NOT to do — 4인 팀이 손대지 말아야 할 것

| 안 할 일 | 이유 |
|---------|------|
| 자체 SIEM (Splunk/ELK) 구축 | 풀타임 1명 필요. 우리 규모에 과잉 |
| Certificate pinning | 진짜 공격자는 어차피 우회. 정상 사용자 환경에 친화적이지 않음 |
| WAF (Cloud Armor 등) | Firebase 앞단은 이미 GCP가 보호. 직접 노출되는 endpoint도 없음 |
| 모든 Cloud Function에 reCAPTCHA | App Check가 더 가벼움 |
| 클라이언트 측 무결성 검사 (JS code signing 등) | 우회 가능. 작업량 vs 효과 너무 나쁨 |
| 24/7 SOC 운영 | 51명 회원 박스가 감당할 수 없음. 알림 + 평일 대응으로 충분 |
| 침투 테스트 의뢰 | 매출 규모 커진 후 (~연 매출 10억 이상). 지금은 자체 점검으로 충분 |

---

## 6. 진짜 공격자에게는 어떻게 되는가

솔직하게: **숙련된, 의지가 있는 공격자는 막을 수 없다.** 다음 시나리오는 우리 자원으로 방어 불가능:

- 코치 한 명을 사회공학으로 회유 → 합법적 권한으로 데이터 유출
- 코치 기기에 멀웨어 설치 → 세션 토큰 탈취
- 박스 직원이 본인 권한 내에서 부정 행위 (audit log로 사후 추적은 가능)
- Firebase 콘솔 관리자 계정 피싱

이런 시나리오에 대한 방어는:
- **인적 통제**: 코치 채용 시 신원 확인, 직원 교육
- **권한 분리**: Firebase 콘솔 접근은 대표 1명만, 코드 배포는 별도 1명. **2FA 필수**.
- **사후 대응 계획**: 침해 발견 시 (a) 영향 평가 (b) 사용자 공지 (c) PIPA 통보 (d) 자격증명 회전. 매뉴얼화해 두기.

탐지·모니터링은 "재능 있는 공격자를 막는다"가 아니라 "**기회주의자를 거르고, 사고가 났을 때 빠르게 발견하고, 책임 소재를 추적할 수 있게 한다**"가 목표다.

---

## 7. 우선순위 일정 제안

T0~T2 (보안 리뷰) 완료 후 시점 기준:

| 시점 | 작업 | 인일 |
|------|------|------|
| **+1주** | §4.5 Firebase Auth 추가 설정 | 0.5 |
| **+1주** | §4.2 Cloud Monitoring 알림 5개 + Slack/이메일 연동 | 0.5 |
| **+2주** | §4.4 Honeypot 문서 + 알림 | 0.25 |
| **+3주** | §4.6 주간 정기 점검 Cloud Function | 1 |
| **+분기 내** | 침해 대응 매뉴얼 작성 (Notion 또는 README) | 1 |

**총 추정**: 3~4 인일. 1명이 한 달에 걸쳐 자투리 시간으로 처리 가능.

---

## 8. 관련 문서

- [security-review.md](./security-review.md) — **반드시 먼저** 처리해야 할 실제 보안 결함
- [backend-optimization-plan.md](./backend-optimization-plan.md) — 백엔드 호출 최적화 (이미 대부분 완료)
- [firebase-structure.md](../rules/firebase-structure.md) — Firestore 데이터 구조 (감사 대상 경로 파악용)
