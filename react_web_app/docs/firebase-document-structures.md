# Firebase Document Structures

`src/repositories`에서 접근하는 Firebase 문서 구조 정리다.
기준은 현재 React 앱 코드이며, 실제 저장 payload와 JSON 예시를 기준으로 정리했다.

## 개요

### 최상위 컬렉션

```text
user/{email or auto-doc-id}
box/{boxName}
box/{boxName}/member/{email or auto-doc-id}
box/{boxName}/class/{docKey}
box/{boxName}/membership/plansDoc
box/{boxName}/revenue/{year}
box/{boxName}/lockers/lockerdoc
box/{boxName}/applied/applieddoc
```

## 1. BoxRepository

파일: `src/repositories/boxRepository.ts`

### 문서 경로

```text
box/{boxName}
```

### 문서 ID 규칙

- `boxName`

### 예시

```json
{
  "boxName": "SWEAT",
  "email": "box@example.com",
  "representative": "김코치",
  "phone": "010-1234-5678",
  "address": {
    "zoneCode": "12345",
    "roadAddress": "서울시 강남구 테헤란로 1",
    "detailAddress": "2층"
  },
  "description": "크로스핏 박스",
  "coaches": [
    {
      "name": "김코치",
      "phone": "01011112222",
      "email": "coach1@example.com"
    }
  ]
}
```

### 앱 캐시 규칙

- Firebase의 `box/{boxName}.coaches`는 화면에서 `localStorage`에도 캐시된다
- 캐시 키: `box:{boxName}:coaches`
- 조회 완료 플래그 키: `box:{boxName}:coachesFetched`
- 캐시가 없고 조회 완료 플래그도 없을 때만 Firebase 조회를 수행한다
- Firebase 조회 결과가 빈 배열이어도 플래그를 기록해 반복 조회를 방지한다

## 2. MemberRepository

파일: `src/repositories/memberRepository.ts`

MemberRepository는 한 종류의 문서만 다루지 않는다. 아래 3개 영역을 접근한다.

### 2-1. 회원 문서

#### 문서 경로

```text
box/{boxName}/member/{memberDocId}
```

#### 문서 ID 규칙

- 현재 코드상 두 패턴이 혼재한다.
- 기본 패턴: `email`
- 예외 패턴: `addMember()`는 `addDoc()`를 사용하므로 auto ID 생성

#### 예시 기준 포함 필드

- 회원 기본 정보: `email`, `realName`, `nickName`, `gender`, `birthDate`, `phone`
- 부가 정보: `joinedAt`, `memo`, `lockerHistory`
- 회원권 정보: `memberships[]`
- `futureMemberships`는 화면 모델에 존재하지만, 저장은 주로 `memberships` 배열 기준으로 처리된다.
- `memberships[].assignee`는 운영자가 임의 입력하는 값이 아니라 현재 박스 코치 목록에서 선택한 이름을 저장한다

#### 예시

```json
{
  "email": "member@example.com",
  "realName": "홍길동",
  "nickName": "길동",
  "gender": "M",
  "birthDate": "1990-01-01",
  "phone": "010-2222-3333",
  "joinedAt": "Timestamp",
  "memo": "어깨 주의",
  "memberships": [
    {
      "key": "membership_001",
      "plan": "주3회 1개월",
      "type": "countPass",
      "purchase": {
        "price": 180000,
        "paid": 180000,
        "paymentType": "card",
        "at": "Date"
      },
      "quota": {
        "total": 12,
        "used": 2,
        "remaining": 10
      },
      "period": {
        "startDate": "Date",
        "endDate": "Date",
        "originalEndDate": "Date"
      },
      "holds": [],
      "refund": {
        "isRefunded": false,
        "at": null,
        "refundAmount": 0,
        "reason": null,
        "assignee": null
      },
      "adjustments": [],
      "createdAt": "Date",
      "updatedAt": "Date",
      "assignee": "coach-a",
      "deleted": false,
      "deletedAt": null,
      "boxName": "SWEAT"
    }
  ],
  "lockerHistory": [
    {
      "lockerNum": 101,
      "startDate": "2026-04-01",
      "endDate": "2026-04-30",
      "createdAt": "Timestamp",
      "key": "locker_001",
      "price": "30000",
      "paymentType": "card"
    }
  ]
}
```

### 2-2. 사용자 문서

#### 문서 경로

```text
user/{userDocId}
```

#### 문서 ID 규칙

- `updateUserBoxName()`는 `user/{email}` 직접 접근
- `getUsersByField()`와 `updateUsersByEmail()`는 `where('email' == ...)` 쿼리 사용
- 즉, 현재 코드는 문서 ID가 항상 이메일이라고 완전히 가정하지는 않지만, 일부 메서드는 이메일 문서 ID를 전제로 한다

#### 예시 기준 포함 필드

- `boxName`, `email`, `realName`, `nickName`, `phone`, `role`
- 경우에 따라 `gender`, `birth`, `birthDate`, `joinedAt`, `memberships` 포함 가능

### 2-3. 가입 신청 문서

#### 문서 경로

```text
box/{boxName}/applied/applieddoc
```

#### 문서 ID 규칙

- 고정 문서 ID: `applieddoc`

- 문서 전체가 `email -> 신청자 정보` 맵 형태다.

#### 예시

```json
{
  "user1@example.com": {
    "email": "user1@example.com",
    "realName": "신청자1",
    "phone": "010-5555-6666",
    "birth": "1998-03-12"
  },
  "user2@example.com": {
    "email": "user2@example.com",
    "realName": "신청자2",
    "phone": "010-7777-8888"
  }
}
```

## 3. ClassRepository

파일: `src/repositories/classRepository.ts`

### 현재 저장/수정/삭제 경로

```text
box/{boxName}/class/{docKey}
```

### 문서 ID 규칙

- `docKey`
- 시간 기반 문자열 키를 사용하는 구조로 보이며, repository 레벨에서는 문자열만 취급한다

### 예시

```json
{
  "cap": 12,
  "coach": "김코치",
  "date": "Timestamp",
  "reserved": [
    "member1@example.com",
    "member2@example.com"
  ]
}
```

### 주의점

- `getClass()`만 레거시 경로를 읽는다.

```text
box/{boxName}/class/{date}/time/{time}
```

- 반면 `setClassDocument()`, `updateClassDocument()`, `deleteClassDocument()`는 모두 `box/{boxName}/class/{docKey}`를 사용한다.
- 즉, 현재 repository 내부에 구 경로와 신 경로가 공존한다.

## 4. MembershipRepository

파일: `src/repositories/membershipRepository.ts`

MembershipRepository는 회원권 플랜 문서와 회원 문서의 `memberships` 배열을 다룬다.

### 4-1. 회원권 플랜 문서

#### 문서 경로

```text
box/{boxName}/membership/plansDoc
```

#### 문서 ID 규칙

- 고정 문서 ID: `plansDoc`

#### 예시

```json
{
  "plans": [
    {
      "plan": "주3회 1개월",
      "type": "countPass",
      "count": "12",
      "duration": 30,
      "price": "180000"
    },
    {
      "plan": "무제한 1개월",
      "type": "periodPass",
      "count": "0",
      "duration": 30,
      "price": "220000"
    }
  ]
}
```

### 4-2. 회원 문서의 `memberships`

#### 문서 경로

```text
box/{boxName}/member/{email}
```

#### 저장 필드

```json
{
  "memberships": []
}
```

- `setUserMemberships()`는 `merge: true`로 저장하므로 회원 문서 전체를 덮어쓰지 않고 `memberships` 필드만 갱신한다.

## 5. RevenueRepository

파일: `src/repositories/revenueRepository.ts`

### 문서 경로

```text
box/{boxName}/revenue/{year}
```

### 문서 ID 규칙

- 연도 문자열 또는 숫자: `2026`, `2025`

- 연도 문서 안에 `month -> transactionKey -> RevenueData` 구조로 중첩된다.

### 계층 예시

```text
box/SWEAT/revenue/2026
  ├─ "4"
  │   ├─ "membership_001"
  │   │   └─ RevenueData
  │   └─ "locker_001"
  │       └─ RevenueData
  └─ "5"
      └─ "membership_002"
          └─ RevenueData
```

### 예시

```json
{
  "4": {
    "membership_001": {
      "assignee": "coach-a",
      "createdAt": "Timestamp",
      "id": "member@example.com",
      "paymentType": "card",
      "plan": "주3회 1개월",
      "price": "180000",
      "realName": "홍길동",
      "type": "countPass",
      "refundAmount": "0"
    },
    "locker_001": {
      "assignee": "",
      "createdAt": "Timestamp",
      "id": "member@example.com",
      "paymentType": "cash",
      "plan": "사물함 이용권",
      "price": "30000",
      "realName": "홍길동",
      "type": "locker",
      "refundAmount": "0"
    }
  }
}
```

### 주의점

- 월 키는 숫자가 아니라 문자열로 저장된다. 예: `"4"`, `"12"`
- 거래 키는 회원권의 `membership.key` 또는 락커 결제 키를 사용한다
- `assignee`는 회원권/락커의 담당자 드롭다운에서 선택된 코치 이름이 저장된다

## 6. LockerRepository

파일: `src/repositories/lockerRepository.ts`

### 문서 경로

```text
box/{boxName}/lockers/lockerdoc
```

### 문서 ID 규칙

- 고정 문서 ID: `lockerdoc`

- 문서 전체가 `락커번호 문자열 -> 락커 엔트리 또는 이력 배열` 맵이다.
- 서비스 로직상 현재는 배열 히스토리 형태가 중심이며, 단일 객체도 호환한다.

### 예시

```json
{
  "101": [
    {
      "number": 101,
      "state": "unused",
      "id": "",
      "realName": "",
      "phone": "",
      "assignee": "",
      "note": "",
      "startDate": "",
      "endDate": "",
      "createdAt": "2026-04-01",
      "key": ""
    },
    {
      "number": 101,
      "state": "used",
      "id": "member@example.com",
      "realName": "홍길동",
      "phone": "010-2222-3333",
      "assignee": "",
      "note": "",
      "startDate": "2026-04-01",
      "endDate": "2026-04-30",
      "createdAt": "2026-04-01",
      "key": "locker_001",
      "price": "30000",
      "paymentType": "card"
    }
  ],
  "102": [
    {
      "number": 102,
      "state": "na",
      "id": "",
      "realName": "",
      "phone": "",
      "assignee": "coach-a",
      "note": "수리 필요",
      "startDate": "",
      "endDate": "",
      "createdAt": "2026-04-01",
      "key": ""
    }
  ]
}
```

### 주의점

- repository는 단일 문서를 트랜잭션으로 읽고 수정한다
- 각 락커의 최신 상태는 배열 마지막 항목으로 해석한다
- `number` 필드는 타입상 존재하지만, 실제 문서 키가 이미 락커 번호이므로 중복 데이터다
- `assignee`는 락커 해지/상태 변경 시 현재 박스 코치 목록 드롭다운에서 고른 값을 저장한다

## 7. AuthRepository

파일: `src/repositories/authRepository.ts`

AuthRepository는 Firebase Auth와 Firestore를 함께 사용한다.

### Firebase Auth

- `signIn(credentials)` → 이메일/비밀번호 로그인
- `signOut()` → 세션 종료

### Firestore 사용자 조회 경로

```text
user/{userDocId}
```

### 조회 방식

- `where('email', '==', email)` 쿼리로 조회
- 조회 결과에는 보통 `boxName`, `email`, `realName`, `nickName`, `phone`, `role`가 포함된다

## 8. Repository별 요약

| Repository | 경로 | 문서 ID |
| --- | --- | --- |
| `boxRepository` | `box/{boxName}` | `boxName` |
| `memberRepository` | `box/{boxName}/member/{memberDocId}` | 주로 `email`, 일부 auto ID |
| `memberRepository` | `user/{userDocId}` | 혼재, 일부 로직은 `email` 가정 |
| `memberRepository` | `box/{boxName}/applied/applieddoc` | 고정 `applieddoc` |
| `classRepository` | `box/{boxName}/class/{docKey}` | `docKey` |
| `classRepository` | `box/{boxName}/class/{date}/time/{time}` | 레거시 읽기 경로 |
| `membershipRepository` | `box/{boxName}/membership/plansDoc` | 고정 `plansDoc` |
| `membershipRepository` | `box/{boxName}/member/{email}` | `email` |
| `revenueRepository` | `box/{boxName}/revenue/{year}` | 연도 |
| `lockerRepository` | `box/{boxName}/lockers/lockerdoc` | 고정 `lockerdoc` |
| `authRepository` | `user/{userDocId}` | 쿼리 기반 |

## 9. 현재 코드 기준 리스크

### 문서 ID 전략 불일치

- `memberRepository.addMember()`는 auto ID를 사용한다.
- 그러나 `membershipRepository`, `memberService.createMember()`, 여러 로직은 회원 문서 ID를 이메일로 가정한다.
- 회원 문서는 가능하면 `email` 문서 ID로 통일하는 편이 안전하다.

### 사용자 문서 ID 가정 혼재

- `user/{email}` 직접 접근과 `where('email' == ...)` 쿼리가 함께 존재한다.
- `user` 컬렉션도 문서 ID 정책을 명확히 고정해야 한다.

### 클래스 경로 이중화

- `classRepository.getClass()`는 레거시 경로를 읽고, 나머지는 신 경로를 쓴다.
- 실제 운영 데이터가 어느 경로를 사용하는지 확인 후 하나로 정리하는 편이 맞다.
