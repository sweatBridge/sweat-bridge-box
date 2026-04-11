# Locker (락커 관리)

## Table of Contents
- [1. 개요](#1-개요)
- [2. 파일 위치](#2-파일-위치)
- [3. 주요 데이터](#3-주요-데이터)
- [4. UI 구성](#4-ui-구성)
- [5. 모달 목록](#5-모달-목록)
- [6. 비즈니스 로직](#6-비즈니스-로직)
- [7. 연관 서비스](#7-연관-서비스)

---

## 1. 개요

박스의 락커 현황을 그리드로 표시하고, 락커 추가/배정/해제/삭제 등 전체 락커 생명주기를 관리하는 페이지.

---

## 2. 파일 위치

```
src/pages/Locker.tsx
src/components/modals/locker/
  ├── AddLockerModal.tsx          (락커 번호 범위 추가)
  ├── AssignLockerModal.tsx       (회원에게 락커 배정)
  ├── UpdateLockerModal.tsx       (락커 배정 정보 수정)
  ├── LockerDetailsModal.tsx      (락커 상세 정보 조회)
  ├── LockerHistoryModal.tsx      (락커 사용 이력 조회)
  ├── DeleteConfirmModal.tsx      (락커 삭제 확인)
  └── ReleaseConfirmModal.tsx     (락커 반납 확인)
```

---

## 3. 주요 데이터

| 데이터 | 타입 | 설명 |
|---|---|---|
| `lockers` | `Locker[]` | 전체 락커 목록 |
| `selectedLocker` | `Locker \| null` | 현재 선택된 락커 |

### Locker 구조
```typescript
{
  number: string                 // 락커 번호 (예: "101")
  state: LockerState            // 상태 값
  memberName?: string           // 배정된 회원 이름
  memberEmail?: string          // 배정된 회원 이메일
  startDate?: Date              // 배정 시작일
  endDate?: Date                // 배정 종료일
  price?: number                // 요금
  paymentType?: string          // 결제 방법 (현금/카드)
  key?: string                  // 이력 고유 키
  history?: LockerHistoryItem[] // 전체 사용 이력
}
```

### LockerState 값
| 값 | 의미 |
|---|---|
| `'used'` | 사용 중 (배정됨, 기간 유효) |
| `'unused'` | 사용 가능 (비어있음) |
| `'na'` | 고장 (사용 불가) |
| `'deleted'` | 삭제됨 (목록에서 제외) |

---

## 4. UI 구성

### 4-1. 락커 그리드
- 락커 번호별로 박스 형태로 표시
- **상태별 색상**:
  - 사용 중: 파란색
  - 사용 예정: 보라색 (시작일이 미래)
  - 만료: 빨간색 (종료일이 지남)
  - 사용 가능: 초록색
  - 고장: 회색
  - 삭제됨: 표시 안 함

### 4-2. 락커 클릭 동작
- **사용 가능** 락커 클릭 → `AssignLockerModal` 오픈
- **사용 중 / 만료 / 사용 예정** 락커 클릭 → `LockerDetailsModal` 오픈
- **고장** 락커 클릭 → `LockerDetailsModal` 오픈

### 4-3. 액션 버튼
- 락커 추가 → `AddLockerModal` 오픈

---

## 5. 모달 목록

### AddLockerModal (락커 추가)
- 시작 번호 ~ 종료 번호 범위 입력
- 범위 내 번호를 일괄 추가
- 이미 삭제된 번호는 복원(상태를 'unused'로 변경)
- `lockerService.addLockers()` 호출 (runTransaction으로 원자적 처리)

### AssignLockerModal (락커 배정)
- 회원 검색 (이름으로 검색)
- 배정 기간 설정 (시작일, 종료일)
- 요금 및 결제 방법 입력
- 저장 시:
  1. `lockerService.updateLocker()` → 락커 문서 업데이트
  2. `memberService.assignLockerToMember()` → 회원 문서의 lockerHistory 추가

### UpdateLockerModal (락커 수정)
- 기존 배정 정보 조회 및 수정
- 종료일, 요금, 결제 방법 변경 가능
- 저장 시:
  1. `lockerService.updateLocker()` → 락커 업데이트
  2. `memberService.updateLockerHistoryEndDate()` → 회원 이력 업데이트

### LockerDetailsModal (락커 상세)
- 현재 배정 정보 표시
- **수정** → `UpdateLockerModal` 오픈
- **반납** → `ReleaseConfirmModal` 오픈
- **이력 보기** → `LockerHistoryModal` 오픈
- **삭제** → `DeleteConfirmModal` 오픈

### LockerHistoryModal (사용 이력)
- 락커의 전체 사용 이력 목록
- 회원명, 기간, 금액 표시

### ReleaseConfirmModal (반납 확인)
- 락커 반납(회원 해제) 최종 확인
- 확인 시:
  1. `lockerService.releaseLocker()` → 락커 상태를 'unused'로 변경
  2. `memberService.unassignLockerFromMember()` → 회원 lockerHistory에 endDate 기록

### DeleteConfirmModal (삭제 확인)
- 락커 삭제 최종 확인
- `lockerService.deleteLocker()` 호출 → 상태를 'deleted'로 변경

---

## 6. 비즈니스 로직

### 락커 상태 결정 규칙
- 배정된 회원이 있고, 오늘 날짜가 startDate~endDate 범위 내 → `used`
- 배정된 회원이 있고, startDate > 오늘 → `used` (사용 예정)
- 배정된 회원이 있고, endDate < 오늘 → `used` (만료, 빨간색 표시)
- 배정 없음 + state가 'na' → `na`
- 배정 없음 + state가 'unused' → `unused`

> 상태 표시 레이블은 `lockerUtils.getLockerStateLabel()`이 담당

### Firebase 데이터 구조
```
/box/{boxName}/lockers/lockerdoc
  "101": [ {lock history array} ]
  "102": [ {lock history array} ]
  ...
```
- 락커 번호를 키로 사용
- 각 락커는 배정 이력 배열로 저장
- 현재 상태는 배열의 마지막 항목에서 계산

---

## 7. 연관 서비스

- `src/services/lockerService.ts` → Firebase 락커 데이터 조작
- `src/services/memberService.ts` → 회원의 lockerHistory 업데이트
- `src/utils/lockerUtils.ts` → 상태 계산, Firebase 데이터 변환
- `src/utils/keyGenerator.ts` → 락커 배정 고유 키 생성
