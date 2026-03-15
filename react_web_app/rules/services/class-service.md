# Class Service (수업 서비스)

## Table of Contents
- [1. 개요](#1-개요)
- [2. 파일 위치](#2-파일-위치)
- [3. Firebase 컬렉션](#3-firebase-컬렉션)
- [4. 주요 함수](#4-주요-함수)
- [5. docKey 규칙](#5-dockey-규칙)
- [6. 연관 유틸](#6-연관-유틸)

---

## 1. 개요

FullCalendar와 연동되는 수업 일정 데이터를 Firebase Firestore에서 관리하는 서비스.
날짜 범위 조회, 수업 생성/수정/삭제, 반복 수업 생성 기능을 제공한다.

---

## 2. 파일 위치

```
src/services/classService.ts
src/hooks/useClassManagement.ts
src/contexts/ClassContext.tsx
src/utils/classCalendarUtils.ts
```

---

## 3. Firebase 컬렉션

```
/box/{boxName}/class/{docKey}
  cap: number           // 정원
  coach: string         // 코치 이름
  date: Timestamp       // 수업 날짜/시간 (시작 시간 기준)
  endTime: string       // 종료 시간 (HH:MM 포맷)
  reserved: string[]    // 예약된 회원 이메일 목록
```

> 문서 ID = docKey (YYYYMMDDHHMMHHMM 형식)

---

## 4. 주요 함수

### `getMonthlyClasses(box, startDate, endDate): Promise<ClassEvent[]>`
- `date` 필드 기준 `startDate` ~ `endDate` 범위 쿼리
- Firebase Timestamp → JavaScript Date 변환
- FullCalendar 이벤트 포맷으로 변환하여 반환

### `getTodayClasses(box): Promise<ClassEvent[]>`
- 오늘 날짜의 00:00:00 ~ 23:59:59 범위 쿼리
- 대시보드에서 오늘 수업 표시에 사용

### `setClass(payload): Promise<void>`
- 신규 수업 생성
- docKey가 이미 존재하면 덮어씀 (upsert)
- `payload` 구조: `{ box, docKey, cap, coach, date, endTime, reserved }`

### `updateClass(payload): Promise<void>`
- 기존 수업의 코치, 정원, 예약 회원 목록 업데이트
- docKey로 문서 찾아 지정 필드만 업데이트

### `deleteClass(box, docKey): Promise<void>`
- 해당 docKey 문서 삭제

### `generateDocKey(date, startTime, endTime): string`
- 날짜와 시간으로 고유한 문서 키 생성
- 상세는 [5. docKey 규칙](#5-dockey-규칙) 참조

### `createRecurringClasses(box, classData, weekCount): Promise<void>`
- 동일한 수업을 `weekCount`주 동안 매주 반복 생성
- 기본값: 4주
- 각 주차별로 `setClass()` 호출
- 이미 존재하는 docKey는 skip (덮어쓰지 않음)

---

## 5. docKey 규칙

```
형식: YYYYMMDDHHMMHHMM
예시: 20230908100011000
      │       │   │
      날짜    시작 종료
      20230908 1000 1100

구체적 예:
  2023-09-08, 10:00~11:00 → "202309081000110"
  2023-09-08, 09:00~10:30 → "2023090809001030"
```

- `classService.generateDocKey(date, startTime, endTime)` 함수로 생성
- Firebase 문서 ID로 직접 사용
- `classCalendarUtils.extractDateTimeFromDocKey(docKey)`로 역파싱 가능

---

## 6. 연관 유틸

### `classCalendarUtils.ts`

| 함수 | 역할 |
|---|---|
| `extractDateTimeFromDocKey(docKey)` | docKey에서 날짜/시간 파싱 |
| `extractDateAndTime(isoString)` | ISO 문자열에서 날짜/시간 분리 |
| `formatDateTime(date)` | "YYYY.MM.DD HH:MM" 포맷으로 변환 |

### ClassContext 상태 관리

```typescript
// useReducer Actions
SET_CLASSES    // 전체 수업 목록 교체 (월별 로드 시)
ADD_CLASS      // 단건 추가
UPDATE_CLASS   // 단건 수정
DELETE_CLASS   // 단건 삭제
SET_LOADING    // 로딩 상태 변경
```

- `ClassProvider`가 App 루트에서 감싸며 전역 상태 제공
- `useClassContext()`로 컴포넌트에서 접근
