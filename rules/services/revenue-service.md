# Revenue Service (매출 서비스)

## Table of Contents
- [1. 개요](#1-개요)
- [2. 파일 위치](#2-파일-위치)
- [3. Firebase 컬렉션](#3-firebase-컬렉션)
- [4. 주요 함수](#4-주요-함수)
- [5. 데이터 구조 상세](#5-데이터-구조-상세)
- [6. 다른 서비스에서 호출](#6-다른-서비스에서-호출)

---

## 1. 개요

매출 거래 기록, 월별/일별 집계, 통계 계산을 담당하는 서비스.
회원권 추가/환불, 락커 배정 등 결제가 발생하는 모든 시점에 자동으로 호출된다.

---

## 2. 파일 위치

```
src/services/revenueService.ts
src/hooks/useRevenueManagement.ts
```

---

## 3. Firebase 컬렉션

```
/box/{boxName}/revenue/{year}
  {month}: {
    transactions: [
      {
        id: string           // 거래 고유 ID
        type: string         // 'membership' | 'other'
        amount: number       // 금액 (환불은 음수)
        paymentType: string  // 'cash' | 'card'
        memberName: string
        description: string  // 거래 설명
        date: Timestamp
      }
    ],
    dailyRevenue: {
      "1":  { total, membership, other, cash, card, refund },
      "15": { total, membership, other, cash, card, refund },
      ...
    }
  }
```

> 연도별로 Firestore 문서 구분
> 월 데이터는 해당 문서의 필드로 저장

---

## 4. 주요 함수

### `recordRevenue(boxName, data): Promise<void>`
- 신규 거래를 기록하고 일별 집계를 업데이트
- `data` 구조:
  ```typescript
  {
    type: 'membership' | 'other'
    amount: number        // 환불 시 음수
    paymentType: 'cash' | 'card'
    memberName: string
    description: string
    date: Date
  }
  ```
- `transactions` 배열에 항목 추가 (`arrayUnion`)
- 해당 날짜의 `dailyRevenue` 누적 업데이트

### `getMonthlyRevenue(boxName, year, month): Promise<MonthlyRevenue>`
- 특정 연월의 매출 데이터 전체 조회
- `transactions`를 날짜별로 분류하여 `dailyRevenue` 구성
- `MonthlyRevenue` 타입으로 반환

### `getRevenueStats(boxName): Promise<RevenueStats>`
- 전체 기간 통계 계산
- 반환 구조:
  ```typescript
  {
    total: number          // 전체 누적 매출
    thisMonth: number      // 이번 달 매출
    today: number          // 오늘 매출
    averageDaily: number   // 일평균 매출
  }
  ```

### `updateDailyRevenue(boxName, year, month, day, dailyRevenue): Promise<void>`
- 특정 날짜의 일별 집계를 수동으로 덮어쓰기
- 관리자 수동 조정 용도

---

## 5. 데이터 구조 상세

### DailyRevenue 집계 구조
```typescript
{
  total: number      // 총 매출 (refund 제외)
  membership: number // 회원권 매출
  other: number      // 기타 매출
  cash: number       // 현금 결제 합계
  card: number       // 카드 결제 합계
  refund: number     // 환불 금액 합계 (양수로 저장)
}
```

### 집계 계산 방식
```
amount > 0이면:
  - type == 'membership' → membership += amount
  - type == 'other'      → other += amount
  - paymentType == 'cash' → cash += amount
  - paymentType == 'card' → card += amount
  - total += amount

amount < 0이면:
  - refund += abs(amount)
  - total += amount (마이너스 적용)
```

### 연도별 문서 구조
```
revenue/2023
  "1": { transactions: [...], dailyRevenue: {...} }
  "2": { transactions: [...], dailyRevenue: {...} }
  ...
  "12": { ... }

revenue/2024
  "1": { ... }
  ...
```

---

## 6. 다른 서비스에서 호출

`revenueService.recordRevenue()`는 직접 UI에서 호출하지 않고,
결제가 발생하는 서비스 함수 내부에서 자동으로 호출된다.

| 호출 위치 | 동작 | amount |
|---|---|---|
| `membershipService.addMembership()` | 회원권 신규 등록 | `+price` |
| `membershipService.refundMembership()` | 회원권 환불 | `-refundAmount` |
| `lockerService.updateLocker()` (배정 시) | 락커 배정 요금 | `+price` |
