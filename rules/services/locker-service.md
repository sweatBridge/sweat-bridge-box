# Locker Service (락커 서비스)

## Table of Contents
- [1. 개요](#1-개요)
- [2. 파일 위치](#2-파일-위치)
- [3. Firebase 컬렉션](#3-firebase-컬렉션)
- [4. 주요 함수](#4-주요-함수)
- [5. 데이터 구조 상세](#5-데이터-구조-상세)
- [6. 회원 서비스 연동](#6-회원-서비스-연동)

---

## 1. 개요

락커 상태 관리 및 회원 배정을 담당하는 서비스.
락커 데이터는 단일 문서(`lockerdoc`)에 모든 락커 번호를 키로 저장하며, 각 락커는 배정 이력 배열로 관리된다.

---

## 2. 파일 위치

```
src/services/lockerService.ts
src/utils/lockerUtils.ts
```

---

## 3. Firebase 컬렉션

```
/box/{boxName}/lockers/lockerdoc
  "101": [
    {
      state: LockerState    // 'used' | 'unused' | 'na' | 'deleted'
      memberName?: string
      memberEmail?: string
      startDate?: Timestamp
      endDate?: Timestamp
      price?: number
      paymentType?: string  // 'cash' | 'card'
      key?: string          // 배정 고유 키
    },
    ...  // 이력 배열
  ]
  "102": [ ... ]
  "103": [ ... ]
```

> 단일 문서에 모든 락커를 필드로 저장 (컬렉션이 아님)
> 각 필드 값은 배정 이력 배열이며 마지막 항목이 현재 상태

---

## 4. 주요 함수

### `getLockers(box: string): Promise<Locker[]>`
- `lockerdoc` 단일 문서 조회
- 배열과 객체 두 가지 포맷 모두 처리 (하위 호환)
- 각 락커의 최신 이력에서 현재 상태 계산
- Firebase Timestamp → Date 변환
- `lockerUtils.toLocker()`로 타입 변환

### `addLockers(box, start, end): Promise<void>`
- `start`번부터 `end`번까지 락커 번호 일괄 추가
- `runTransaction` 사용하여 원자적 처리
- 이미 존재하는 번호: 스킵
- 삭제된(`deleted`) 번호: 상태를 `unused`로 복원

### `updateLocker(box, number, state, memberData?): Promise<void>`
- 특정 락커의 상태 업데이트
- `memberData`가 있으면 회원 배정 정보 포함
- 이력 배열에 새 항목 추가 (`arrayUnion`)

### `deleteLocker(box, number): Promise<void>`
- 해당 락커의 상태를 `deleted`로 변경
- 이력 배열에 삭제 기록 추가
- UI에서 삭제된 락커는 표시하지 않음

### `releaseLocker(box, number): Promise<void>`
- 현재 배정된 회원 해제
- 이력 배열에 반납 기록 추가 (memberEmail 제거, state = 'unused')

---

## 5. 데이터 구조 상세

### 락커 상태 계산 흐름
```
lockerdoc["101"] (이력 배열)
    ↓
마지막 항목 추출
    ↓
startDate, endDate, state 기반으로 표시 상태 결정:
  - state == 'deleted'           → 삭제됨 (표시 안 함)
  - state == 'na'                → 고장
  - memberEmail 없음             → 사용 가능 (unused)
  - 오늘 < startDate             → 사용 예정 (used/future)
  - startDate <= 오늘 <= endDate → 사용 중 (used)
  - 오늘 > endDate               → 만료 (used/expired)
```

### 배정 이력 구조
```typescript
{
  state: 'used'
  memberName: '홍길동'
  memberEmail: 'hong@example.com'
  startDate: Timestamp(2024-01-01)
  endDate: Timestamp(2024-03-31)
  price: 30000
  paymentType: 'card'
  key: 'abc123xy'              // keyGenerator로 생성
}
```

---

## 6. 회원 서비스 연동

락커 배정/반납은 **락커 문서**와 **회원 문서** 두 곳을 동시에 업데이트해야 한다.
두 작업은 독립적으로 호출되며, UI 레이어(모달)에서 순서대로 호출한다.

### 락커 배정 시
```
1. lockerService.updateLocker(box, number, 'used', memberData)
   → lockerdoc의 해당 락커 배열에 배정 이력 추가

2. memberService.assignLockerToMember(box, email, lockerHistory)
   → 회원 문서의 lockerHistory 배열에 이력 추가
```

### 락커 반납 시
```
1. lockerService.releaseLocker(box, number)
   → lockerdoc의 해당 락커 상태를 unused로 변경

2. memberService.unassignLockerFromMember(box, email, key)
   → 회원 문서의 lockerHistory에서 해당 key의 endDate 기록
```

> 두 서비스 간 트랜잭션은 구현되어 있지 않으므로, 한 쪽 실패 시 불일치 발생 가능
