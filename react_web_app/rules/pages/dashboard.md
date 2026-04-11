# Dashboard (대시보드)

## Table of Contents
- [1. 개요](#1-개요)
- [2. 파일 위치](#2-파일-위치)
- [3. 주요 데이터](#3-주요-데이터)
- [4. UI 구성](#4-ui-구성)
- [5. 비즈니스 로직](#5-비즈니스-로직)
- [6. 연관 서비스](#6-연관-서비스)

---

## 1. 개요

로그인 후 처음 진입하는 홈 화면.
오늘의 수업 일정, 회원 현황, 신규 가입자 정보를 한눈에 요약해서 보여준다.

---

## 2. 파일 위치

```
src/pages/Dashboard.tsx
```

---

## 3. 주요 데이터

| 데이터 | 설명 | 출처 |
|---|---|---|
| `todayClasses` | 오늘 예정된 수업 목록 | `classService.getTodayClasses()` |
| `members` | 전체 회원 목록 | `memberService.getMembers()` |
| `newMembers` | 최근 가입 회원 5명 | members 배열에서 `joinedAt` 기준 정렬 |
| `activeCount` | 활성 회원 수 | `memberUtils.getActiveMembersCount()` |
| `warningCount` | 만료 임박 회원 수 (14일 이내) | `memberUtils.getWarningMembers()` |

---

## 4. UI 구성

### 4-1. 통계 카드 (상단)
- 총 회원 수
- 활성 회원 수
- 만료 임박 회원 수 (14일 이내)
- 신규 가입 회원 수

> 각 카드는 `gradients.ts`에 정의된 그라디언트 배경색 적용

### 4-2. 오늘의 수업 목록
- 수업 시작 시간, 종료 시간
- 담당 코치 이름
- 예약 인원 / 정원

### 4-3. 신규 회원 목록
- 최근 가입한 5명 표시
- 가입 날짜 표시

---

## 5. 비즈니스 로직

- 페이지 마운트 시 `classService.getTodayClasses()`와 `memberService.getMembers()`를 **병렬** 호출
- 신규 회원: `joinedAt` 필드 기준 내림차순 정렬 후 상위 5명
- 활성 회원: `MembershipInfo.status === 'active'`인 회원
- 만료 임박: 만료일이 오늘부터 14일 이내인 회원

---

## 6. 연관 서비스

- `src/services/classService.ts` → `getTodayClasses()`
- `src/services/memberService.ts` → `getMembers()`
- `src/utils/memberUtils.ts` → `getActiveMembersCount()`, `getWarningMembers()`
- `src/services/membershipService.ts` → `getMemberStatusBadge()`
