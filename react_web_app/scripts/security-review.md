# Sweat Bridge 보안 리뷰 (Security Review)

- 작성일: 2026-05-14
- 작성: 두 번째 sweep (백엔드 최적화 머지 후 상태 기준)
- 범위: 웹 (`sweat-bridge-box/react_web_app/`), 모바일 (`sweatBridge-app/`), Cloud Functions (`sweatBridge-app/functions/`), 그리고 Firestore 보안 규칙
- 비교 기준: 첫 번째 sweep (2026-05-14 오전) — 그 당시 발견된 항목 중 backend-optimization 머지로 닫힌 항목은 §부록 A로 분리

이 문서는 "결제 데이터를 다루는 4인 팀이 6개월 안에 무엇을 고쳐야 하는가"에 답한다. 각 항목은 **Why (왜 문제인가)** → **Impact (현실적 피해)** → **Fix (구체적 조치)** → **Verification (확인 방법)** 으로 구성된다. 우선순위는 **티어**로 분리했고, 상위 티어를 다 끝내기 전에 하위 티어를 건드릴 이유는 없다.

---

## 0. Executive Summary

현재 가장 큰 리스크는 **단 한 줄**이다 — Firestore 보안 규칙이 `allow read, write: if true`로 설정돼 있어 인증된 사용자라면 누구나(또는 사실상 누구나) 전체 DB를 읽고 쓸 수 있다. 프론트엔드 코드의 모든 권한 체크는 UI에서만 작동하며, 브라우저 콘솔 한 줄이면 우회된다.

backend-optimization 브랜치 머지로 **데이터 일관성 / 동시성 위험**은 상당 부분 해소됐다 (락커 배정 트랜잭션, 매출 단일 엔트리 갱신, 회원권 추가 batch 등). 하지만 **인증·인가·검증 계층**은 여전히 사실상 부재 상태다.

요약하면 — 백엔드는 **잘 동작하기 시작**했지만 **누구를 위해 동작하는지** 가 정의되지 않았다.

### 한 문장 요약

> 결제·환불·회원권·매출 모든 데이터에 대해 **인증된 사용자 누구나** 읽고 쓸 수 있는 상태이며, 이를 막는 단일 변경(Firestore 규칙 배포)을 이번 주에 처리해야 한다.

---

## 우선순위 매트릭스

| 티어 | 의미 | 항목 수 | 예상 작업량 |
|------|------|---------|-------------|
| **T0 — Emergency** | 지금 당장 (이번 주 내). DB 무방비 상태를 닫는 단일 조치. | 1 | 3~4 인일 |
| **T1 — Critical** | 이번 주~다음 주. 인증/입력 검증 핵심 결함. | 4 | 4~5 인일 |
| **T2 — High** | 이번 스프린트. 데이터/세션 신뢰성. | 5 | 5~7 인일 |
| **T3 — Medium** | 분기 내. 비용·정책·정밀도. | 5 | 4~6 인일 |
| **T4 — Low / Long-term** | 6개월. 인프라·관측성. | 5 | 분기별 1~2 인일 |

**총 추정**: 4인 팀 기준 20~25 인일. 가장 큰 영향(T0~T1)은 6~9 인일이면 끝난다.

---

# 🔴 TIER 0 — Emergency

## 1. Firestore 보안 규칙이 사실상 무방비 상태

### 현재 규칙

사용자가 직접 인용한 현재 배포된 규칙:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // 로그인 여부 상관없이 일단 다 허용 (테스트용)
      allow read, write: if true;
    }
  }
}
```

`if true` — **인증 여부조차 검사하지 않는다.** "테스트용"이라는 주석이 붙어 있지만, 이건 테스트가 아니라 무방비 상태가 프로덕션에 배포된 것이다.

### 왜 문제인가 (Why)

Firestore는 **클라이언트 SDK가 직접 DB에 붙는** 구조다. 즉:
- React 앱의 [src/repositories/revenueRepository.ts:19](../src/repositories/revenueRepository.ts#L19) 같은 코드는 결국 브라우저에서 직접 Firestore REST API를 호출한다.
- Flutter 앱의 [lib/repository/wod_repository.dart](../../../sweatBridge-app/lib/repository/wod_repository.dart) 도 마찬가지다.
- 두 클라이언트는 모두 같은 Firebase 프로젝트 키를 사용하고, 키 자체는 번들에 들어있어서 **공개 정보로 취급해야 한다**.
- 클라이언트 코드의 어떤 권한 체크도 "양심적으로 동작하는 클라이언트"에만 효력이 있다.

악의적 사용자 시나리오는 다음과 같이 작동한다:

```javascript
// 모바일 앱 또는 웹 앱에서 정상 가입 → 인증 토큰 획득
// 브라우저 콘솔에서:
import { getFirestore, collection, getDocs, setDoc, deleteDoc, doc } from 'firebase/firestore';
const db = getFirestore();

// 모든 박스의 모든 매출 내역
const revenues = await getDocs(collection(db, 'box/스웻브릿지강남점/revenue'));
revenues.forEach(d => console.log(d.id, d.data()));

// 다른 박스 회원 PII (이름, 전화, 생년월일, 락커 비밀번호)
const members = await getDocs(collection(db, 'box/CFBD/member'));

// 자기 자신에게 평생권 부여
await setDoc(doc(db, 'box/내박스/member/내이메일'), {
  memberships: [{ type: 'periodPass', period: { startDate: '2026-01-01', endDate: '2099-12-31' }, ... }]
}, { merge: true });

// 다른 박스 회원 전부 삭제
const allMembers = await getDocs(collection(db, 'box/타박스/member'));
for (const m of allMembers.docs) await deleteDoc(m.ref);
```

### Impact (현실적 피해)

| 시나리오 | 결과 |
|---|---|
| 경쟁 박스 직원이 가입해서 매출 조회 | 모든 박스의 일별/월별 매출, 결제수단 비중, 회원 수 등 영업비밀 노출 |
| 일반 회원이 자기 회원권 조작 | 무한 PT, 무한 횟수권. 정산 시점에 박스가 손해 |
| 악의적 회원이 모든 회원 PII 추출 | 이름·전화·생년월일·락커비밀번호. 보이스피싱·스토킹 자료로 악용 가능 |
| 모바일 앱 사용자가 매출 데이터 임의 작성 | `box/{box}/revenue/{year}.{month}.{key}`에 가짜 환불 기록 → 박스 회계 망가짐 |
| FCM 토큰 수집 | 모든 회원에게 임의의 푸시 알림 발송 가능 |
| 피드백 메시지 조회 | 코치와 회원 간 비공개 상담 내용 전체 열람 |
| 다른 박스 WOD 생성 트리거 | `box/{boxName}/wod/{anyId}` 작성 시 Cloud Function이 자동 발화, 모든 회원에게 푸시 스팸 |

게다가 **PIPA(개인정보 보호법)** 관점에서 — 이름·전화·생년월일·결제정보는 모두 개인정보다. 유출 시 신고 의무가 발생할 수 있고, 박스당 매출 데이터까지 노출되면 영업비밀 침해 소송도 가능하다.

### Fix

**§부록 B**에 전체 규칙 초안을 첨부했다. 핵심 원칙:

1. 모든 경로에 `allow read, write: if false`를 기본값으로 두고 명시적으로 화이트리스트한다.
2. **헬퍼 함수 4개**로 인증/역할/박스 소속을 표현한다:
   - `isSignedIn()`
   - `isSelf(email)`
   - `isCoachOf(boxName)`
   - `isMemberOf(boxName)`
3. **테넌트 격리**: 모든 `/box/{boxName}/...` 경로는 해당 박스의 코치만 쓸 수 있고, 해당 박스의 회원만 읽을 수 있다. 다른 박스 코치/회원의 접근은 차단.
4. **데이터 검증**: 결제 금액은 `int && >= 0`, 매출 항목은 필드 셋이 일치해야 함. Firestore 규칙 안에서 타입/범위 검증 강제.
5. **`list` 차단**: `/user`, `/feedback` 컬렉션의 `list` 호출은 막고, `get`만 허용. 이메일 enumeration 방지.

### 배포 절차

1. `react_web_app/firestore.rules` 파일 생성 — §부록 B의 내용 사용 (시작점, 점진적 강화 예정).
2. `react_web_app/firebase.json`에 firestore 섹션 추가:
   ```json
   {
     "firestore": { "rules": "firestore.rules", "indexes": "firestore.indexes.json" },
     "functions": [ ... ]
   }
   ```
3. **Firebase 에뮬레이터 환경에서 먼저 테스트** — 에뮬레이터 없이 프로덕션에 배포하면 **자기 자신 락아웃 위험** 매우 높다.
4. 모든 핵심 시나리오에 대한 rules 테스트 작성 (`firebase emulators:exec`):
   - 회원이 자기 정보를 읽고 수정할 수 있는가? ✓
   - 회원이 다른 회원의 정보를 읽을 수 없는가? ✓
   - 회원이 자기 회원권 가격을 임의로 0으로 수정할 수 없는가? ✓
   - 코치가 자기 박스의 매출은 보지만 다른 박스 매출은 못 보는가? ✓
   - 미인증 사용자는 박스 목록을 보지만 (가입 시) 그 외엔 못 보는가? ✓
   - 가입 신청자는 `/box/{boxName}/applied/applieddoc`에 자기 항목만 쓸 수 있는가? ✓
5. **롤아웃 단계적으로**:
   - 1일차: 신규 규칙을 staging 프로젝트에 배포 → 자체 QA
   - 2일차: 프로덕션 배포, **24시간 모니터링** (Cloud Logging의 `permission-denied` 추이 관찰)
   - 3일차: 발견된 false positive 수정

### Verification

- 위 5번의 모든 항목이 통과해야 한다.
- 배포 후 자기 자신 계정으로 정상 플로우(로그인→대시보드→회원 조회→매출 추가)를 한 번씩 돈다.
- Cloud Logging에서 `protoPayload.status.code=7` (`PERMISSION_DENIED`) 갯수가 24시간 후 안정화되는지 확인.

### 작업량 추정

- 규칙 작성 + 에뮬레이터 테스트: **2~3 인일**
- staging/prod 단계 롤아웃 + 모니터링: **1 인일**
- 총 **3~4 인일** — 4인 팀의 1명이 1주일 안에 끝낼 수 있는 작업.

---

# 🟠 TIER 1 — Critical

## 2. Cloud Function `email.js`에 placeholder 자격증명이 박혀 있음

### 위치

[sweatBridge-app/functions/email.js:5-11](../../../sweatBridge-app/functions/email.js#L5-L11)

```js
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'your email',
    pass: 'your 16digit created password',
  },
});
```

### Why

세 가지 가능성이 있고 모두 나쁘다:

1. **그대로 배포돼 있다** → 피드백 이메일 기능이 작동 안 함. 회원의 피드백/문의가 전혀 코치에게 전달되지 않음.
2. **누군가 콘솔에서 코드를 수정해 배포했다** → 코드 형상관리 밖에 자격증명이 존재. 다음 deploy 때 placeholder로 다시 돌아감.
3. **과거에 실제 비밀번호를 commit했다가 placeholder로 되돌렸다** → git history에 비밀번호가 남아있을 가능성.

### Impact

- 피드백 기능 무력화 (3번이 아닌 경우): 회원이 코치에게 보낸 피드백이 묵살되는 셈.
- Git history 노출 (3번): public/private repo든 무관하게 한번 commit된 비밀번호는 영구히 위험. 외부 협력자 추가 시 노출 위험.

### Fix

1. **Git history 감사 먼저**:
   ```bash
   cd sweatBridge-app
   git log -p functions/email.js | grep -E "pass:|password" | grep -v "your 16digit"
   ```
   실제 비밀번호가 commit된 적이 있다면:
   - Gmail 앱 비밀번호 즉시 재발급
   - `git filter-repo`로 history에서 해당 라인 제거 (또는 BFG)
   - force-push (history 변경 → 모든 팀원이 다시 clone 필요. 코디네이션 필요)

2. **Secret Manager 또는 functions config 사용**:
   ```bash
   # 옵션 A (legacy, 곧 deprecated): functions config
   firebase functions:config:set gmail.user="..." gmail.pass="..."
   
   # 옵션 B (권장): Secret Manager
   firebase functions:secrets:set GMAIL_USER
   firebase functions:secrets:set GMAIL_PASS
   ```

3. **email.js를 다음으로 교체**:
   ```js
   const { onDocumentCreated } = require("firebase-functions/v2/firestore");
   const { defineSecret } = require("firebase-functions/params");
   const nodemailer = require('nodemailer');
   
   const GMAIL_USER = defineSecret("GMAIL_USER");
   const GMAIL_PASS = defineSecret("GMAIL_PASS");
   
   exports.sendFeedbackEmail = onDocumentCreated(
     { document: "feedback/{email}/feedbacks/{docID}", secrets: [GMAIL_USER, GMAIL_PASS] },
     async (event) => {
       const transporter = nodemailer.createTransport({
         service: 'gmail',
         auth: { user: GMAIL_USER.value(), pass: GMAIL_PASS.value() },
       });
       // ... 기존 로직
     }
   );
   ```

### Verification

- `firebase functions:secrets:access GMAIL_USER` → 값이 콘솔에 나오면 OK.
- 테스트 피드백 작성 → `sweatbridgecontact@gmail.com` 인박스에 도착하는지 확인.
- functions 로그에서 `[error]` 없는지.

### 작업량

**0.5 인일** (history 감사 포함).

---

## 3. 모바일 앱이 가짜 로그인 시도로 사용자 존재 여부 확인

### 위치

[sweatBridge-app/lib/repository/auth_repository.dart:75-89](../../../sweatBridge-app/lib/repository/auth_repository.dart#L75-L89)

```dart
Future<bool> userExistsByEmail(String email) async {
  try {
    await authentication.signInWithEmailAndPassword(
      email: email,
      password: 'dummyPassword',
    );
    await authentication.signOut();
    return true;
  } on FirebaseAuthException catch (e) {
    if (e.code == 'user-not-found') {
      return false;
    }
    return true;
  }
}
```

호출되는 곳: `auth_service.dart:46-48`의 `checkDuplicate(isAuth: true)` → `auth_controller.dart`의 회원가입 중복 체크 및 비밀번호 재설정 흐름.

### Why

이 함수는 **틀린 비밀번호로 로그인을 시도해서** 결과 코드로 가입 여부를 판별한다. Firebase Auth에서 이 로직의 부작용:

1. **User enumeration**: 공격자가 이메일 리스트를 돌리면서 가입 여부를 확인할 수 있다. "타겟" 명단 작성에 활용됨.
2. **계정 락아웃 공격(Denial of Service against legitimate users)**: Firebase Auth는 한 계정에 대한 실패 로그인을 누적 카운트한다. 임계치 초과 시 `too-many-requests`로 일시 차단. 즉, **공격자가 의도적으로 실제 회원의 이메일을 반복 호출**하면 그 회원은 진짜 로그인도 못 한다.
3. **비용**: Firebase Auth는 인증 시도당 무료 quota가 있지만, 대량 봇 트래픽이 들어오면 결국 과금.
4. **로그 오염**: 모든 실패가 `auth-failure` 이벤트로 기록돼 진짜 의심 신호와 섞임.

### Impact

가장 현실적인 시나리오:
- 박스 경쟁 관계 또는 개인 원한으로 특정 회원의 이메일을 알고 있는 사람이, 그 회원을 며칠간 앱에 로그인 못 하게 만들 수 있다.
- 회원이 "앱이 안 돼요" 문의 → 박스에서 사유를 찾을 수 없음 → 신뢰 손상.

### Fix

`fetchSignInMethodsForEmail`로 대체:

```dart
Future<bool> userExistsByEmail(String email) async {
  try {
    final methods = await authentication.fetchSignInMethodsForEmail(email);
    return methods.isNotEmpty;
  } on FirebaseAuthException {
    return false;
  }
}
```

이건 인증 시도가 아닌 단순 조회라서 실패 카운터를 올리지 않는다.

**더 나은 방향**: 비밀번호 재설정 흐름에서는 **존재 여부를 노출하지 않는** UX로 전환. 즉:
- "비밀번호 찾기" 버튼 → 이메일 입력 → 무조건 "메일이 발송되었습니다 (등록된 경우)" 메시지 표시. 실제로는 `sendPasswordResetEmail` 호출하고 오류는 모두 swallow.
- 회원가입 중복 체크는 `fetchSignInMethodsForEmail`로 유지하되, "이미 가입된 이메일입니다" 메시지를 살짝 모호하게: "이 이메일은 사용할 수 없습니다" 정도.

### Verification

- 자기 이메일로 회원가입 → 중복 체크 정상 작동
- 존재하지 않는 이메일에 `dummyPassword`로 로그인 시도 후, Firebase Console → Authentication → Users → 실패 시도 로그가 늘지 않는지 확인

### 작업량

**0.5 인일** (함수 교체 + 호출처 4곳 동작 확인).

---

## 4. 모바일 수업 예약 — 동시성 경쟁 미해결

### 위치

[sweatBridge-app/lib/service/reservation_service.dart:259-292](../../../sweatBridge-app/lib/service/reservation_service.dart#L259-L292) (`_reserveMember`)
[sweatBridge-app/lib/repository/class_repository.dart:73-87](../../../sweatBridge-app/lib/repository/class_repository.dart#L73-L87) (`updateReservedPeople`)

### Why

현재 예약 로직:

```dart
// 1. 클라이언트가 클래스 문서를 fetch
final classInfo = await classRepository.fetchClass(...);

// 2. 로컬에서 reservedPeople 배열을 복사·수정
final reservedPeople = List<ReservedPerson>.from(classInfo.reservedPeople ?? []);
reservedPeople.add(ReservedPerson(...));

// 3. 전체 배열을 통째로 write
await classRepository.updateReservedPeople(reserved: reservedPeople);
```

이건 고전적 **read-modify-write race**다. 두 회원이 같은 1초 안에 예약 버튼을 누르면:

| 시각 | 회원 A | 회원 B |
|---|---|---|
| t=0 | reserved = [X, Y] 읽음 | |
| t=10ms | | reserved = [X, Y] 읽음 |
| t=20ms | reserved.add(A) → [X, Y, A] | |
| t=30ms | | reserved.add(B) → [X, Y, B] |
| t=40ms | update({reserved: [X, Y, A]}) | |
| t=50ms | | update({reserved: [X, Y, B]}) ← A의 예약 사라짐 |

`cap=10`인 수업에 9명이 예약된 상태에서 마지막 3명이 동시 클릭하면 모두 성공 메시지를 받지만 실제로는 1명만 reserved에 남는다. 게다가 **`memberRepository.updateMemberships`로 quota는 이미 감산된 상태** ([reservation_service.dart:271-276](../../../sweatBridge-app/lib/service/reservation_service.dart#L271-L276))라서, 예약이 사라진 회원은 횟수만 잃는다.

### Impact

- 인기 수업(예: 토요일 오전 9시 클래스)에서 실제로 예약된 회원과 화면상 보이는 회원이 다를 수 있다.
- 정원 초과(overbooking) 또는 정원 미달(underbooking) 양쪽 모두 발생 가능.
- 회원 quota는 이미 깎인 상태에서 예약이 증발하면 회원 분쟁. "분명 예약했는데요"에 답할 증거가 없음.

> 웹 앱의 `ClassRepository.updateClassDocument`도 동일 패턴이지만, 웹은 코치만 수업을 생성/수정하므로 race 확률은 훨씬 낮다. **모바일이 더 시급.**

### Fix

`runTransaction`으로 read와 write를 한 묶음으로 만든다. Dart 측 패턴:

```dart
Future<bool> _reserveMemberAtomic({
  required String boxName,
  required String classId,
  required ReservedPerson reservedPerson,
  required MembershipInfo? currentMembership,
}) async {
  return await FirebaseFirestore.instance.runTransaction((tx) async {
    final classRef = FirebaseFirestore.instance
      .collection('box').doc(boxName)
      .collection('class').doc(classId);
    final classSnap = await tx.get(classRef);
    
    if (!classSnap.exists) throw Exception('수업 정보가 없습니다.');
    
    final data = classSnap.data()!;
    final cap = data['cap'] as int? ?? 0;
    final reserved = List<String>.from(data['reserved'] ?? []);
    
    // 트랜잭션 안에서 다시 검증
    if (reserved.any((r) => r.startsWith('${reservedPerson.id},'))) {
      throw Exception('이미 예약되어 있습니다.');
    }
    if (cap > 0 && reserved.length >= cap) {
      throw Exception('정원이 가득 찼습니다.');
    }
    
    reserved.add(reservedPerson.toString());
    tx.update(classRef, {'reserved': reserved});
    
    // quota는 같은 트랜잭션 안에서 처리 — class와 member 두 문서를 묶는다
    if (currentMembership?.type == MembershipType.countPass) {
      final memberRef = FirebaseFirestore.instance
        .collection('box').doc(boxName)
        .collection('member').doc(reservedPerson.id);
      final memberSnap = await tx.get(memberRef);
      // memberships 배열 갱신 — current membership의 quota.used를 증가
      // (서비스 레이어에서 미리 계산한 memberships 배열을 그대로 set)
      tx.update(memberRef, {'memberships': updatedMembershipsArray});
    }
    
    return true;
  });
}
```

**주의사항**:
- 트랜잭션 안에서는 모든 `read`가 `write` 이전에 와야 함.
- `arrayUnion`/`arrayRemove`를 쓰면 더 간단해지지만, `cap` 검증을 트랜잭션 안에서 해야 하므로 명시적 read가 필요.
- `reserved`를 `string[]`이 아니라 `array<map>`으로 바꿔두면 `arrayUnion`이 더 안전해지지만 데이터 마이그레이션 비용이 있어 일단은 위 패턴으로.

### Verification

테스트 코드:
```dart
test('동시 예약 시 cap을 넘지 않는다', () async {
  // cap=1인 수업 준비
  await setupClass(cap: 1);
  
  // 두 사용자가 같은 순간에 예약 시도
  final results = await Future.wait([
    service.toggleSelfReservation(memberEmail: 'a@test', ...),
    service.toggleSelfReservation(memberEmail: 'b@test', ...),
  ]);
  
  final successes = results.where((r) => r.action == ReservationAction.reserved).length;
  expect(successes, 1); // 하나만 성공해야 함
});
```

수동 검증 (앱 두 대로):
1. 같은 박스, 다른 회원 둘이 동시에 같은 수업 예약 → 한 명만 성공, 다른 한 명은 "정원 초과" 메시지.
2. 같은 회원이 두 번 빠르게 예약 → 한 번만 quota가 깎임.

### 작업량

**1.5 인일** (모바일만; 웹은 후순위로 동일 패턴 적용 가능).

---

## 5. 락커 비밀번호 평문 저장

### 위치

[sweat-bridge-box/react_web_app/src/types/member.ts:55](../src/types/member.ts#L55)
```ts
lockerPass?: string;
```

저장되는 곳: `/box/{boxName}/member/{email}.lockerPass` ([firebase-structure.md:114](../rules/firebase-structure.md#L114))

### Why

- 락커 비밀번호는 PIN 또는 패스워드 형태로 박스 내 물리적 보안에 직결된다.
- 회원이 다른 서비스와 **같은 PIN을 재사용**할 가능성이 높음 (4자리 PIN의 흔한 패턴).
- 데이터 유출 시(§1의 시나리오) 회원의 다른 계정/물리 보안까지 위협.

### Impact

규칙(§1)이 닫힌 후에도, **코치 권한을 가진 사용자가 모든 회원의 락커 비밀번호에 접근**할 수 있다. 직원 한 명만 신뢰를 잃어도 대량 노출 가능.

### Fix

**옵션 A (권장): 저장하지 않는다.**
- 락커 PIN을 박스 시스템이 알아야 할 이유가 있는지 검토. 회원이 직접 외우는 게 정석.
- 회원이 PIN을 잊어버린 케이스만 처리하면 됨 — 그건 회원이 박스에 와서 새 PIN으로 리셋받는 흐름으로.

**옵션 B: 저장이 필요하다면 클라이언트 측 해시.**
- 입력 → SHA-256(pin + salt) → 저장.
- 인증 시 같은 해시 비교.
- 단, **PIN은 엔트로피가 낮아서** (4자리 = 10,000가지) 해시도 사실상 무력화 가능. salt를 회원별 고유값으로 두고 bcrypt/scrypt로 늘려도 한계 있음.

**옵션 C: 메모만 저장 (현실적 절충).**
- "락커 비밀번호 힌트" 같은 자유 텍스트 필드만 남기고 실제 PIN은 저장하지 않는다.
- 예: "결혼기념일" — 회원만 의미를 안다.

### Verification

- DB 스캔: `lockerPass` 필드가 있는 모든 문서를 찾아 마이그레이션 계획 세우기.
- 회원에게 사전 공지 (PIPA 관점에서 데이터 삭제 통지 권장).
- 마이그레이션 후 필드 제거 + 타입에서도 제거.

### 작업량

**0.5 인일** (옵션 A 선택 시. 옵션 B는 1~2 인일).

---

# 🟡 TIER 2 — High

## 6. localStorage에 토큰·역할 저장 (웹)

### 위치

[react_web_app/src/services/authService.ts:31-34](../src/services/authService.ts#L31-L34), [authService.ts:83-89](../src/services/authService.ts#L83-L89)

```ts
localStorage.setItem('userToken', idToken);
localStorage.setItem('tokenExpiration', idTokenResult.expirationTime);
localStorage.setItem('id', JSON.stringify(idTokenResult));
// ...
localStorage.setItem('userRole', user.role);
```

### Why

1. **XSS = 즉시 토큰 탈취**: React가 기본적으로 XSS를 막아주지만, 한 번이라도 `dangerouslySetInnerHTML`, 안전하지 않은 `<a href>` 처리, 또는 향후 추가될 마크다운 렌더링에서 구멍이 뚫리면 끝. localStorage는 모든 JS에 접근 가능.
2. **`userToken`은 사실상 사용되지 않는다**: Firestore SDK는 `getAuth()`에서 직접 세션을 들고 있고, localStorage 값을 읽지 않는다. 즉, **위험만 있고 효용은 없다**.
3. **`tokenExpiration` 체크가 오작동**: Firebase ID 토큰은 1시간 자동 갱신되지만, [authService.ts:117-126](../src/services/authService.ts#L117-L126)의 `checkTokenExpiration()`은 갱신된 만료 시각을 반영 못 한다. → 1시간마다 강제 로그아웃됨. 사용자가 작업 중간에 끊기는 경험.
4. **`userRole`은 UI 표시용에 불과**: 실제 권한은 Firestore 규칙이 결정. localStorage의 값을 신뢰해서 분기하는 코드는 콘솔에서 `localStorage.setItem('userRole', 'COACH')`로 우회 가능.

### Impact

- T0 (규칙)이 닫히면 #4의 영향은 사실상 없어지지만 #1 XSS 위험은 그대로.
- 사용자 1시간마다 로그아웃 → 운영 불편 (코치가 종일 대시보드 켜놓는 워크플로우와 충돌).

### Fix

1. **`userToken`, `tokenExpiration`, `id` 항목 완전히 제거**:
   - `localStorage.setItem('userToken', ...)` 4줄 제거
   - `isAuthenticated()`을 `getAuth().currentUser !== null` 기반으로 교체
   - 또는 더 React스럽게, `onAuthStateChanged`로 AuthContext 갱신

   ```ts
   // 신규 AuthContext
   useEffect(() => {
     const unsub = onAuthStateChanged(getAuth(), (user) => {
       if (user) {
         setAuthState({ isAuthenticated: true, user: mapUser(user), loading: false });
       } else {
         setAuthState({ isAuthenticated: false, user: null, loading: false });
       }
     });
     return unsub;
   }, []);
   ```

2. **`userRole`은 UI 표시용으로만 유지하되, **모든 권한 분기는 Firestore 규칙에 위임****:
   - 코치 전용 페이지를 숨기는 정도는 OK
   - 단, "코치만 매출 페이지 보임" 같은 분기는 UI 편의이며 실제 권한은 규칙이 막아야 함

3. **`boxName`만 localStorage 유지**: 멀티 박스 전환이 없는 한 캐시로서 합리적.

### Verification

- 브라우저 콘솔에서 `localStorage.clear()` → 페이지 새로고침 → 자동으로 로그인 페이지로 리다이렉트되는지.
- 정상 로그인 후 1시간 30분 대기 → 강제 로그아웃되지 않는지.

### 작업량

**1 인일**.

---

## 7. Cloud Functions가 호출자 권한을 검증하지 않음

### 위치

[sweatBridge-app/functions/push.js:8](../../../sweatBridge-app/functions/push.js#L8) — `sendWodPush`
[sweatBridge-app/functions/email.js:13](../../../sweatBridge-app/functions/email.js#L13) — `sendFeedbackEmail`

### Why

두 함수 모두 **Firestore document creation trigger**다. 즉 누군가 해당 경로에 문서를 쓰면 자동 실행.

- `sendWodPush`: `box/{boxName}/wod/{wodId}` 문서가 생기면 발화. 해당 박스의 모든 회원에게 푸시 알림 발송.
- `sendFeedbackEmail`: `feedback/{email}/feedbacks/{docID}` 문서가 생기면 발화. `sweatbridgecontact@gmail.com`로 이메일 발송.

T0 규칙이 닫히면 권한 자체는 막히지만, **함수 안에 추가 검증이 없다**는 점이 defense-in-depth 측면에서 문제다. 규칙에 단 한 줄의 실수가 있어도 함수는 무방비.

### Impact

- WOD 푸시 스팸: 악의적 사용자가 `box/{타박스}/wod/{auto-id}` 문서를 만들면 그 박스의 모든 회원에게 푸시 알림 전송. FCM 자체는 무료지만, **회원의 신뢰**가 깨짐 ("왜 이 박스에서 알림이?"). 함수 실행/Firestore read 비용도 발생.
- 피드백 이메일 스팸: 같은 패턴으로 박스 운영 계정에 이메일 폭격 가능. inbox 마비.

### Fix

**Defense-in-depth로 함수 안에서 한 번 더 검증:**

`push.js` 보강:
```js
exports.sendWodPush = onDocumentCreated("box/{boxName}/wod/{wodId}", async (event) => {
  const wodData = event.data?.data();
  const { boxName } = event.params;
  
  // 1. createdBy 필드를 강제. 규칙에서 반드시 설정되도록 검증.
  const createdBy = wodData?.createdBy;
  if (!createdBy) {
    console.error('[WOD PUSH] createdBy 누락. 무시.');
    return;
  }
  
  // 2. createdBy가 이 박스의 코치인지 확인
  const userDoc = await db.collection('user').doc(createdBy).get();
  if (!userDoc.exists) return;
  const userData = userDoc.data();
  if (userData.role !== 'COACH' || userData.boxName !== boxName) {
    console.error(`[WOD PUSH] 권한 없는 사용자 ${createdBy}가 박스 ${boxName} WOD 생성 시도.`);
    return;
  }
  
  // 3. 기존 로직 수행
  ...
});
```

**Firestore 규칙 측에서 `createdBy` 강제** (§부록 B):
```javascript
match /box/{boxName}/wod/{wodId} {
  allow create: if isCoachOf(boxName)
    && request.resource.data.createdBy == request.auth.token.email;
  allow update, delete: if isCoachOf(boxName);
  allow read: if isMemberOf(boxName);
}
```

`email.js`도 유사하게 — 피드백 작성자가 본인 이메일 아래에만 쓸 수 있도록 규칙에서 강제하고, 함수에서 한번 더 확인.

### Verification

- 일부러 잘못된 `createdBy`로 WOD 문서 생성 → 함수 로그에서 "권한 없는 사용자" 출력, 푸시 발송 안 됨.
- Firestore 규칙 측에서도 거부.

### 작업량

**1 인일**.

---

## 8. 회원 탈퇴/삭제 시 cascade 누락

### 위치

[react_web_app/src/repositories/memberRepository.ts:65-67](../src/repositories/memberRepository.ts#L65-L67)
```ts
static async deleteMember(box: string, email: string): Promise<void> {
  await deleteDoc(doc(db, `/box/${box}/member`, email));
}
```

### Why

코치가 웹에서 회원을 삭제하면 `/box/{box}/member/{email}` 한 문서만 지워진다. 남는 것들:

- `/user/{email}` — 사용자 본인 프로필
- `/user/{email}/personal_record/pr_doc` — PR 기록
- `/user/{email}/records/*` — WOD 기록
- `/user/{email}/keys/push_token` — FCM 토큰 (여전히 푸시 받음)
- `/user/{email}/attendance/...` — 출석 (실제로는 `member` 하위)
- `/feedback/{email}/feedbacks/*` — 피드백 메시지

### Impact

- **푸시 알림 지속 발송**: 탈퇴한 회원이 박스에서 WOD를 만들 때마다 푸시 알림을 계속 받음. 매우 안 좋은 사용자 경험.
- **PIPA 위반 가능**: 한국 개인정보보호법은 "수집·이용 목적 달성 시 지체 없이 파기" 의무를 부과. 회원 탈퇴 후 데이터를 남기는 건 위법 소지.
- **누적되는 dead data**: 매월 탈퇴자만큼 죽은 데이터 누적 → 비용 증가, 분석 노이즈.

비교: 모바일 앱의 `user_repository.dart:111-137`는 트랜잭션으로 `user` 문서와 `applied` 항목을 함께 지운다. 하지만 그것도 본인 탈퇴 흐름이고 코치가 회원을 지우는 흐름은 없음.

### Fix

`MemberService.deleteMember`를 cascade 버전으로 교체:

```ts
static async deleteMember(box: string, email: string): Promise<void> {
  const batch = writeBatch(db);
  
  // 1. 박스 회원 문서
  batch.delete(doc(db, `box/${box}/member`, email));
  
  // 2. 사용자 프로필
  batch.delete(doc(db, `user/${email}`));
  
  // 3. FCM 토큰
  batch.delete(doc(db, `user/${email}/keys/push_token`));
  
  // 4. PR 문서
  batch.delete(doc(db, `user/${email}/personal_record/pr_doc`));
  
  await batch.commit();
  
  // 5. 서브컬렉션은 batch 한 번에 못 지움 — 별도 처리
  await deleteSubcollection(`user/${email}/records`);
  await deleteSubcollection(`feedback/${email}/feedbacks`);
}

async function deleteSubcollection(path: string) {
  const snap = await getDocs(collection(db, path));
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(d.ref));
  await batch.commit();
}
```

**서브컬렉션 일괄 삭제 주의**: 500건 이상이면 batch 분할 필요. 회원 한 명이 그렇게 많은 기록을 가질 가능성은 낮지만, 만일을 위해 chunked 처리.

**FCM 토큰 cascade는 모바일 앱의 `resign` 흐름에도 추가해야 함** (현재 모바일은 `user` 문서만 지움).

### Verification

- 테스트 회원 추가 → 회원 데이터 한 바퀴 생성 (WOD 기록, 출석, 피드백, FCM 토큰) → 삭제 → Firestore Console에서 모든 경로 비어있는지 확인.
- 삭제된 회원의 FCM 토큰으로 푸시 발송 → 실패하는지.

### 작업량

**1 인일**.

---

## 9. PII가 Cloud Function 로그에 남음

### 위치

[sweatBridge-app/functions/push.js:65, 81-82, 108-110](../../../sweatBridge-app/functions/push.js#L65)

```js
console.log("[WOD PUSH] Users found:", usersSnapshot.size);
for (const doc of usersSnapshot.docs) {
  const userId = doc.id;  // 이메일
  const tokenDoc = await db.collection("user").doc(userId)...
  console.log(`[WOD PUSH] No token for user ${userId}`);
}
console.log(`[WOD PUSH] Successfully sent to ${response.successCount} users, ${response.failureCount} failed.`);
```

`email.js`도 비슷하게 이메일·피드백 내용을 로그에 출력 가능.

### Why

Cloud Logging은 기본적으로 30일 보존하지만 프로젝트 설정에 따라 더 길어질 수 있다. 그 동안:
- 외부 컨설턴트/협력자에게 로그 권한을 잠시 부여하면 PII가 노출됨.
- 로그 export를 다른 서비스로 보내는 설정이 있다면 그쪽으로 흐름.

### Impact

낮음 (외부 노출 가능성이 제한적). 다만 PIPA 관점에서 "최소 필요 원칙" 위반 소지.

### Fix

이메일을 hash 또는 마스킹:

```js
function maskEmail(email) {
  const [local, domain] = email.split('@');
  return `${local.slice(0, 2)}***@${domain}`;
}

console.log(`[WOD PUSH] No token for user ${maskEmail(userId)}`);
```

피드백 내용은 절대 로그에 찍지 않고, 길이만 출력:
```js
console.log(`[FEEDBACK] from ${maskEmail(userEmail)}, content length: ${feedbackData.content?.length}`);
```

### Verification

- 테스트 WOD 생성 → Cloud Logging에서 full email이 나오지 않는지.

### 작업량

**0.5 인일**.

---

## 10. 동시 클래스 생성 시 기존 예약 wipe-out 가능성 (잔존 버그)

### 위치

[react_web_app/src/repositories/classRepository.ts:78-95](../src/repositories/classRepository.ts#L78-L95)

```ts
static async setClassDocument(box: string, docKey: string, data: FirebaseClassData): Promise<void> {
  await setDoc(doc(db, `/box/${box}/class`, docKey), data);
}
```

backend-optimization 플랜의 P0-1은 **호출 횟수**(4주 × 4 = 16회 vs 4회)를 줄였지만, **`setDoc`이 merge: false로 전체 덮어쓰기**라는 근본 문제는 그대로 남았다.

### Why

- 코치 A가 화요일 18:00 수업을 생성 → `reserved: []`로 시작
- 회원들이 예약 시작
- 코치 B가 같은 화요일 18:00 수업을 다시 "4주 반복 생성"으로 등록 → 기존 reservation 통째로 사라짐

이건 동시성이 아니라 **코치 워크플로우 충돌** 케이스. 실제 운영에서 충분히 발생 가능 (특히 다중 코치 박스).

### Impact

- 예약된 회원이 예약 흔적 없이 사라짐. quota는 깎여 있음.
- "분명 예약했는데 출석 체크가 안 돼요" 컴플레인의 또 다른 경로.

### Fix

`setClassDocument`에 `getDoc` 선행 체크 또는 `setDoc(..., { merge: true })` 사용:

```ts
static async setClassDocument(box: string, docKey: string, data: FirebaseClassData): Promise<void> {
  await runTransaction(db, async (tx) => {
    const ref = doc(db, `/box/${box}/class`, docKey);
    const snap = await tx.get(ref);
    if (snap.exists()) {
      // 이미 있으면 reserved 보존
      const existing = snap.data() as FirebaseClassData;
      tx.set(ref, { ...data, reserved: existing.reserved ?? [] });
    } else {
      tx.set(ref, data);
    }
  });
}
```

또는 UX 측면에서: 중복 docKey 감지 시 명시적으로 "이미 등록된 수업입니다" 모달 띄우기.

### Verification

- 회원 예약 있는 수업에 같은 docKey로 재생성 시도 → reservation 보존되거나 충돌 메시지.

### 작업량

**0.5 인일**.

---

# 🟢 TIER 3 — Medium

## 11. Firebase App Check 미설정

### Why

Firebase API 키는 클라이언트 번들에 들어있어 **사실상 공개**다. 키 자체로는 권한이 없지만, 키만 있으면 **누군가 curl/스크립트로** Firebase 서비스(Auth, Firestore, Functions)를 호출할 수 있다.

Firestore 규칙이 인증을 막아주지만, **인증 자체에 대한 abuse**(대량 가짜 가입, 비밀번호 brute-force, Cloud Functions abuse)는 막아주지 않는다.

App Check는 "이 요청이 진짜 우리 앱에서 왔는가"를 검증한다. 웹에서는 reCAPTCHA v3, Android는 Play Integrity, iOS는 DeviceCheck/App Attest 기반.

### Impact

- 대량 가짜 회원가입 (가입 → Firestore에 user 문서 생성 → DB 오염)
- 봇으로 매출 endpoint 폭격 → 비용 증가
- 모바일 IPA/APK reverse engineering → API 직접 호출

### Fix

- 웹: Firebase 콘솔에서 App Check 활성화 → reCAPTCHA v3 provider 설정.
  ```ts
  import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('your-recaptcha-site-key'),
    isTokenAutoRefreshEnabled: true,
  });
  ```
- Android: Play Integrity provider, `firebase_app_check` Flutter 패키지.
- iOS: DeviceCheck provider.
- **enforcement는 단계적으로**: 처음 1주는 monitoring-only 모드, 통과율 99% 확인 후 enforced.

### 작업량

**2 인일** (웹 + Android + iOS + 단계적 enforcement).

---

## 12. 비밀번호 정책이 너무 약함

### 위치

[react_web_app/src/pages/Login.tsx:56-59](../src/pages/Login.tsx#L56-L59)
```ts
if (password.length < 6) {
  alert('비밀번호는 6자 이상이어야 합니다.');
  return;
}
```

모바일도 동일 패턴 (signup flow).

### Why

- 6자 = NIST SP 800-63B의 최소 권장치(8자)보다 낮음.
- 일반적인 password dictionary로 brute-force 가능 시간이 짧음.

### Fix

1. 최소 8자, 권장 10자.
2. 복잡도(특수문자 강제)는 **NIST가 현재 권장하지 않음** — 사용자가 더 약한 패턴 만들게 됨. 길이가 핵심.
3. **HaveIBeenPwned API**로 유출된 비밀번호 차단 (k-anonymity로 PRIVACY-safe):
   ```ts
   async function isPwnedPassword(pw: string): Promise<boolean> {
     const hash = await sha1Hex(pw);
     const prefix = hash.slice(0, 5).toUpperCase();
     const suffix = hash.slice(5).toUpperCase();
     const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
     const text = await res.text();
     return text.split('\n').some(line => line.startsWith(suffix));
   }
   ```

### 작업량

**0.5~1 인일**.

---

## 13. Firestore 규칙 안에 데이터 검증 누락

### Why

§1의 규칙 초안에서 가장 빠뜨리기 쉬운 게 **필드 단위 검증**이다. 예: 회원권 가격 음수, 매출 데이터 필수 필드 누락, refundAmount > price 등.

### Fix

§부록 B의 규칙에서 모든 write에 대해:
```javascript
match /box/{boxName}/revenue/{year} {
  allow update: if isCoachOf(boxName)
    // 모든 새 엔트리에 대해 가격은 양수
    && request.resource.data.diff(resource.data).affectedKeys()
       .hasAll(['$some_validation']);
}
```

각 컬렉션의 핵심 필드를 정리해두고 규칙 작성 시 적용. T0의 규칙 작업과 같이 진행 권장.

### 작업량

T0와 같이 처리 (T0 추정에 포함됨).

---

## 14. 매출 환불 시 락커 매출 처리 누락

### 위치

[react_web_app/src/services/membershipService.ts:519](../src/services/membershipService.ts#L519)

`RevenueService.refundUserMembership`은 호출하지만, 락커 환불에 대해서는 **별도 흐름이 없다**. `LockerService.releaseLocker`는 회원의 lockerHistory에 `releasedDate`만 찍을 뿐 매출 환불 처리는 없음.

### Why

- 락커 이용 중 회원이 환불 요청 → 락커 매출은 그대로 남아있고 환불 기록이 없음.
- 회계 정확도 손상.

### Fix

`LockerService.releaseLocker`에 옵션 파라미터로 `refundAmount`를 받고, 양수일 경우 `RevenueService.updateRevenueEntryField`로 `refundAmount` 갱신.

또는 별도 메서드 `LockerService.refundLockerWithRevenue` 신설.

### Verification

- 락커 매출 있는 회원 해지 + 환불 → revenue 문서에 refundAmount 반영되는지.

### 작업량

**0.5 인일**.

---

## 15. 결제·환불에 대한 audit log 부재

### Why

현재 회원권 환불·매출 삭제·회원권 수정은 `membership.adjustments` 배열에 기록되지만:
- 코치 행위 자체(어떤 코치가 어느 회원의 무엇을 언제 변경)에 대한 별도 로그는 없음
- 분쟁 시 추적 어려움
- 직원 부정 행위 감지 불가

### Fix

`/box/{boxName}/auditLog/{autoId}` 컬렉션 신설. 모든 write 작업에서 동일 batch에 audit 항목 추가:

```ts
{
  at: Timestamp.now(),
  actor: <coach email>,
  action: 'membership.refund',
  target: { type: 'member', email: 'xxx', membershipKey: 'yyy' },
  before: { ... },
  after: { ... },
}
```

작성은 append-only — 규칙에서 update/delete 금지.

### Verification

- 환불 처리 → audit 컬렉션에 entry 추가.
- audit entry 삭제 시도 → 규칙으로 차단.

### 작업량

**1~2 인일**.

---

# 🔵 TIER 4 — Lower priority / Long-term

## 16. 이메일을 문서 ID로 사용 — list 호출 차단 필수

`/user/{email}`, `/feedback/{email}` 경로는 이메일 enumeration의 진입로다. 규칙에서 `list`를 `if false`로 명시 차단 필요 (T0에서 같이 처리).

## 17. macOS Firebase 설정이 iOS 키 재사용

[sweatBridge-app/lib/firebase_options.dart:79-87](../../../sweatBridge-app/lib/firebase_options.dart#L79-L87) — macOS 빌드를 출시하지 않는다면 무시 가능. 출시할 거면 별도 macOS 앱 등록.

## 18. Soft-delete 필드 조작 가능성

`MembershipInfo.deleted`, `RefundInfo.isRefunded` 등을 회원이 직접 false로 되돌리는 시나리오. T0 규칙에서 회원 본인이 자기 memberships 배열을 수정할 수 없도록 (코치만 가능하도록) 막아야 함.

## 19. 모바일 앱의 `tokenExists` then `saveToken` TOCTOU

[push_repository.dart:26-35](../../../sweatBridge-app/lib/repository/push_repository.dart#L26-L35) — 확인 후 저장 사이 race. `set` unconditional로 단순화. 매우 낮은 리스크.

## 20. `lockerHistory`가 회원 문서 안 배열로 누적

회원 한 명이 락커를 100번 사용하면 `member/{email}` 문서가 비대해진다. 1MB 제한에 닿기 전에 별도 subcollection으로 분리하는 마이그레이션 계획 필요. 현재 규모(회원 51명)에서는 문제 없음.

---

# 작업 우선순위 일정 제안 (4인 팀)

| 주차 | 담당자 | 작업 | 인일 |
|------|--------|------|------|
| **1주차** | 1명 | T0-1 Firestore 규칙 작성 + 에뮬레이터 테스트 + staging 배포 | 3 |
| **1주차** | 1명 (병행) | T1-2 email.js 시크릿 관리 + git history 감사 | 0.5 |
| **1주차** | 1명 (병행) | T1-3 모바일 user enumeration 수정 | 0.5 |
| **1주차** | 1명 (병행) | T1-5 lockerPass 처리 결정 + 마이그레이션 시작 | 0.5 |
| **2주차** | 1명 | T0-1 프로덕션 배포 + 24h 모니터링 + false positive 수정 | 1 |
| **2주차** | 1명 | T1-4 모바일 예약 트랜잭션 | 1.5 |
| **2주차** | 1명 | T2-6 웹 localStorage 정리 | 1 |
| **2주차** | 1명 | T2-7 Cloud Function 권한 검증 | 1 |
| **3주차** | 1명 | T2-8 회원 cascade 삭제 | 1 |
| **3주차** | 1명 | T2-9 로그 마스킹 | 0.5 |
| **3주차** | 1명 | T2-10 setClassDocument 트랜잭션 | 0.5 |
| **3주차** | 1명 | T3-12 비밀번호 정책 | 1 |
| **4주차** | 2명 | T3-11 App Check (웹 + 모바일) | 2 |
| **4주차** | 1명 | T3-14 락커 환불 매출 처리 | 0.5 |
| **4주차** | 1명 | T3-15 audit log 컬렉션 | 1.5 |

**4주 총 합**: 약 16 인일 (4인 팀이 4주에 분배하면 1인당 1주에 1일씩).
**남은 T3/T4**: 분기 내 마무리.

---

# 부록 A — 이미 닫힌 항목 (backend-optimization 머지로 해결)

첫 번째 sweep에서 지적했지만 이번 머지로 닫힌 항목들. **다시 보고 안 함**:

| 항목 | 위치 | 닫힌 조치 |
|---|---|---|
| 매출 read-modify-write race | `revenueService.addUserMembership/addLockerRevenue` | `RevenueRepository.setRevenueEntry`로 단일 엔트리 merge write |
| 매출 환불/삭제 전체 연도 스캔 | `revenueService.refundUserMembership/removeUserMembership` | `purchaseAt` 인자로 정확한 연/월 1개만 touch |
| 매출 통계 전체 연도 다운로드 | `revenueService.getRevenueStats` | 현재 연도 1개 문서만 read |
| 회원권 추가 + 매출 불일치 위험 | `membershipService.addUserMembership` | `commitAddMembershipBatch`로 단일 writeBatch 커밋 |
| 회원 승인 시 read 2/write 3 순차 | `memberService.approveApplicant` | `commitApproveApplicantBatch` 단일 batch |
| 회원 거절 시 다중 write | `memberService.rejectApplicant` | `commitRejectApplicantBatch` 단일 batch |
| 락커 배정 3문서 비-원자성 | `Locker.tsx onConfirmAssign` | `assignLockerWithMemberAndRevenue` 3문서 트랜잭션 |
| 락커 해지 시 회원 전체 스캔 | `Locker.tsx onConfirmRelease` | `currentLocker.id` 직접 사용 (회원 컬렉션 스캔 제거) |
| `user` 컬렉션 email where 쿼리 | `memberRepository.getUsersByField` | email 시 `getDoc` 직접 호출로 분기 |
| 수업 4주 반복 16회 write 버그 | `ClassReservation.handleSaveModalResult` | for 루프 제거. `saveClass` 1회 호출 |
| 락커 history `LOCKER_ACTION` 미반영 | `lockerService.assignLockerWithMemberAndRevenue` | 머지 시 `LOCKER_ACTION.ASSIGN` 보존 (이번 작업) |

---

# 부록 B — `firestore.rules` 초안

> 이 규칙은 **출발점**이다. 에뮬레이터 테스트와 staging에서 1주 운영 후 미세조정 권장.

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // ===== Helper 함수 =====
    function isSignedIn() {
      return request.auth != null;
    }
    
    function isSelf(email) {
      return isSignedIn() && request.auth.token.email == email;
    }
    
    function userDoc() {
      return get(/databases/$(database)/documents/user/$(request.auth.token.email)).data;
    }
    
    function userRole() {
      return userDoc().role;
    }
    
    function userBox() {
      // boxName에서 '?' 접두사 제거 (가입 신청 중 상태)
      return userDoc().boxName.trim() == '' ? '' :
             (userDoc().boxName[0] == '?' ? userDoc().boxName[1:] : userDoc().boxName);
    }
    
    function isCoachOf(boxName) {
      return isSignedIn() && userRole() == 'COACH' && userBox() == boxName;
    }
    
    function isMemberOf(boxName) {
      return isSignedIn() && userBox() == boxName;
    }
    
    function isCoachOrMember(boxName) {
      return isMemberOf(boxName); // 코치도 member로 간주
    }
    
    // ===== /user/{email} =====
    match /user/{email} {
      // 본인은 자기 문서 읽고 쓰기 OK
      // 다른 사용자: 같은 박스의 코치만 읽기 OK
      allow get: if isSelf(email)
              || (isSignedIn() && isCoachOf(resource.data.boxName));
      
      // list는 막는다 (이메일 enumeration 방지)
      allow list: if false;
      
      // 본인 외에는 생성·수정·삭제 불가
      // 단, 회원 승인 시 코치가 user.boxName을 갱신하는 경우 허용
      allow create: if isSelf(email);
      allow update: if isSelf(email)
              || (isSignedIn() && isCoachOf(userBox())
                  && request.resource.data.diff(resource.data).affectedKeys()
                     .hasOnly(['boxName']));
      allow delete: if isSelf(email);
      
      // 서브컬렉션: 본인만
      match /personal_record/{doc} {
        allow read, write: if isSelf(email);
      }
      match /records/{recordId} {
        allow read: if isSelf(email)
                 || (isSignedIn() && isCoachOf(get(/databases/$(database)/documents/user/$(email)).data.boxName));
        allow create, update, delete: if isSelf(email);
      }
      match /keys/push_token {
        // 본인만 자기 푸시 토큰 관리
        allow read, write: if isSelf(email);
      }
    }
    
    // ===== /box/{boxName}  =====
    match /box/{boxName} {
      // 박스 목록·정보는 인증된 사용자라면 가입 결정용으로 읽기 허용
      allow get, list: if isSignedIn();
      allow create: if false;  // 박스 생성은 콘솔에서만
      allow update: if isCoachOf(boxName);
      allow delete: if false;
      
      // 회원
      match /member/{email} {
        allow get: if isSelf(email) || isCoachOf(boxName);
        allow list: if isCoachOf(boxName);
        allow create, update, delete: if isCoachOf(boxName);
        
        // 본인이 자기 회원권을 수정할 수 없도록 update 추가 제약
        // (위 isCoachOf만 허용이므로 자동으로 막혀있음)
        
        match /attendance/attendance_doc {
          allow read: if isSelf(email) || isCoachOf(boxName);
          allow write: if isCoachOf(boxName);
        }
      }
      
      // 수업
      match /class/{classId} {
        allow read: if isCoachOrMember(boxName);
        allow create: if isCoachOf(boxName);
        // 회원도 reserved 필드만 변경할 수 있도록 허용 (예약/취소)
        allow update: if isCoachOf(boxName)
                   || (isMemberOf(boxName)
                       && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['reserved']));
        allow delete: if isCoachOf(boxName);
      }
      
      // 회원권 플랜
      match /membership/{doc} {
        allow read: if isCoachOrMember(boxName);
        allow write: if isCoachOf(boxName);
      }
      
      // 락커 (전체 문서가 lockerdoc 하나)
      match /lockers/{doc} {
        allow read: if isCoachOrMember(boxName);
        allow write: if isCoachOf(boxName);
      }
      
      // 매출
      match /revenue/{year} {
        allow read: if isCoachOf(boxName);
        allow write: if isCoachOf(boxName);
      }
      
      // 가입 신청
      match /applied/applieddoc {
        // 본인 신청만 추가 가능 (자기 이메일 키 한정)
        allow read: if isCoachOf(boxName);
        allow create, update: if isSignedIn()
                && request.resource.data.diff(resource.data).affectedKeys()
                   .hasOnly([request.auth.token.email])
              || isCoachOf(boxName);
        allow delete: if isCoachOf(boxName);
      }
      
      // 대시보드 메모
      match /dashboardCoachMemos/{doc} {
        allow read, write: if isCoachOf(boxName);
      }
      
      // WOD
      match /wod/{wodId} {
        allow read: if isCoachOrMember(boxName);
        allow create: if isCoachOf(boxName)
                   && request.resource.data.createdBy == request.auth.token.email;
        allow update, delete: if isCoachOf(boxName);
        
        match /records/{email} {
          allow read: if isCoachOrMember(boxName);
          allow create, update: if isSelf(email);
          allow delete: if isSelf(email) || isCoachOf(boxName);
        }
      }
      
      // Audit log (append-only)
      match /auditLog/{logId} {
        allow read: if isCoachOf(boxName);
        allow create: if isCoachOf(boxName);
        allow update, delete: if false;
      }
    }
    
    // ===== /feedback/{email}/feedbacks/{fbId} =====
    match /feedback/{email}/feedbacks/{fbId} {
      // 본인 또는 본인 박스의 코치
      function ownerBox() {
        return get(/databases/$(database)/documents/user/$(email)).data.boxName;
      }
      allow read: if isSelf(email)
                || (isSignedIn() && isCoachOf(ownerBox()));
      allow create: if isSelf(email)
                || (isSignedIn() && isCoachOf(ownerBox()));
      allow update: if isCoachOf(ownerBox());
      allow delete: if isSelf(email) || isCoachOf(ownerBox());
    }
    
    // ===== /records/{autoId} (레거시) =====
    match /records/{autoId} {
      // 완전 차단
      allow read, write: if false;
    }
  }
}
```

> 주의:
> - 헬퍼 함수 안의 `userDoc()` 호출이 **모든 권한 체크마다 1 read를 추가**한다 (cached within same evaluation). 운영비용 모니터링 필요.
> - `boxName[1:]` 같은 슬라이싱 문법은 Firestore 규칙 v2에서 지원됨.

---

# 부록 C — `firebase.json` 수정

현재 `react_web_app/`에는 `firebase.json`이 없고 모바일 쪽 ([sweatBridge-app/firebase.json](../../../sweatBridge-app/firebase.json))에만 functions 섹션이 있다.

**조치**: `react_web_app/firebase.json` 신설 (또는 모바일 쪽에 firestore 섹션 추가 — 같은 프로젝트라면 한쪽에서만 관리):

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": [
    {
      "source": "../sweatBridge-app/functions",
      "codebase": "default"
    }
  ]
}
```

또는 monorepo 루트에 통합 `firebase.json`을 두는 방안 검토.

`.firebaserc`:
```json
{
  "projects": {
    "default": "sweat-bridge",
    "staging": "sweat-bridge-staging"
  }
}
```

---

# 부록 D — 테스트 plan (T0 규칙 배포 직전)

`firestore.rules` 작성 후 다음 시나리오를 **모두** 에뮬레이터에서 확인:

```bash
firebase emulators:start --only firestore
# 별도 터미널에서
firebase emulators:exec --only firestore "npm test -- rules.test.ts"
```

### 시나리오 매트릭스

| # | 행위자 | 행위 | 기대 결과 |
|---|--------|------|----------|
| 1 | 미인증 | 박스 목록 조회 | ❌ Denied |
| 2 | 미인증 | 자기 회원가입 | ❌ (Auth 흐름에서) |
| 3 | 회원 A (박스 X) | 박스 X 회원 목록 조회 | ❌ Denied (list) |
| 4 | 회원 A | 자기 user 문서 조회 | ✓ OK |
| 5 | 회원 A | 회원 B의 user 문서 조회 | ❌ Denied |
| 6 | 회원 A | 박스 X의 자기 member 문서 조회 | ✓ OK |
| 7 | 회원 A | 박스 X의 회원 B member 문서 조회 | ❌ Denied |
| 8 | 회원 A | 자기 memberships 배열에 무료 회원권 추가 | ❌ Denied (코치만 가능) |
| 9 | 회원 A | 박스 X의 WOD 조회 | ✓ OK |
| 10 | 회원 A | 박스 Y의 WOD 조회 | ❌ Denied |
| 11 | 회원 A | 박스 X의 클래스에 자기 예약 추가 | ✓ OK (`reserved` 필드만) |
| 12 | 회원 A | 박스 X의 클래스 `cap` 변경 | ❌ Denied |
| 13 | 회원 A | 박스 X의 revenue/2026 조회 | ❌ Denied |
| 14 | 코치 (박스 X) | 박스 X revenue 조회 | ✓ OK |
| 15 | 코치 (박스 X) | 박스 Y revenue 조회 | ❌ Denied |
| 16 | 코치 (박스 X) | 박스 X 회원 추가/삭제 | ✓ OK |
| 17 | 코치 (박스 X) | 박스 X WOD 생성 (createdBy 누락) | ❌ Denied |
| 18 | 코치 (박스 X) | 박스 X WOD 생성 (createdBy = 자기 이메일) | ✓ OK |
| 19 | 코치 (박스 X) | 박스 Y WOD 생성 | ❌ Denied |
| 20 | 회원 A | `/records/*` 레거시 컬렉션 read/write | ❌ Denied |
| 21 | 신청자 | 박스 X applieddoc에 자기 이메일로 추가 | ✓ OK |
| 22 | 신청자 | 박스 X applieddoc에 다른 사람 이메일로 추가 | ❌ Denied |
| 23 | 코치 (박스 X) | audit 로그 entry 작성 | ✓ OK |
| 24 | 코치 (박스 X) | audit 로그 entry 수정 | ❌ Denied |
| 25 | 회원 A | audit 로그 entry 작성 | ❌ Denied |

각 시나리오는 `@firebase/rules-unit-testing` 라이브러리로 자동화 권장.

---

# 부록 E — git history 감사 명령

T1-2 처리 시 사용:

```bash
cd sweatBridge-app

# email.js의 모든 변경 이력 확인
git log -p --follow functions/email.js

# 비밀번호 패턴 검색 (Gmail 16자리 앱 비밀번호는 영문/숫자/기호 무작위)
git log -p functions/email.js | grep -E "pass: '[a-z0-9]{16}'"

# 전체 commit에서 잠재적 시크릿 패턴 검색
git log --all -p | grep -E "(password|secret|api[_-]?key)[\"'\s:=]+[\"'][^\"']{8,}[\"']"

# gitleaks 같은 도구 사용 권장 (오탐 적음)
# pip install gitleaks; gitleaks detect --source . --no-git
```

발견 시 즉시:
1. 해당 자격증명 무효화 (Gmail 앱 비밀번호 재발급, API 키 회전)
2. 필요시 `git filter-repo`로 history 정리 + 모든 팀원 재clone
3. 사후 대응: 외부 노출 가능성 평가, 필요 시 사용자 공지
