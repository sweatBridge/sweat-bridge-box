# Class Reservation (수업 관리)

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

FullCalendar 기반의 수업 스케줄 관리 페이지.
수업 생성, 조회, 수정, 삭제 및 예약 회원 관리를 담당한다.

---

## 2. 파일 위치

```
src/pages/ClassReservation.tsx
src/components/modals/class/
  ├── SaveClassModal.tsx      (수업 생성)
  ├── ManageClassModal.tsx    (수업 조회/수정/삭제)
  ├── AddMemberModal.tsx      (예약 회원 추가)
  └── RemoveMemberModal.tsx   (예약 회원 제거)
src/hooks/useClassManagement.ts
src/contexts/ClassContext.tsx
```

---

## 3. 주요 데이터

| 데이터 | 타입 | 출처 |
|---|---|---|
| `classes` | `ClassEvent[]` | ClassContext (useReducer) |
| `currentBox` | `string` | localStorage `boxName` |
| `selectedDate` | `Date` | FullCalendar 날짜 클릭 이벤트 |
| `selectedClass` | `ClassEvent \| null` | FullCalendar 이벤트 클릭 |

### ClassEvent 구조
```typescript
{
  id: string           // docKey (YYYYMMDDHHMMHHMM)
  title: string        // 표시 텍스트
  start: string        // ISO 시작 시간
  end: string          // ISO 종료 시간
  coach: string        // 코치 이름
  cap: number          // 정원
  reserved: string[]   // 예약 회원 이메일 배열
}
```

---

## 4. UI 구성

### 4-1. FullCalendar
- **뷰**: 주간(timeGridWeek) / 월간(dayGridMonth) 전환 가능
- **날짜 빈 공간 클릭** → `SaveClassModal` 오픈 (수업 생성)
- **기존 이벤트 클릭** → `ManageClassModal` 오픈 (수업 관리)
- 이벤트 표시: 수업 시간 + 코치 이름 + 예약인원/정원

### 4-2. 월 이동
- 이전/다음 달 버튼
- 오늘 버튼

---

## 5. 모달 목록

### SaveClassModal (수업 생성)
- 입력 필드: 날짜, 시작 시간, 종료 시간, 코치, 정원
- **반복 수업 옵션**: 4주 동안 같은 요일/시간에 일괄 생성
- 저장 시 `classService.setClass()` 호출
- docKey 포맷: `YYYYMMDDHHMMHHMM`

### ManageClassModal (수업 조회/수정/삭제)
- 수업 정보 표시 (날짜, 시간, 코치, 정원)
- 코치 및 정원 수정 가능
- 예약 회원 목록 표시
- **회원 직접 추가** → `AddMemberModal` 오픈
- **회원 제거** → `RemoveMemberModal` 오픈
- **수업 삭제** 버튼 (삭제 확인 후 처리)

### AddMemberModal (예약 회원 추가)
- 회원 이름/이메일로 검색
- 선택한 회원을 `reserved[]` 배열에 추가
- 이미 예약된 회원은 추가 불가
- 정원 초과 시 추가 불가

### RemoveMemberModal (예약 회원 제거)
- 예약된 회원 목록 표시
- 선택한 회원을 `reserved[]` 배열에서 제거

---

## 6. 비즈니스 로직

### docKey 생성 규칙
```
format: YYYYMMDDHHMMHHMM
예시: 202309081000110
  → 2023년 09월 08일, 10:00~11:00
```
- `classService.generateDocKey(date, startTime, endTime)`로 생성
- Firebase 문서 ID로 사용됨

### 반복 수업 생성
- 현재 주부터 4주간 동일 요일/시간에 수업 생성
- `classService.createRecurringClasses()` 호출
- 이미 존재하는 docKey는 skip

### 월별 데이터 로드
- 달력 뷰 변경 시 해당 월의 수업 데이터 자동 로드
- `ClassContext` useReducer로 상태 관리
  - `SET_CLASSES`: 전체 교체
  - `ADD_CLASS`: 단건 추가
  - `UPDATE_CLASS`: 단건 수정
  - `DELETE_CLASS`: 단건 삭제

### 예약 인원 관리
- `reserved[]`: 예약된 회원의 이메일 배열
- 정원(`cap`) 초과 불가
- 회원 관리 모달에서 직접 추가/제거 가능

---

## 7. 연관 서비스 및 훅

- `src/hooks/useClassManagement.ts` → 수업 CRUD 로직 및 Context dispatch
- `src/contexts/ClassContext.tsx` → 수업 전역 상태 (useReducer)
- `src/services/classService.ts` → Firebase 수업 데이터 조작
- `src/utils/classCalendarUtils.ts` → docKey 파싱, 날짜/시간 포맷 변환
