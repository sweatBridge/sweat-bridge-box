# T0 — Firestore 보안 규칙: 적용 내역 · 잔존 위험 · 배포 절차

- 대응: security-review.md TIER 0 (#1 Firestore 규칙 무방비)
- 생성 파일:
  - [firestore.rules](../firestore.rules) — 조정된 규칙 (배포 대상)
  - [firebase.json](../firebase.json), [.firebaserc](../.firebaserc), [firestore.indexes.json](../firestore.indexes.json)
  - [firestore-tests/rules.test.js](../firestore-tests/rules.test.js) — 에뮬레이터 규칙 테스트
- 상태: **코드/테스트 작성 완료. 배포는 팀이 수행(에뮬레이터→staging→prod).** 아직 어디에도 배포 안 됨.

---

## 1. 핵심 결정 — 부록 B를 그대로 쓰지 않은 이유

부록 B 초안은 "회원 문서(`box/{box}/member/{email}`)는 코치만 write"로 잡았다. 하지만
웹·모바일 **실제 write 경로를 감사**한 결과, 회원 본인이 자기 member 문서를 write 하는
정상 플로우가 둘 있다:

| 플로우 | 코드 | write 경로 |
|---|---|---|
| 수업 예약 시 quota 감산 | [reservation_service.dart:271](../../../sweatBridge-app/lib/service/reservation_service.dart#L271) → `updateMemberships` | 회원이 본인 `member/{email}.memberships` update |
| 프로필 수정 | [user_repository.dart:105](../../../sweatBridge-app/lib/repository/user_repository.dart#L105) `updateUserProfile` | 회원이 본인 `member/{email}` 갱신(트랜잭션) |

또 웹에서도:

| 플로우 | 코드 | write 경로 |
|---|---|---|
| 회원 추가(기존 앱 유저 편입) | [AddMemberModal.tsx:113](../src/components/modals/member/AddMemberModal.tsx#L113) `updateUser` | 코치가 **타인** `user/{email}` 전체 문서 갱신 |
| 신청 승인/거절 | `memberService.approveApplicant`/`rejectApplicant` | 코치가 신청자 `user/{email}.boxName` 갱신 |

→ 부록 B를 그대로 배포하면 **모바일 예약·프로필 수정**, **웹 회원 추가**가 전부
`permission-denied`로 깨진다. 그래서 규칙을 다음과 같이 조정했다.

### 역할(role) 3-tier 모델 — 케이싱 처리 (중요)

`user.role` 값이 클라이언트마다 다르게 저장된다:
- 모바일([user_info.dart:73](../../../sweatBridge-app/lib/model/user_info.dart#L73)): `"COACH"` / `"MEMBER"` (대문자)
- 웹([auth.ts:1](../src/types/auth.ts#L1)): `"coach"` / `"admin"` (소문자)

그래서 규칙은 **`role.lower()`로 비교**한다(`roleLower()` 헬퍼). 권한 tier:

| Tier | role (소문자 기준) | 범위 |
|---|---|---|
| **platform admin** | `admin` | 멀티테넌트 콘솔(`/admin/*`): 박스 온보딩/상태/유저 관리. **전체 경로 접근**(wildcard override). |
| **coach** | `coach` (대/소문자 모두 인정) | 본인 박스(`userBox()`)의 회원/매출/수업/락커/플랜/WOD 관리. |
| **member** | 그 외 | 본인 데이터 + 본인 박스 읽기 + 예약(reserved/quota self-write). |

> ⚠️ admin tier가 없으면 admin 콘솔(box 생성/status/유저 list)이 전부 `permission-denied`로 막힌다.
> 또한 `role == 'COACH'`처럼 케이싱을 고정하면 웹 소문자 코치가 거부된다. 둘 다 이번에 반영.
>
> **변경 이력 (2026-05-28)**: 과거 `operator` 역할은 코드상 `admin`과 권한이 동일해 `admin`으로 통합.
> Firestore에 `role: 'operator'`로 저장된 기존 유저가 있다면 **`'admin'`으로 일괄 마이그레이션 필요**
> (그렇지 않으면 admin 콘솔 접근권한이 사라짐). 콘솔에서 직접 수정하거나 일회용 Admin SDK 스크립트로 처리.

### 부록 B 대비 변경점

1. **`box/{box}/member/{email}` write**: `coach-only` → **`isCoachOf(box) || isSelf(email)`**.
   회원의 본인 문서 self-write 허용(예약 quota·프로필). 타 회원 문서는 여전히 차단.
2. **`member/.../attendance`**: 코치 + 본인 허용(출석은 코치·멤버 양쪽 컨트롤러에서 기록). 민감도 낮음.
3. **`user/{email}` update**: 본인 + "코치가 **미소속/신청중/본인박스** 유저를 본인 박스로 편입하거나
   신청을 거절(boxName 비우기)"하는 경우 허용. **타 박스의 활성 회원을 가로채는 write는 차단**
   (`normalizeBox(resource.data.boxName)` 로 현재 박스를 정규화해 비교).
4. **`applied` create/update 분리**: create는 `keys().hasOnly([email])`, update는 `diff().hasOnly([email])`.
   (create 시 `resource`가 없어 `diff()`가 에러 → 첫 신청자 거부되는 버그 회피.)
5. **`user/keys/{keyDoc}`**: 부록 B의 `push_token` 고정 → 와일드카드(`{keyDoc}`)로 일반화.

---

## 2. 닫히는 위험 (status quo `if true` 대비)

- ✅ 타 박스 회원/매출/PII 교차 읽기 (테넌트 격리)
- ✅ `/user`, `/feedback` **list(enumeration)** 차단 — `get`만 허용
- ✅ 비-코치의 `revenue` write 차단
- ✅ 타 박스 회원 대량 삭제 차단
- ✅ 타 박스 `wod` 생성(푸시 스팸) 차단 + `createdBy == 본인` 강제
- ✅ 타인 `feedback` 열람 차단
- ✅ 레거시 top-level `/records` 전면 차단

---

## 3. ⚠️ 규칙만으로 못 닫는 잔존 위험 — **팀 결정: 의도적으로 유지 + 로그 모니터링 (2026-05-28)**

**회원이 콘솔에서 본인 `member/{email}.memberships`를 직접 조작**(무한 회원권/무료 quota)하는 경로는
이 규칙으로 **완전히 막지 못한다.** 이유: 예약 quota 감산이 회원 본인의 self-write에 의존하기 때문.

### 팀 결정 (현재 운용 방침)

server-side quota callable(예: `reserveClass` Cloud Function) 도입 비용/리스크와, 본 잔존 위험의
실제 발생 가능성을 저울질한 결과 — **member self-write를 의도적으로 허용한 상태로 운영**하기로 결정.
실제 조작 행위가 발생했는지를 **Cloud Logging으로 사후 감지**하는 방향으로 대응한다.

> ⚠️ 이는 "닫지 못한" 것이 아니라 **"열어둔 채로 감시하기로 한"** 항목이다. 운영 중 의심 패턴이 누적되면
> 아래 "완전 차단을 위한 후속" 절로 즉시 전환할 수 있도록 코드/테스트는 그대로 준비해 둔다.

### 모니터링 가이드 (Cloud Logging)

1. **Firestore Data Access 로그 활성화** — GCP Console → IAM & Admin → Audit Logs → "Cloud Firestore"
   의 **Data Read / Data Write**를 켠다. (기본 OFF. 활성화 시 약간의 로그 비용 발생.)
2. **회원 문서 write 로그 필터** (Logs Explorer 쿼리):
   ```
   protoPayload.serviceName="firestore.googleapis.com"
   protoPayload.methodName=~"google.firestore.v1.Firestore.(Write|Commit|UpdateDocument)"
   protoPayload.resourceName=~"projects/sweat-bridge/databases/.+/documents/box/[^/]+/member/[^/]+$"
   ```
3. **의심 시그널**:
   - 동일 회원이 본인 member 문서에 짧은 시간 내 다수 write (정상 예약은 1회/요청).
   - `protoPayload.authenticationInfo.principalEmail` 이 문서 ID(email)와 동일하면서 `memberships`
     배열 크기·만료일·`quota.remaining`이 비현실적으로 변하는 경우(앱 UI로는 만들 수 없는 값).
   - User-Agent가 공식 앱이 아닌 직접 API 호출(REST/curl) — `protoPayload.requestMetadata.callerSuppliedUserAgent`.
4. **알림** — Log-based Metric으로 위 필터의 분당 카운트가 임계치(예: 5/min)를 넘으면 Slack/이메일 알림.
   (정상 트래픽 baseline을 일주일 관찰 후 임계치 설정 권장.)
5. **사고 대응** — 의심 회원 발견 시: (a) `auditLog` 컬렉션이 있다면 변경 이력 대조, (b) 해당 회원의
   `memberships` 배열을 직전 정상 상태로 복원, (c) 필요 시 즉시 server-side callable로 전환.

### 완전 차단으로 전환할 때 (보존된 후속 경로)

위 모니터링에서 실제 악용이 감지되면 아래 단계로 전환:
- 예약 quota 증감(`decrementCount`/`incrementCount` 반영)을 **Cloud Function(Admin SDK) callable**로 이전 →
  서버에서 검증 후 quota만 갱신.
- 그 뒤 `member/{email}` write를 **coach-only**로 잠그고, 프로필 수정도 코치 경유 또는
  필드 화이트리스트(이름/전화 등 비민감 필드만 self-update)로 제한.
- 전환 완료 시 [firestore-tests/rules.test.js](../firestore-tests/rules.test.js)의 `R7` 케이스를
  `assertSucceeds` → `assertFails`로 뒤집어 회귀 방지.

---

## 3-bis. ⚠️ T0가 깨뜨리는 기존 동작 — 회원가입 중복 체크 (배포 전 인지 필수)

모바일 회원가입은 미인증 상태(Auth 계정 생성 전)에서 `/user` 컬렉션을 조회해 중복을 확인한다:
- 이메일: `isEmailDuplicated` → `get /user/{email}`
- 닉네임: `isFieldDuplicated` → `list /user where nickName == ...`

T0 규칙은 `/user`의 `get`을 본인/코치/관리자에게만, `list`를 관리자에게만 허용한다.
→ **미인증 신규 가입자는 두 조회 모두 `permission-denied`** 가 된다. 영향:
- **이메일 중복**: 회원가입 완료 단계의 `createUserWithEmailAndPassword`가
  `email-already-in-use`로 최종 차단하므로 **기능적 안전망 있음**(조기 안내만 사라짐).
- **닉네임 중복**: Auth 같은 백스톱이 없어 **중복 닉네임이 통과될 수 있음** → 별도 조치 필요.

### 권장 후속 (T1-3과 같은 server-side 방향)
- 닉네임 유일성 검사를 **callable/Admin SDK**로 이전(서버가 `/user` 조회), 또는
- 규칙에서 가입 플로우용으로 닉네임 유일성 확인 전용 경로(예: 집계 문서)만 제한적으로 허용.
- 참고: 이 항목은 T1-3(가짜 로그인 제거)에서 이메일 enumeration을 닫으면서 함께 드러난 것.
  `fetchSignInMethodsForEmail`도 enumeration protection으로 폐기되어, "이메일/닉네임이
  존재하는가"를 클라이언트에서 묻는 패턴 자체가 더 이상 유효하지 않다 → server-side로 가야 한다.

---

## 4. 배포 절차 (단일 프로젝트 — staging 없음)

> ⚠️ staging 없이 prod 직행. **저트래픽 시간대(예: 새벽)** 에 배포하고 Logs Explorer를 한 탭에
> 띄운 채로 진행한다. 문제가 생기면 4-5의 롤백 명령을 다른 탭에 미리 준비해 둔다.
>
> **이 배포가 바꾸는 것**: Firestore 보안 규칙만. 웹/모바일 앱 코드 배포는 별도 사이클(이 절차와 무관).

### 4-1. 로컬 에뮬레이터 테스트 (사전)
```bash
cd react_web_app/firestore-tests
npm install
npm run test:rules     # firebase emulators:exec 로 ../firestore.rules 검증
```
- 매트릭스 + reconciliation + admin/casing 케이스 모두 통과해야 함.
- Java 17+ 및 firebase-tools 설치 필요.

### 4-2. 데이터 마이그레이션 (먼저 수행 — 규칙 배포 전 필수)

`role: 'operator'` 인 기존 유저를 `'admin'` 으로 일괄 변경. **이 단계를 빼먹으면 그 유저들은
규칙 배포 직후 어드민 콘솔 접근권한을 잃는다.**

```bash
cd react_web_app/scripts
npm install

# 1) 서비스 계정 키 발급:
#    Firebase Console → 프로젝트 설정 → 서비스 계정 → "새 비공개 키 생성"
#    내려받은 JSON을 scripts/service-account.json 으로 저장 (.gitignore로 보호됨).

# 2) 드라이런 — 어떤 유저가 영향 받는지만 출력
npm run migrate:operator-to-admin

# 3) 결과 확인 후 실제 실행
npm run migrate:operator-to-admin:execute
```
- 영향 유저가 0건이면 그대로 통과.
- 종료 후 Firebase Console에서 표본 1~2건 `role: 'admin'` 으로 바뀌었는지 육안 확인.

### 4-3. 규칙 배포
```bash
cd react_web_app
firebase deploy --only firestore:rules
```
배포 직후 5~10분간 Logs Explorer를 띄워두고 §4-4의 스모크를 돌리는 동안 동시 감시.

### 4-4. 배포 직후 자동 스모크 (live-smoke.js, ~30초) — 권장

prod Firestore에 직접 붙어서 규칙 매트릭스를 검증한다. 에뮬레이터 테스트와 동일한 어설션을
실제 환경에 대해 돌리므로, "배포가 의도대로 갔는가"를 코드로 답할 수 있다.

#### 최초 1회 설정 (약 15분)

1. **테스트 Auth 계정 3개 생성** — Firebase Console → Authentication → 사용자 추가:
   - `qa-admin@sweat.test`
   - `qa-coach@sweat.test`
   - `qa-member@sweat.test`
   - 비밀번호는 임의로 생성하되 .env에 기록할 것.
2. **/user 문서 3개 생성** — Firestore Console → `/user` 컬렉션, 이메일을 문서 ID로:
   - `qa-admin@sweat.test` → `{ role: 'admin', boxName: '' }`
   - `qa-coach@sweat.test` → `{ role: 'coach', boxName: '<실제 박스 X 이름>' }`
   - `qa-member@sweat.test` → `{ role: 'MEMBER', boxName: '<실제 박스 X 이름>' }`
3. **/box/{X}/member/qa-member@sweat.test 문서 생성** (L13 본인 member doc get 검증용):
   - 최소 필드: `{ email, realName, boxName }`. realName은 'QA Member' 등 임의로.
4. **.env 작성** — `firestore-tests/.env.example` 복사 → `firestore-tests/.env`:
   - Firebase Web SDK config (apiKey 등): `react_web_app/src/config/firebase.ts`에서 복붙.
   - 3개 테스트 계정의 이메일/비밀번호.
   - `TEST_BOX` = qa-coach/qa-member가 속한 실제 박스 이름 (예: `SWEAT`).
   - `OTHER_BOX` = 다른 실제 박스 이름 (예: `CFBD`) — cross-tenant 거부 검증용.
   - `OTHER_MEMBER_EMAIL` (선택) = `TEST_BOX`의 다른 회원 이메일. 미설정 시 L14만 스킵.
5. (한 번만) 의존성 설치:
   ```bash
   cd firestore-tests
   npm install
   ```

#### 매 배포 후 실행

```bash
cd firestore-tests
npm run smoke:live
```

출력 예시:
```
=== Firestore 규칙 라이브 스모크 (project: sweat-bridge) ===
── 관리자(admin) (qa-admin@sweat.test) ──
  ✓ L1. 박스 목록 list
  ✓ L2. 박스 문서 get (SWEAT)
  ✓ L3. /user list (관리자만 가능)
  ...
=== 결과: 16 pass / 0 fail (4.2s) ===
🎉 규칙이 의도대로 동작함.
```

실패 시 어떤 케이스가 왜 깨졌는지 줄 단위로 출력 → 해당 경로의 `firestore.rules` 수정 후
`firebase deploy --only firestore:rules` 다시 돌리고 스모크 재실행.

> 보안: live-smoke.js는 **READ만** 수행한다. 어떠한 prod 데이터도 쓰거나 지우지 않는다.
> 따라서 안심하고 prod 대상으로 반복 실행해도 무방.

### 4-4b. (옵션) UI 수동 스모크 매트릭스 (10분)

자동 스모크는 규칙의 allow/deny만 검증한다. UI 회로(폼/네비/스토어)에 문제가 있어도
규칙은 통과할 수 있으므로, **큰 변경 직후엔 아래 수동 체크도 한 번 권장**한다.

각 항목을 실제 계정으로 1회씩 확인. 하나라도 "기대와 다름" 이면 즉시 4-5로 롤백.

**관리자 계정** (`role: 'admin'`)
- [ ] `/admin/*` 콘솔 진입 OK
- [ ] 박스 목록 조회 OK
- [ ] 유저 목록(타 박스 포함) 조회 OK

**코치 계정** (본인 박스 X)
- [ ] 대시보드 로딩 OK
- [ ] 본인 박스 회원/매출/수업/락커 조회 + 수정 OK
- [ ] (있다면) 다른 박스 회원/매출 조회 시도 → **거부** 확인

**일반 회원 계정** (모바일, 박스 X 소속)
- [ ] 본인 프로필 조회/수정 OK
- [ ] 박스 X 수업 일정 조회 OK
- [ ] 박스 X 수업 예약 → 성공 + quota 차감 반영
- [ ] (있다면) 박스 Y 무언가 조회 → 거부 확인

**미인증 / 가입 신청자**
- [ ] 회원가입 흐름: 박스 목록 선택까지 진입 OK
- [ ] (가입 신청 단계에서) `applied/applieddoc` 본인 키 쓰기 OK

### 4-5. 롤백 (필요 시)

가장 빠른 두 가지:
1. **이전 규칙으로 즉시 재배포** — git에서 직전 커밋의 firestore.rules로 되돌리고 `firebase deploy --only firestore:rules`.
2. **콘솔에서 즉시 수정** — Firebase Console → Firestore → 규칙 탭에서 직접 편집·게시.
   단, 콘솔 수정 후엔 **반드시 repo의 firestore.rules도 동기화**할 것(다음 deploy가 덮어씀).

극단적 비상시 임시로 `allow read, write: if request.auth != null;` 로 인증만 요구하게 풀어두고
(여전히 미인증 차단은 됨), 차분히 원인 디버깅 후 재배포해도 됨.

### 4-6. 24시간 모니터링

Logs Explorer 두 필터를 띄워둔다:
```
# A. 권한 거부 추이 (정상 트래픽이면 거의 0이어야 함)
protoPayload.serviceName="firestore.googleapis.com"
protoPayload.status.code=7
```
```
# B. R7 모니터 — 회원이 본인 member 문서를 직접 쓰는 트래픽 (§3 참고)
protoPayload.serviceName="firestore.googleapis.com"
protoPayload.methodName=~"google.firestore.v1.Firestore.(Write|Commit|UpdateDocument)"
protoPayload.resourceName=~"projects/sweat-bridge/databases/.+/documents/box/[^/]+/member/[^/]+$"
```
- A가 급증 → 정상 플로우인지 확인 후 규칙 false-positive 보강.
- B는 정상 baseline을 1주일 관찰하고 임계치 기반 알림 설정.

---

## 5. 배포 전 팀이 확인할 가정 (audit 기반, 코드로는 단정 못 한 것)

1. **인증 토큰에 `email` 클레임 존재** — 이메일/비밀번호 로그인이라 일반적으로 참.
   규칙 전체가 `request.auth.token.email`을 문서 ID로 사용하므로 이게 깨지면 전부 거부됨.
2. **`user/{email}` 문서의 `role` 값** — 규칙은 `role.lower()`로 비교하므로
   `COACH`/`coach` 모두 코치로 인정, `admin`만 플랫폼 관리자로 인정한다.
   **기존 `role: 'operator'` 유저는 이번 통합으로 무권한 상태가 되므로 `'admin'`으로 마이그레이션 필수.**
   콘솔이 거부되는 일이 없도록 배포 전에 관리자 계정의 role 값이 정확히 `admin`인지 점검 권장.
3. **회원가입 시점**에 box 목록 읽기가 user 문서 생성보다 먼저 일어남 — `box` 읽기는
   `isSignedIn()`만 요구하므로 user 문서 없이도 통과(검증 완료).
4. **모바일 `applied` 최초 생성** — create 분기(`keys().hasOnly`)로 처리(검증 완료).

---

## 6. firebase.json 통합 메모

현재 functions는 모바일 repo([sweatBridge-app/firebase.json](../../../sweatBridge-app/firebase.json))에서,
firestore 규칙은 이 repo에서 관리한다(같은 `sweat-bridge` 프로젝트). 장기적으로는 monorepo 루트에
통합 `firebase.json`을 두는 편이 혼선이 적다. 당장은 분리 운영해도 무방하되,
**규칙 배포는 항상 `react_web_app/`에서** 수행한다(`firebase deploy --only firestore:rules`).
