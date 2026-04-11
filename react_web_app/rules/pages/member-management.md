# Member Management (회원 관리)

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

회원 목록 조회, 등록, 삭제, 회원권 관리, 신청자 승인 등 회원 관련 모든 기능을 담당하는 페이지.

---

## 2. 파일 위치

```
src/pages/MemberManagement.tsx
src/components/modals/member/
  ├── AddMemberModal.tsx          (신규 회원 직접 등록)
  ├── MemberManagementModal.tsx   (회원 상세 및 회원권 관리)
  ├── MemberDeletionModal.tsx     (회원 삭제 확인)
  ├── MembershipPlanModal.tsx     (회원권 플랜 관리)
  ├── WarningMembersModal.tsx     (만료 임박 회원 목록)
  ├── NewMembersModal.tsx         (신규 가입 회원 목록)
  ├── ActiveMembersModal.tsx      (활성 회원 목록)
  ├── ApplyRequestModal.tsx       (신청자 승인/거절)
  └── ExtendAllModal.tsx          (전체 회원권 일괄 연장)
src/hooks/useMemberManagement.ts
```

---

## 3. 주요 데이터

| 데이터 | 타입 | 설명 |
|---|---|---|
| `members` | `Member[]` | 전체 회원 목록 |
| `filteredMembers` | `Member[]` | 검색/탭 필터 적용 결과 |
| `searchQuery` | `string` | 이름, 닉네임, 이메일 검색어 |
| `activeTab` | `'current' \| 'expired'` | 현재 회원 / 만료 회원 탭 |
| `currentPage` | `number` | 페이지네이션 현재 페이지 |

---

## 4. UI 구성

### 4-1. 통계 헤더
- 활성 회원 수 버튼 → `ActiveMembersModal` 오픈
- 만료 임박 회원 수 버튼 → `WarningMembersModal` 오픈
- 신규 회원 수 버튼 → `NewMembersModal` 오픈
- 전체 회원 수 표시

### 4-2. 액션 버튼
- 신규 회원 등록 → `AddMemberModal` 오픈
- 신청 요청 확인 → `ApplyRequestModal` 오픈
- 전체 회원권 연장 → `ExtendAllModal` 오픈
- 회원권 플랜 관리 → `MembershipPlanModal` 오픈

### 4-3. 탭
- **현재 회원**: 활성/만료임박 상태인 회원
- **만료 회원**: 모든 회원권이 만료된 회원

### 4-4. 검색
- 이름(realName), 닉네임(nickName), 이메일로 검색
- 실시간 필터링

### 4-5. 회원 목록 테이블
| 컬럼 | 설명 |
|---|---|
| 이름 | realName 표시 |
| 연락처 | phone (하이픈 포맷) |
| 성별 | M→남성, F→여성 |
| 상태 뱃지 | 활성 / 주의 / 만료 / 신규 |

- 행 클릭 → `MemberManagementModal` 오픈
- 삭제 버튼 → `MemberDeletionModal` 오픈
- **페이지네이션**: 5명씩 표시

---

## 5. 모달 목록

### AddMemberModal
- 신규 회원을 관리자가 직접 등록
- 필드: 이름, 이메일, 연락처, 성별, 생년월일
- 이메일을 문서 ID로 사용 → 중복 불가

### MemberManagementModal
- 회원 상세 정보 조회 및 편집
- 회원권 목록 조회 (현재, 예정, 과거, 환불됨)
- 회원권 추가 (회원권 플랜 선택 → 기간/횟수/금액 설정)
- 회원권 편집, 보류, 환불
- 메모 입력 및 저장
- 락커 이력 조회

### MemberDeletionModal
- 회원 삭제 최종 확인
- 삭제 시 해당 회원의 모든 데이터 제거

### MembershipPlanModal
- 박스 전용 회원권 플랜 목록 관리
- 플랜 추가/수정/삭제
- 플랜 타입: 기간제(periodPass) / 횟수제(countPass)

### WarningMembersModal
- 만료일이 14일 이내인 회원 목록
- 회원 클릭 시 `MemberManagementModal` 오픈

### NewMembersModal
- 최근 가입한 회원 목록
- 가입일 기준 내림차순 정렬

### ActiveMembersModal
- 현재 활성 상태인 회원 전체 목록

### ApplyRequestModal
- 외부 신청자(applied 컬렉션) 목록 조회
- 승인 → 회원으로 전환
- 거절 → 신청 데이터 삭제

### ExtendAllModal
- 전체 활성 회원의 회원권을 일괄로 N일 연장
- 연장 일수 입력 후 확인

---

## 6. 비즈니스 로직

### 회원 상태 뱃지
| 상태 | 조건 |
|---|---|
| `활성` | 만료일 > 오늘 + 14일 |
| `주의` | 만료일이 오늘~14일 이내 |
| `만료` | 모든 회원권 만료 |
| `신규` | 회원권 없음 |

### 회원권 카테고리 분류
- `current`: 시작일 ≤ 오늘 ≤ 만료일
- `future`: 시작일 > 오늘
- `past`: 만료일 < 오늘
- `refunded`: 환불 처리된 회원권

### 검색 필터
- `realName`, `nickName`, `email` 필드를 OR 조건으로 검색
- 대소문자 구분 없음

---

## 7. 연관 서비스 및 훅

- `src/hooks/useMemberManagement.ts` → 회원 CRUD 상태 관리
- `src/services/memberService.ts` → Firebase 회원 데이터 조작
- `src/services/membershipService.ts` → 회원권 플랜 및 상태 관리
- `src/utils/memberUtils.ts` → 상태 계산, 필터링 유틸
- `src/utils/phoneUtils.ts` → 연락처 포맷팅
