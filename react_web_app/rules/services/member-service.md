# Member Service (회원 서비스)

## Table of Contents
- [1. 개요](#1-개요)
- [2. 파일 위치](#2-파일-위치)
- [3. Firebase 컬렉션](#3-firebase-컬렉션)
- [4. 주요 함수](#4-주요-함수)
- [5. 데이터 변환 규칙](#5-데이터-변환-규칙)
- [6. 연관 서비스](#6-연관-서비스)

---

## 1. 개요

Firestore의 `member` 컬렉션을 대상으로 회원 CRUD, 회원권 업데이트, 락커 이력 관리, 신청자 승인/거절을 처리하는 서비스.

---

## 2. 파일 위치

```
src/services/memberService.ts
src/hooks/useMemberManagement.ts
```

---

## 3. Firebase 컬렉션

```
/box/{boxName}/member/{email}
  email: string
  realName: string
  nickName: string
  gender: 'M' | 'F'
  birthDate: Timestamp
  phone: string
  joinedAt: Timestamp
  memo: string
  memberships: UserMembership[]         // 현재/과거 회원권
  futureMemberships: UserMembership[]   // 예정 회원권
  lockerHistory: MemberLockerHistory[]  // 락커 사용 이력

/box/{boxName}/applied/applieddoc
  {email}: ApplicantData  // 외부 신청자 데이터
```

> 문서 ID = 회원 이메일 주소

---

## 4. 주요 함수

### `getMembers(box: string): Promise<Member[]>`
- `/box/{box}/member` 전체 조회
- Firebase Timestamp → JavaScript Date 변환
- 각 회원의 회원권 카테고리 분류:
  - `current`: 오늘 기준 유효 기간 내
  - `future`: 시작일이 미래
  - `past`: 만료됨
  - `refunded`: 환불 처리됨
- `MembershipInfo` 계산하여 회원 객체에 포함

### `createMember(box: string, memberData): Promise<void>`
- 이메일을 문서 ID로 사용하여 생성
- 이미 존재하는 이메일이면 오류 발생 (중복 불가)

### `deleteMember(box: string, email: string): Promise<void>`
- 해당 회원 문서 삭제

### `updateMemberMembership(box: string, email: string, membershipData): Promise<void>`
- 회원 문서의 `memberships` 배열 전체 교체

### `updateMemberMemo(box: string, email: string, memo: string): Promise<void>`
- 회원 메모 필드만 업데이트

### `searchMembersByName(box: string, name: string): Promise<Member[]>`
- `realName` 필드 기준 Firestore 쿼리 (startAt/endAt)
- 프론트에서 추가 필터링(닉네임, 이메일)과 병행 사용

---

### 락커 이력 함수

### `assignLockerToMember(box, email, lockerHistory): Promise<void>`
- 회원 문서의 `lockerHistory` 배열에 신규 이력 추가
- `arrayUnion` 사용

### `updateLockerHistoryEndDate(box, email, key, newEndDate): Promise<void>`
- `lockerHistory` 배열에서 `key`로 항목 찾아 `endDate` 업데이트
- 배열 전체를 새 배열로 교체하는 방식

### `unassignLockerFromMember(box, email, key): Promise<void>`
- 해당 키의 락커 이력에 현재 날짜를 `endDate`로 기록

---

### 신청자 함수

### `fetchApplicants(boxName: string): Promise<ApplicantData[]>`
- `/box/{boxName}/applied/applieddoc` 단일 문서 조회
- 필드 키가 이메일인 객체 구조

### `approveApplicant(boxName, email, applicantData): Promise<void>`
1. 신청자 데이터로 회원 문서 생성 (`createMember`)
2. `applieddoc`에서 해당 이메일 필드 삭제

### `rejectApplicant(boxName, email): Promise<void>`
- `applieddoc`에서 해당 이메일 필드 삭제

---

## 5. 데이터 변환 규칙

### Firebase Timestamp → Date 변환
- `getMembers()` 내부에서 일괄 처리
- `birthDate`, `joinedAt`, 회원권의 날짜 필드 모두 변환
- 컴포넌트 레이어에서는 항상 `Date` 타입으로 사용

### 회원권 카테고리 분류 기준
```
오늘 날짜 기준:
- startDate <= 오늘 <= endDate → current
- startDate > 오늘              → future
- endDate < 오늘                → past
- refunded == true              → refunded (우선 적용)
```

---

## 6. 연관 서비스

- `src/services/membershipService.ts` → 회원권 상태 계산 (`getMemberStatusBadge`)
- `src/services/lockerService.ts` → 락커 상태 업데이트 (양방향 동기화)
- `src/utils/memberUtils.ts` → 필터링, 상태 계산 유틸
- `src/utils/phoneUtils.ts` → 연락처 포맷
