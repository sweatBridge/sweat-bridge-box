# Revenue Management (매출 관리)

## Table of Contents
- [1. 개요](#1-개요)
- [2. 파일 위치](#2-파일-위치)
- [3. 주요 데이터](#3-주요-데이터)
- [4. UI 구성](#4-ui-구성)
- [5. 모달 목록](#5-모달-목록)
- [6. 비즈니스 로직](#6-비즈니스-로직)
- [7. 연관 서비스 및 훅](#7-연관-서비스-및-훅)

---

## 1. 개요

월별 매출 현황을 달력 뷰로 표시하고, 날짜별 상세 매출 데이터를 조회하는 페이지.
매출은 회원권, 기타 항목으로 분류되며 현금/카드 결제 방식도 구분된다.

---

## 2. 파일 위치

```
src/pages/RevenueManagement.tsx
src/components/modals/revenue/
  └── RevenueDetailModal.tsx    (날짜별 거래 내역 상세)
src/hooks/useRevenueManagement.ts
```

---

## 3. 주요 데이터

| 데이터 | 타입 | 설명 |
|---|---|---|
| `monthlyRevenue` | `MonthlyRevenue` | 선택된 월의 일별 매출 집계 |
| `stats` | `RevenueStats` | 전체/이번달/오늘/일평균 통계 |
| `selectedDate` | `Date \| null` | 달력에서 선택한 날짜 |
| `currentYear` | `number` | 현재 조회 중인 연도 |
| `currentMonth` | `number` | 현재 조회 중인 월 |

### MonthlyRevenue 구조
```typescript
{
  year: number
  month: number
  dailyRevenue: {
    [day: string]: DailyRevenue  // 날짜(day)를 키로 사용
  }
  transactions: RevenueData[]    // 해당 월 전체 거래 목록
}
```

### DailyRevenue 구조
```typescript
{
  total: number         // 일별 총 매출
  membership: number    // 회원권 매출
  other: number         // 기타 매출
  cash: number          // 현금 결제 금액
  card: number          // 카드 결제 금액
  refund: number        // 환불 금액
}
```

---

## 4. UI 구성

### 4-1. 통계 카드 (상단)
- **총 매출**: 전체 기간 누적
- **이번 달 매출**: 현재 월
- **오늘 매출**: 당일
- **일평균 매출**: 총매출 / 영업일수

### 4-2. 매출 달력
- 선택된 월의 달력 표시
- 각 날짜 셀에 해당일 매출 금액 표시
- 매출이 있는 날짜 클릭 → 날짜별 상세 (`RevenueDetailModal`) 오픈
- 이전/다음 달 이동 버튼

### 4-3. 월별 요약
- 선택 월의 합계: 총매출, 회원권 매출, 기타 매출
- 현금/카드 결제 비율 표시
- 환불 금액 표시

---

## 5. 모달 목록

### RevenueDetailModal (매출 상세)
- 선택 날짜의 상세 거래 목록 표시
- 거래별: 항목명, 금액, 결제 방법, 회원 이름, 시간
- 해당일 소계 (총합, 현금, 카드, 환불)

---

## 6. 비즈니스 로직

### 매출 데이터 기록 시점
- 회원권 추가 (`membershipService.addMembership()`) → `revenueService.recordRevenue()` 자동 호출
- 락커 배정 (`lockerService.updateLocker()`) → 매출 기록
- 환불 처리 → 환불 금액을 마이너스로 기록

### 매출 집계 방식
```
/box/{boxName}/revenue/{year}
  {month}: {
    transactions: [...],
    dailyRevenue: {
      "1": { total, membership, other, cash, card, refund },
      "15": { ... },
      ...
    }
  }
```
- 연도별로 Firebase 문서 구분
- 월 데이터를 필드로 저장
- 거래 발생 시 해당 일자의 dailyRevenue를 누적 업데이트

### 통계 계산
- `RevenueStats`는 서비스 레이어에서 전체 데이터를 집계해 반환
- 일평균 = 총매출 ÷ (매출이 있는 날 수)

---

## 7. 연관 서비스 및 훅

- `src/hooks/useRevenueManagement.ts` → 매출 상태 관리
- `src/services/revenueService.ts` → Firebase 매출 데이터 조작
  - `getMonthlyRevenue(year, month)`
  - `getRevenueStats()`
  - `recordRevenue(data)` (다른 서비스에서 호출)
  - `updateDailyRevenue(dailyRevenue)` (수동 업데이트)
