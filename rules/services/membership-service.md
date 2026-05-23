# Membership Service (회원권 서비스)

## Table of Contents
- [1. 개요](#1-개요)
- [2. 파일 위치](#2-파일-위치)
- [3. Firebase 컬렉션](#3-firebase-컬렉션)
- [4. 주요 함수](#4-주요-함수)
- [5. 회원권 타입 및 상태](#5-회원권-타입-및-상태)
- [6. 매출 연동](#6-매출-연동)
- [7. 연관 서비스](#7-연관-서비스)

---

## 1. 개요

회원권 플랜 관리, 회원별 회원권 CRUD, 보류/환불/수정/일괄 연장 기능을 담당하는 서비스.
회원권 조작 시 `revenueService`와 연동하여 매출 데이터를 자동 기록한다.

---

## 2. 파일 위치

```
src/services/membershipService.ts
```

---

## 3. Firebase 컬렉션

```
/box/{boxName}/membership/plansDoc
  plans: MembershipPlan[]     // 박스 전용 회원권 플랜 목록

/box/{boxName}/membership/{membershipKey}
  // UserMembership 전체 필드
  memberEmail: string
  planName: string
  type: 'periodPass' | 'countPass'
  startDate: Timestamp
  endDate: Timestamp
  totalCount?: number          // 횟수제일 경우
  remainingCount?: number
  price: number
  paymentType: string          // 'cash' | 'card'
  holds: HoldPeriod[]          // 보류 이력
  adjustments: Adjustment[]    // 수정/변경 이력
  refunded: boolean
  refundAmount?: number
  createdAt: Timestamp
  key: string                  // 고유 키 (keyGenerator로 생성)
```

---

## 4. 주요 함수

### 플랜 관리

#### `getMembershipPlans(boxName: string): Promise<MembershipPlan[]>`
- `/box/{boxName}/membership/plansDoc` 조회
- `plans` 배열 반환

#### `setMembershipPlans(boxName, plans): Promise<void>`
- 플랜 목록 전체 교체 저장

---

### 회원권 CRUD

#### `addMembership(boxName, email, membershipData): Promise<void>`
1. `keyGenerator.generateMembershipKey()`로 고유 키 생성
2. `/box/{boxName}/membership/{key}` 문서 생성
3. 회원 문서(`member`)의 `memberships` 배열에도 추가
4. `revenueService.recordRevenue()` 호출 → 매출 기록

#### `deleteMembership(boxName, key): Promise<void>`
- 해당 회원권 문서 삭제
- 회원 문서의 `memberships` 배열에서도 제거

#### `editMembership(boxName, key, updates): Promise<void>`
- 기간(startDate/endDate) 또는 횟수 수정
- `adjustments` 배열에 변경 이력 추가
- 회원 문서 동기화

---

### 보류/환불

#### `holdMembership(boxName, key, holdData): Promise<void>`
- `holds[]` 배열에 보류 기간 추가
- 보류 기간만큼 `endDate` 자동 연장
- 회원 문서 동기화

#### `releaseHold(boxName, key): Promise<void>`
- 현재 진행 중인 보류 종료
- `endDate`를 원래대로 복원
- 회원 문서 동기화

#### `refundMembership(boxName, key, refundAmount): Promise<void>`
- `refunded: true`, `refundAmount` 저장
- `revenueService.recordRevenue()` 호출 → 마이너스 금액 기록
- 회원 문서 동기화

---

### 일괄 연장

#### `extendAllMemberships(boxName, days): Promise<void>`
- 전체 활성 회원의 현재 회원권 `endDate`를 N일 연장
- 배치 처리로 Firestore 쓰기 최적화

---

### 상태 계산 (유틸 성격)

#### `getMemberStatusBadge(member: Member): string`
- 회원의 `MembershipInfo`를 바탕으로 상태 문자열 반환
- 반환값: `'활성'` | `'주의'` | `'만료'` | `'신규'`

#### `filterWarningMembers(members: Member[]): Member[]`
- 만료일이 오늘부터 14일 이내인 회원 필터링

---

## 5. 회원권 타입 및 상태

### 타입
| 타입 | 설명 |
|---|---|
| `periodPass` | 기간제 회원권 (날짜 기반) |
| `countPass` | 횟수제 회원권 (남은 횟수 기반) |

### MembershipInfo (계산된 상태)
```typescript
{
  type: string            // 회원권 타입
  expiryDate: Date        // 만료일
  remainingDays: number   // 남은 일수
  remainingVisits?: number // 남은 횟수 (횟수제만)
  status: 'active' | 'warning' | 'expired'
}
```

### 상태 기준
| 상태 | 조건 |
|---|---|
| `active` | 만료일까지 15일 이상 남음 |
| `warning` | 만료일까지 1~14일 남음 |
| `expired` | 만료됨 |

---

## 6. 매출 연동

회원권 작업이 발생할 때 자동으로 매출 기록:

| 동작 | 매출 기록 |
|---|---|
| 회원권 추가 | `+price` (회원권 분류) |
| 환불 | `-refundAmount` (환불 분류) |

`revenueService.recordRevenue(data)` 호출 시 `data`:
```typescript
{
  type: 'membership' | 'other'
  amount: number              // 양수 = 수입, 음수 = 환불
  paymentType: 'cash' | 'card'
  memberName: string
  description: string
  date: Date
}
```

---

## 7. 연관 서비스

- `src/services/memberService.ts` → 회원 문서 동기화 (memberships 배열)
- `src/services/revenueService.ts` → 매출 자동 기록
- `src/utils/keyGenerator.ts` → 고유 키 생성
