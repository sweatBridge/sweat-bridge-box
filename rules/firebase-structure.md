# Firestore 데이터베이스 구조

이 문서는 Sweat Bridge 서비스의 Firebase Firestore 전체 트리 구조를 정리한 레퍼런스다.
백엔드 관련 작업을 할 때 어느 경로에 어떤 데이터가 있는지 빠르게 찾을 수 있도록 구성했다.

- **웹 앱** (`sweat-bridge-box`): 박스 관리자용 — 회원/수업/락커/매출/박스 설정
- **모바일 앱** (`sweatBridge-app`, Flutter): 회원/코치용 — WOD, 수업 예약, 출석, 개인 기록, 피드백, 리더보드

사용처 표기:
- 🌐 웹 앱 사용
- 📱 모바일 앱 사용
- ☁️ Cloud Functions 사용
- 🪦 레거시 — 현재 코드는 안 쓰지만 DB에 남아 있음

> 최신 실측 검증은 `scripts/firestore-tree/`로 실행. 이 문서는 2026-04-22 스냅샷(`sweat-bridge` 프로젝트, 2 boxes / 51 users) 기준이다.

---

## 1. 루트 컬렉션 개요

```
firestore/
├── user/                           🌐 📱 ☁️  — 앱 사용자 (모든 이메일 1건)
├── box/                            🌐 📱       — 박스 (헬스장/크로스핏 박스)
├── feedback/                       📱          — 코치/회원 피드백 메시지
└── records/                        🪦          — WOD 기록 레거시 루트 (§5 참고)
```

---

## 2. `/user/{email}` — 사용자 문서

이메일을 문서 ID로 사용하는 모든 앱 사용자의 기본 프로필. 웹 앱의 관리자/코치와 모바일 앱의 회원/코치가 모두 포함된다.

```
/user/{email}                       🌐 📱 ☁️
├── email: string
├── realName: string
├── nickName: string
├── gender: 'M' | 'F' | 'None'
├── birth: string
├── phone: string
├── boxName: string                 ← 가입된 박스 이름 (신청중이면 "?박스명" 접두)
├── role: 'COACH' | 'MEMBER'
├── memberships: Array              ← 모바일 앱이 빠르게 조회하기 위한 미러 (선택)
├── updatedAt: Timestamp
│
├── personal_record/                📱  (서브컬렉션)
│   └── pr_doc
│       └── records: Map<string, string>   ← 운동 이름 → PR 값
│
├── records/                        📱  (서브컬렉션 — WOD 기록 개인 사본)
│   └── {autoId}
│       ├── id: string
│       ├── box: string
│       ├── wodId: string            ← /box/{boxName}/wod/{YYYYMMDD} 참조
│       ├── date: Timestamp
│       ├── title: string
│       ├── type: string             ← ForTime | AMRAP | EMOM | Tabata | Custom
│       ├── isSet: boolean
│       ├── set: number | string     ← 과거 앱 버전에서 문자열로 저장된 문서 존재
│       ├── round: number | string   ← 동일
│       ├── timeCap: string          ← 실측상 문자열
│       ├── scoreType: string        ← time | totalReps | roundsPlusReps | ...
│       ├── score: string
│       ├── isRxd: boolean
│       ├── description: string
│       └── movements: MovementRecord[]
│
└── keys/                           📱 ☁️  (서브컬렉션 — FCM 토큰)
    └── push_token
        ├── token: string
        └── updatedTime: Timestamp
```

**주요 쓰기 경로**:
- 회원가입: `UserRepository.createUserDocuments` — `/user/{email}` + `/user/{email}/personal_record/pr_doc` 배치 생성
- 박스 변경: `/user/{email}.boxName` 업데이트 + `/box/{oldBox}/applied/applieddoc` 정리
- 프로필 수정: `/user/{email}` 업데이트 + `/box/{boxName}/member/{email}` 트랜잭션 동시 업데이트

---

## 3. `/box/{boxName}/...` — 박스 단위 격리 데이터

모든 박스 관련 데이터는 `boxName`(박스 이름, localStorage에 `boxName` 키로 저장) 하위에 격리된다.

### 3.1. 박스 루트 문서

```
/box/{boxName}                       🌐 📱
├── boxName: string
├── email: string
├── representative: string            ← 대표자 이름
├── phone: string
├── address: { zoneCode, roadAddress, detailAddress }
├── description: string
└── coaches: [{ name, phone, email }] ← 코치 목록
```

레포지토리: `src/repositories/boxRepository.ts`

### 3.2. 회원 컬렉션

```
/box/{boxName}/member/{email}        🌐 📱
├── email: string
├── realName: string
├── nickName: string
├── gender: 'M' | 'F'
├── birthDate: string
├── phone: string
├── joinedAt: Timestamp
├── memo: string                     ← 회원 메모
├── lockerPass: string               ← 락커 비밀번호 (선택)
├── lockerHistory: MemberLockerHistory[]
│   └── { lockerNum, startDate, endDate, createdAt, key, price, paymentType }
├── memberships: UserMembership[]    ← 현재/과거 회원권
├── futureMemberships: UserMembership[]
├── updatedAt: Timestamp
│
├── attendance/                      📱  (서브컬렉션 — 출석 이력)
│   └── attendance_doc
│       └── {YYYY}: { {MM}: { {DD}: { {HHMMHHMM}: { coach: string } } } }
│
└── membership/                      🪦  (서브컬렉션 — 레거시)
    └── membership_doc
        └── memberships: UserMembership[]   ← 부모 문서의 `memberships` 배열과 동일 (중복 미러)
```

> 실측(2026-04-22)상 보편적으로 존재하는 필드는 `email, realName, nickName, gender, phone, boxName, memberships`. 나머지(`joinedAt, memo, lockerPass, lockerHistory, birthDate, updatedAt, futureMemberships`)는 선택 필드라 모든 회원 문서에 있지 않을 수 있다.

> `member/{email}/membership/membership_doc`은 DB에는 존재하지만 현재 레포지토리 코드 어디서도 읽거나 쓰지 않는다. 과거 스키마 잔여물로 추정되며 정본은 부모 회원 문서의 `memberships` 배열이다.

**UserMembership 구조** (`src/types/membership.ts`):
```
{
  key: string,
  plan: string,
  type: 'periodPass' | 'countPass',
  purchase: { price, paid, paymentType, at },
  quota: { total, used, remaining },
  period: { startDate, endDate, originalEndDate },
  holds: [{ reason, startDate, endDate, days, assignee }],
  refund: { isRefunded, at, refundAmount, reason, assignee },
  adjustments: Adjustment[],
  createdAt, updatedAt, assignee,
  deleted, deletedAt, boxName
}
```

레포지토리:
- 웹: `memberRepository.ts`, `membershipRepository.ts`
- 앱: `member_repository.dart`, `attendance_repository.dart`

### 3.3. 회원권 플랜

```
/box/{boxName}/membership/plansDoc   🌐
└── plans: MembershipPlan[]
    └── { plan, type, count, duration, price }
```

개별 회원권은 `member/{email}.memberships` 배열에 저장되며, 별도 컬렉션이 아니다.

### 3.4. 수업 컬렉션

```
/box/{boxName}/class/{YYYYMMDDHHMMHHMM}   🌐 📱
├── coach: string
├── cap: number                      ← 정원
├── date: Timestamp
└── reserved: string[]               ← "email,realName,nickName" 포맷 문자열 배열
```

- 문서 ID: 날짜(8) + 시작시간(4) + 종료시간(4) = 16자
- 레거시 경로(`/box/{boxName}/class/{date}/time/{time}`)도 `ClassRepository.getClass`에 남아 있지만 현재는 플랫 구조 사용

### 3.5. 락커 컬렉션

```
/box/{boxName}/lockers/lockerdoc     🌐
└── {lockerNumber}: Locker | Locker[]    ← 락커 번호별 현재/이력 데이터
    └── { number, state, id, realName, phone, assignee, note,
           startDate, endDate, createdAt, key, price, paymentType }
```

- 단일 문서에 전체 락커 맵 저장 (트랜잭션으로 동시성 제어)
- `LOCKER_STATE`: `'used'` | `'unused'` | `'na'` | `'deleted'`
- 실제 데이터의 락커 번호는 불연속 (예: `1–15, 70–80, 110–120`) — 물리적 락커 레이아웃 반영

### 3.6. 매출 컬렉션

```
/box/{boxName}/revenue/{year}        🌐
└── {MM}: { {revenueId}: RevenueData }
    └── RevenueData: { assignee, createdAt, id, paymentType,
                       plan, price, realName, type, refundAmount }
```

- 연도별 1문서, 월별 맵 → 거래별 맵 구조
- `paymentType`: `'card'` | `'cash'` | `'transfer'` | `'point'`
- 월 키는 거래가 있던 달만 존재 (예: `{ "1", "2", "3", "4", "9", "11", "12" }` — 5~8월/10월 거래 없음)

### 3.7. 대시보드 코치 메모

```
/box/{boxName}/dashboardCoachMemos/coachMemoDoc    🌐
├── coachMemo: string
└── updatedAt: Timestamp
```

### 3.8. 가입 신청 컬렉션

```
/box/{boxName}/applied/applieddoc    🌐 📱
└── {email}: MemberApplicantRecord    ← 이메일을 키로 한 맵
    └── { email, realName, phone, birth, boxName: "?boxName", ... }
```

- 모바일 앱에서 회원가입 시 신청 정보 저장
- 웹 앱에서 승인/거절 → 해당 키 삭제 후 `/box/{boxName}/member/{email}` 생성

### 3.9. WOD 컬렉션

```
/box/{boxName}/wod/{YYYYMMDD}        📱 ☁️
├── id: string
├── date: Timestamp
├── title: string
├── type: WodType                    ← ForTime | AMRAP | EMOM | Tabata | Custom
├── round: number
├── set: number
├── timeCap: number
├── scoreType: WodScoreType
├── description: string
├── movements: Movement[]
│   └── { name, measureType, levels: MovementLevel[] }
│
└── records/{email}                  📱  (서브컬렉션 — WOD별 기록 집계)
    ├── email: string
    ├── gender: string
    ├── isRxd: boolean
    ├── realName: string
    ├── nickName: string
    ├── score: string
    └── reference: DocumentReference → /user/{email}/records/{autoId}
```

- 리더보드는 이 `records` 서브컬렉션에서 `isRxd == true`인 항목으로 생성됨
- Cloud Function `push.js`가 WOD 생성 시 푸시 알림 발송
- 실제 DB에는 `YYYYMMDD` 포맷이 아닌 auto-ID 스텁 문서(`{ temp: string }`)가 남아있을 수 있음 — 웹 박스(SWEAT)는 WOD 미사용, 모바일과 연결된 박스(CFBD)만 실제 WOD 데이터 보유

---

## 4. `/feedback/{email}/feedbacks/{feedbackId}` — 피드백

```
/feedback/{email}                    📱
└── feedbacks/{feedbackId}
    ├── title: string
    ├── content: string
    ├── fromUser: boolean             ← true면 회원 발신, false면 코치 발신
    └── timestamp: string             ← ISO 문자열 (Timestamp 아님)
```

- 회원이 작성한 피드백/질문, 코치가 응답
- 수신자(email)별로 묶여 있음
- 문서 ID는 `0`, `1`, `2`…처럼 순번 문자열로 관찰됨

---

## 5. `/records/{autoId}` — 레거시 루트 🪦

```
/records/{autoId}                    🪦
├── date: string
├── score: string
├── box: string
├── wod: string
├── title: string
└── records_db: DocumentReference    ← /user/{email}/records/{autoId} 로 역참조
```

- 현재 레포지토리 코드 어디에서도 읽거나 쓰지 않는다
- 과거 스키마의 WOD 기록 인덱스/비정규화 루트로 추정 (2026-04-22 기준 4건)
- 정본 데이터는 `/user/{email}/records/*`와 `/box/{boxName}/wod/{wodId}/records/*`

---

## 6. 데이터 일관성 주의사항

| 상황 | 주의점 |
|---|---|
| 회원 정보 수정 | `/user/{email}`과 `/box/{boxName}/member/{email}` 두 곳을 트랜잭션으로 동기화 |
| 회원권 수정 | `/box/{boxName}/member/{email}.memberships`가 정본. `/user/{email}.memberships`는 모바일 앱용 미러 |
| 박스 변경 | `boxName` 필드가 `"?박스명"` 접두면 가입 신청 중. `/box/{박스명}/applied/applieddoc`에도 항목 존재 |
| 수업 예약 | `reserved[]`의 "email,realName,nickName" 문자열 포맷 유지. 회원권 `quota.used`도 함께 증감 |
| WOD 기록 | `/user/{email}/records/{autoId}`와 `/box/{boxName}/wod/{wodId}/records/{email}` 동시 생성. 삭제 시 양쪽 모두 |
| 락커 배정 | 단일 문서 트랜잭션. 동시 수정 시 반드시 `runLockerDocumentTransaction` 사용 |
| 매출 기록 | 회원권 구매/환불 시 `revenue/{year}`에도 자동 기록되어야 함 |

---

## 7. 문서 ID 컨벤션

| 경로 | ID 포맷 | 예시 |
|---|---|---|
| `user/{email}` | 이메일 주소 | `hohosemin@yonsei.ac.kr` |
| `box/{boxName}` | 박스 이름 (한글 가능) | `스웻브릿지강남점` |
| `box/.../member/{email}` | 회원 이메일 | `user@example.com` |
| `box/.../class/{id}` | YYYYMMDDHHMMHHMM (16자리) | `202604221800HH1900` |
| `box/.../wod/{id}` | YYYYMMDD (8자리) | `20260422` |
| `box/.../revenue/{id}` | YYYY (4자리) | `2026` |
| `box/.../lockers/lockerdoc` | 고정 문자열 | `lockerdoc` |
| `box/.../membership/plansDoc` | 고정 문자열 | `plansDoc` |
| `box/.../applied/applieddoc` | 고정 문자열 | `applieddoc` |
| `box/.../dashboardCoachMemos/coachMemoDoc` | 고정 문자열 | `coachMemoDoc` |

---

## 8. 경로 → 레포지토리 매핑

### 웹 앱 (`src/repositories/`)

| Firestore 경로 | 레포지토리 |
|---|---|
| `/user/*` | `authRepository.ts`, `memberRepository.ts` |
| `/box/{boxName}` | `boxRepository.ts` |
| `/box/{boxName}/member/*` | `memberRepository.ts` |
| `/box/{boxName}/membership/plansDoc` | `membershipRepository.ts` |
| `/box/{boxName}/class/*` | `classRepository.ts` |
| `/box/{boxName}/lockers/lockerdoc` | `lockerRepository.ts` |
| `/box/{boxName}/revenue/*` | `revenueRepository.ts` |
| `/box/{boxName}/applied/applieddoc` | `memberRepository.ts` |
| `/box/{boxName}/dashboardCoachMemos/*` | `dashboardMemoService.ts` (서비스에서 직접) |

### 모바일 앱 (`sweatBridge-app/lib/repository/`)

| Firestore 경로 | 레포지토리 |
|---|---|
| `/user/{email}` | `user_repository.dart` |
| `/user/{email}/personal_record/pr_doc` | `user_repository.dart`, `pr_repository.dart` |
| `/user/{email}/records/*` | `wod_repository.dart` |
| `/user/{email}/keys/push_token` | `push_repository.dart` |
| `/box/{boxName}` | `member_repository.dart` (fetchBoxInfo) |
| `/box/{boxName}/member/*` | `member_repository.dart` |
| `/box/{boxName}/member/{email}/attendance/attendance_doc` | `attendance_repository.dart` |
| `/box/{boxName}/class/*` | `class_repository.dart` |
| `/box/{boxName}/wod/*` | `wod_repository.dart` |
| `/box/{boxName}/wod/{wodId}/records/*` | `wod_repository.dart` |
| `/box/{boxName}/applied/applieddoc` | `user_repository.dart` |
| `/feedback/*` | `feedback_repository.dart` |

### 레거시 — 참조 코드 없음 🪦

| Firestore 경로 | 비고 |
|---|---|
| `/records/*` | 루트 컬렉션. 현재 어떤 레포지토리/컨트롤러도 읽지 않음 |
| `/box/{boxName}/member/{email}/membership/membership_doc` | 부모 `memberships` 배열과 중복. 현재 어떤 코드도 접근하지 않음 |

### Cloud Functions (`sweatBridge-app/functions/`)

| 기능 | 경로 |
|---|---|
| WOD 푸시 알림 | `/user` (boxName 쿼리) + `/user/{email}/keys/push_token` |
| 이메일 알림 | nodemailer (Firestore 미사용) |
