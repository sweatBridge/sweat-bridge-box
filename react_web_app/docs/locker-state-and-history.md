# Locker State & History Guide

## 개요

Sweat Bridge Box의 락커 관리 시스템은 **상태 기반 추적**과 **히스토리 기반 감사**를 통해 전체 락커 생명주기를 관리합니다.

---

## Locker State (락커 상태)

락커 상태는 4가지이며, 각 상태는 뚜렷한 의미와 우선순위를 가집니다.

### 상태 정의

| 상태 | 값 | 의미 | 라벨 | 사용 가능 여부 |
|------|-----|------|------|--------------|
| **UNUSED** | `unused` | 사용 가능 (비어있음) | "사용 가능" | ✅ 배정 가능 |
| **USED** | `used` | 회원에게 배정됨 | 동적 라벨 | ❌ 배정 불가 |
| **NA** | `na` | 고장 (수리 필요) | "고장" | ❌ 배정 불가 |
| **DELETED** | `deleted` | 삭제됨 (더 이상 사용 안 함) | "삭제됨" | ❌ 배정 불가 |

### 상태 우선순위

```
NA > DELETED > USED > UNUSED
3      2        1       0
```

상태 병합이 필요한 경우 우선순위가 높은 상태가 유지됩니다.

### USED 상태의 동적 라벨

USED 상태의 락커는 시작일(`startDate`)과 종료일(`endDate`)을 기준으로 실시간 라벨이 결정됩니다:

```typescript
// getLockerStateLabel(state, locker) 로직
if (state === USED && startDate && endDate) {
  if (오늘 < 시작일) → "사용 예정"
  if (시작일 <= 오늘 <= 종료일) → "사용중"
  if (종료일 < 오늘) → "만료"
}
```

**예시**:
- 배정일: 2026-03-01, 종료일: 2026-12-31
  - 2026-02-28: "사용 예정"
  - 2026-06-01: "사용중"
  - 2027-01-01: "만료"

---

## Locker Action (락커 액션)

각 상태 변경은 액션(이벤트)으로 기록되며, 히스토리에 남아 감사 추적을 가능하게 합니다.

### 액션 종류

| 액션 | 값 | 의미 | 트리거 조건 |
|------|-----|------|-----------|
| **ASSIGN** | `assign` | 회원 배정 | `assignLocker()` 호출 |
| **RELEASE** | `release` | 반납 (해지) | `releaseLocker()` 호출 |
| **MARK_BROKEN** | `mark_broken` | 고장 등록 | `updateLocker(NA)` 호출 |
| **RESTORE** | `restore` | 고장 복구 | `updateLocker(UNUSED)` 호출 |
| **DELETE** | `delete` | 락커 삭제 | `deleteLocker()` 호출 |

### 액션별 라벨

```typescript
getLockerEventLabel(action): string
  "assign" → "락커 배정"
  "release" → "락커 반납"
  "mark_broken" → "고장 등록"
  "restore" → "고장 복구"
  "delete" → "락커 삭제"
```

---

## Firebase Firestore 저장 구조

### 경로

```
/box/{boxName}/lockers/lockerdoc
```

### 문서 스키마

```typescript
{
  [lockerNumber: string]: Locker | Locker[]
}
```

### 락커 데이터 구조

```typescript
interface Locker {
  number: number;              // 락커 번호
  state: LockerState;          // 현재 상태 (used, unused, na, deleted)
  action?: LockerAction;       // 마지막 액션 (assign, release, ...)
  id: string;                  // 사용자 이메일
  realName: string;            // 회원 이름
  phone: string;               // 연락처
  assignee: string;            // 처리자 이름
  note: string;                // 메모 ([해지] 접두사는 반납 시 자동 추가)
  startDate: string;           // 배정 시작일 (YYYY-MM-DD)
  endDate: string;             // 배정 종료일 (YYYY-MM-DD)
  createdAt: string;           // 생성 일시 (YYYY-MM-DD)
  key?: string;                // 락커 배정 고유 키
  price?: string;              // 가격
  paymentType?: 'cash' | 'card'; // 결제수단
}
```

### 저장 패턴

#### 1️⃣ 단일 객체 (히스토리 없음)

처음 추가하거나, UNUSED 상태의 깨끗한 락커에 배정할 때:

```json
{
  "1": {
    "number": 1,
    "state": "unused",
    "createdAt": "2026-01-01",
    ...
  }
}
```

#### 2️⃣ 배열 (히스토리 있음)

이미 변경 이력이 있으면 배열로 저장 (최신 항목이 배열 마지막):

```json
{
  "2": [
    {
      "number": 2,
      "state": "unused",
      "action": "assign",
      "realName": "홍길동",
      "createdAt": "2025-01-01"
    },
    {
      "number": 2,
      "state": "unused",
      "action": "release",
      "note": "[해지] 멤버십 만료",
      "createdAt": "2025-06-01"
    },
    {
      "number": 2,
      "state": "used",
      "action": "assign",
      "realName": "김철수",
      "createdAt": "2026-01-01"
    }
  ]
}
```

---

## Member의 Locker History

회원 문서에는 배정받은 락커들의 이력이 별도로 기록됩니다.

### 경로

```
/box/{boxName}/members/{email}
```

### 필드

```typescript
interface Member {
  email: string;
  realName: string;
  lockerHistory?: MemberLockerHistory[];  // 배정받은 락커 이력
  lockerPass?: string;                     // 락커 비밀번호
  ...
}

interface MemberLockerHistory {
  lockerNum: number;              // 락커 번호
  startDate: string;              // 배정 시작일 (YYYY-MM-DD)
  endDate: string;                // 배정 종료일 (YYYY-MM-DD)
  createdAt: Timestamp | string;  // 배정 일시
  releasedDate?: string;          // 실제 반납일 (반납되지 않으면 undefined)
  key?: string;                   // 락커 할당 고유 키
  price?: string;                 // 가격
  paymentType?: 'cash' | 'card';  // 결제수단
}
```

### 데이터 흐름

```
1. 회원에게 락커 배정
   ↓
2. lockerService.assignLocker() 호출
   - lockers/lockerdoc 에 Locker 객체 추가
   - members/{email} 의 lockerHistory 배열에 MemberLockerHistory 추가
   ↓
3. 회원이 락커 반납
   ↓
4. lockerService.releaseLocker() 호출
   - lockers/lockerdoc 에 새로운 반납 엔트리 추가 (배열에 append)
   - members/{email} 의 해당 lockerHistory의 releasedDate 설정
```

### 상태 추적

| 상황 | lockerHistory | lockers/lockerdoc |
|------|--------------|------------------|
| 배정됨 (진행중) | `{lockerNum, startDate, endDate, createdAt}` | 배열의 마지막 항목이 USED |
| 반납됨 | `{...위와 동일, releasedDate: "2026-05-01"}` | 배열에 새로운 RELEASE 엔트리 추가 |
| 만료됨 (반납 안 함) | `{...배정정보, releasedDate: undefined}` | USED 상태이지만 endDate 이후 |

---

## 상태 전이 (State Transitions)

### ✅ 가능한 전이

```
UNUSED → USED (배정)
USED → UNUSED (반납)
USED → NA (고장 등록)
NA → UNUSED (고장 복구)
UNUSED/USED/NA → DELETED (삭제)
```

### ❌ 불가능한 전이

```
USED → NA (고장 등록 불가, 배정 회원이 있으면)
DELETED → 다른 상태 (삭제된 락커는 재활성화 불가)
```

### 배정 로직

```typescript
// assignLocker() 의 히스토리 처리

// 최신 상태가 UNUSED & 메모 없음 → 덮어쓰기
if (lastEntry.state === UNUSED && !lastEntry.note) {
  updated[updated.length - 1] = assignedEntry; // 교체
}

// 그 외 경우 → 배열에 추가 (히스토리 보존)
else {
  updated.push(assignedEntry); // 추가
}
```

### 반납 로직

```typescript
// releaseLocker() 는 항상 배열에 추가

// 메모 처리: [해지] 접두사 자동 추가
const releaseNote = note.trim() ? `[해지] ${note}` : '';

// 배열이 아니면 배열로 변환 후 추가
nextValue = Array.isArray(entry) 
  ? [...entry, unusedEntry] 
  : [entry, unusedEntry];
```

---

## 조회 함수

### 최신 락커 상태 조회

```typescript
// 특정 박스의 모든 락커 (최신 상태만)
const lockers = await LockerService.getLockers(boxName);
```

### 특정 락커의 전체 히스토리

```typescript
// 번호 순서대로 모든 변경 기록
const history = await LockerService.getLockerHistory(boxName, lockerNumber);
// → Locker[] (오래된 순)
```

### 활성 배정 확인

```typescript
// 현재 유효한 회원 배정이 있는지 확인
const hasUser = LockerService.hasActiveAssignedUser(lockerEntry, lockerNumber);
```

---

## 실제 사용 예시

### 시나리오: 락커 배정 및 반납

```
# 2026-01-01: 락커 1번을 홍길동에게 배정 (YYYY-MM-DD)
await LockerService.assignLocker(
  'box1',
  1,
  'hong@example.com',
  '홍길동',
  '010-1234-5678',
  '2026-01-01',  // startDate
  '2026-12-31',  // endDate
  'key123',
  '50000',
  'card'
);

# Firebase 상태
lockers/lockerdoc: {
  "1": {
    number: 1,
    state: "used",
    action: "assign",
    realName: "홍길동",
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    createdAt: "2026-01-01"
  }
}

members/hong@example.com: {
  lockerHistory: [{
    lockerNum: 1,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    createdAt: Timestamp
  }]
}

---

# 2026-05-01: 홍길동이 락커 반납
await LockerService.releaseLocker(
  'box1',
  1,
  '멤버십 만료',  // note
  '코치명'       // assignee
);

# Firebase 상태
lockers/lockerdoc: {
  "1": [
    {
      number: 1,
      state: "used",
      action: "assign",
      realName: "홍길동",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      createdAt: "2026-01-01"
    },
    {
      number: 1,
      state: "unused",
      action: "release",
      note: "[해지] 멤버십 만료",
      assignee: "코치명",
      createdAt: "2026-05-01"
    }
  ]
}

members/hong@example.com: {
  lockerHistory: [{
    lockerNum: 1,
    startDate: "2026-01-01",
    endDate: "2026-12-31",
    releasedDate: "2026-05-01",  // ← 반납일 기록
    createdAt: Timestamp
  }]
}
```

---

## UI 레이블 렌더링 로직

### 상태 라벨

```typescript
const stateLabel = getLockerStateLabel(locker.state, locker);
// 예시 출력:
// - "사용중" (USED + 기간 내)
// - "사용 예정" (USED + 시작일 미도래)
// - "만료" (USED + 종료일 경과)
// - "사용 가능" (UNUSED)
// - "고장" (NA)
// - "삭제됨" (DELETED)
```

### 액션 라벨

```typescript
const actionLabel = getLockerEventLabel(locker.action);
// 예시 출력:
// - "락커 배정"
// - "락커 반납"
// - "고장 등록"
// - "고장 복구"
// - "락커 삭제"
```

### 히스토리 모달

```
락커 #1 히스토리
━━━━━━━━━━━━━━━━

#2 [2026-05-01]  [락커 반납]
  회원: 홍길동
  사유: [해지] 멤버십 만료
  담당자: 코치명

#1 [2026-01-01]  [락커 배정]
  회원: 홍길동
  시작일: 2026-01-01
  종료일: 2026-12-31
  가격: 50,000
```

---

## 주의사항

### 1. 반납 후 endDate는 변경되지 않음

```typescript
// assignLocker 시
startDate: "2026-01-01"
endDate: "2026-12-31"

// releaseLocker 후 (배열의 새 항목)
startDate: "" (기본값)
endDate: "" (기본값)

// ⚠️ UI에서 표시하려면 이전 배정 정보를 참고해야 함
```

### 2. 활성 배정 확인

```typescript
// 현재 활성 배정 회원이 있으면 상태 변경 불가
if (hasActiveAssignedUser(lockerEntry, lockerNumber)) {
  throw new Error('먼저 해지해주세요');
}
```

### 3. USED → NA 불가능

```typescript
// 활성 배정 회원이 있는 상태에서 고장 처리 불가
// 먼저 반납 후 고장 처리 가능
releaseLocker() → updateLocker(NA) 순서
```

---

## 관련 파일

- `src/types/locker.ts` — 상태/액션 정의
- `src/services/lockerService.ts` — 비즈니스 로직
- `src/repositories/lockerRepository.ts` — Firebase I/O
- `src/models/lockerModel.ts` — 데이터 변환
- `src/types/member.ts` — Member 타입 (lockerHistory)
