# Table of Contents — src/

Claude Code가 특정 기능을 찾을 때 이 파일만 보고 바로 찾아갈 수 있도록 정리한 목차.

---

## 아키텍처 계층 요약

```
Pages + Modals (UI)
       ↓
Custom Hooks (상태/로직 통합)
       ↓
Service Layer (비즈니스 로직)
       ↓
Model Layer (데이터 변환/규칙)
       ↓
Repository Layer (Firebase 직접 접근)
       ↓
Firebase (Firestore DB + Auth)
```

---

## 기능별 파일 매핑 (빠른 탐색)

| 기능 | Page | Hook | Service | Model | Repository |
|------|------|------|---------|-------|------------|
| 인증 | Login.tsx | - | authService | - | authRepository |
| 회원 관리 | MemberManagement | useMemberManagement | memberService | memberModel | memberRepository |
| 회원권 관리 | (모달) | - | membershipService | membershipModel | membershipRepository |
| 수업 관리 | ClassReservation | useClassManagement | classService | classModel | classRepository |
| 락커 관리 | Locker | - | lockerService | lockerModel | lockerRepository |
| 매출 관리 | RevenueManagement | useRevenueManagement | revenueService | - | revenueRepository |
| 박스 설정 | BoxSettings | useBoxManagement | boxService | - | boxRepository |
| 어드민 관리 | AdminDashboard, AdminBoxList, AdminBoxDetail, AdminBoxOnboarding | useAdminBoxes | - | - | adminBoxRepository |

---

## src/ 전체 파일 목록

### 진입점
- `src/index.tsx` — React 앱 진입점, ReactDOM 렌더링
- `src/App.tsx` — 라우터 설정, 전체 페이지 구조 정의
- `src/react-app-env.d.ts` — TypeScript 환경 타입 정의

---

### src/config/
- `firebase.ts` — Firebase 초기화, Firestore DB 및 Auth 인스턴스 export

---

### src/types/
- `auth.ts` — 인증 타입 (LoginCredentials, User, AuthState, UserRole)
- `member.ts` — 회원 타입 (Member, BoxUser, MemberLockerHistory + releasedDate)
- `membership.ts` — 회원권 타입 (UserMembership, MembershipPlan, Adjustment)
- `class.ts` — 수업 타입 (ClassEvent, SaveClassResult, UpdateClassResult)
- `locker.ts` — 락커 타입 및 상태 상수 (Locker, LockerState, getLockerState)
- `revenue.ts` — 매출 타입 (DailyRevenue, MonthlyRevenue, RevenueData)
- `box.ts` — 박스/짐 타입 (BoxInfo, Coach, Address, BoxStatus)

---

### src/contexts/
- `AuthContext.tsx` — 인증 상태 전역 관리 (로그인/로그아웃/세션)
- `ClassContext.tsx` — 수업 목록 전역 상태 (useReducer)
- `PageContext.tsx` — 페이지 헤더 제목/부제 상태

---

### src/repositories/
> Firebase Firestore와 직접 통신하는 최하위 계층
- `authRepository.ts` — Firebase Auth 로그인/로그아웃, 사용자 조회
- `memberRepository.ts` — 회원 문서 CRUD
- `membershipRepository.ts` — 회원권 플랜 및 사용자 회원권 CRUD
- `classRepository.ts` — 수업 문서 범위 조회, 생성/수정/삭제
- `lockerRepository.ts` — 락커 문서 트랜잭션 처리
- `revenueRepository.ts` — 매출 데이터 연도별 조회/저장
- `boxRepository.ts` — 박스 정보 및 코치 목록 조회/저장, memberCount increment
- `adminBoxRepository.ts` — 어드민 전용: 전체 박스 목록 조회, 상태 변경, 신규 박스 생성 (하위 문서 포함)

---

### src/services/
> 비즈니스 로직 처리, Repository 위에서 동작
- `authService.ts` — 로그인, 로그아웃, localStorage 사용자 정보 관리
- `memberService.ts` — 회원 목록 조회, 락커 배정/반납(releasedDate 기록), 회원권 정보 통합
- `membershipService.ts` — 회원권 상태 판단 (활성/만료/홀딩), 경고 회원 필터링
- `classService.ts` — 수업 조회/생성/수정/삭제, 문서 키 파싱
- `lockerService.ts` — 락커 배정/해제/상태변경/히스토리 조회
- `revenueService.ts` — 월별 매출 집계, 일일 매출 계산, 통계 생성
- `boxService.ts` — 박스 정보 조회, 코치 목록 캐싱
- `dashboardMemoService.ts` — 대시보드 코치 메모 저장/로드

---

### src/models/
> Firebase 데이터 변환 및 비즈니스 규칙 적용
- `memberModel.ts` — Firebase Timestamp→Date 변환, 회원권 현재/미래/과거 분류
- `membershipModel.ts` — 회원권 홀딩 상태 판단, 활성 회원권 필터링, 경고 회원 로직
- `classModel.ts` — 수업 문서 키 생성/파싱 (YYYYMMDDHHMMHHMM), 날짜 포맷팅
- `lockerModel.ts` — 락커 데이터 정규화, 활성 배정 사용자 확인, 최신 상태 추출

---

### src/hooks/
> 재사용 가능한 상태/로직 관리
- `useMemberManagement.ts` — 회원 목록 로드/삭제, 에러 상태 관리
- `useClassManagement.ts` — 월별/일일 수업 로드, 수업 CRUD
- `useBoxManagement.ts` — 박스 설정 로드/저장, 코치 정보 관리
- `useRevenueManagement.ts` — 월별 매출 로드, 거래 내역 조회
- `useCoachOptions.ts` — 코치 목록 옵션 로드 (모달에서 공통 사용)
- `useAdminBoxes.ts` — 어드민 전용: 전체 박스 목록 로드, 박스 상태 업데이트

---

### src/pages/
- `Login.tsx` — 이메일/비밀번호 로그인, 이메일 저장 옵션
- `Dashboard.tsx` — 오늘의 수업, 회원 현황 요약, 코치 메모
- `MemberManagement.tsx` — 회원 목록, 추가/삭제, 회원 상세 접근
- `ClassReservation.tsx` — FullCalendar 기반 수업 관리, 예약자 관리
- `Locker.tsx` — 락커 그리드 표시, 배정/반납/히스토리 흐름 제어
- `RevenueManagement.tsx` — 월별 매출 현황, 거래 내역
- `BoxSettings.tsx` — 박스 정보 수정, 코치 추가/삭제

#### src/pages/admin/
> 어드민(operator/admin 역할) 전용 페이지. `AdminProtectedRoute`로 보호됨.
- `AdminDashboard.tsx` — 전체 박스 현황 요약, TOP5 바 차트, 도넛 차트
- `AdminBoxList.tsx` — 전체 박스 목록, 검색/필터, 신규 등록 진입
- `AdminBoxDetail.tsx` — 박스 상세 정보, 운영 상태 변경 (활성/정지)
- `AdminBoxOnboarding.tsx` — 신규 고객사 등록 폼, Firebase 박스 생성 (하위 문서 포함)
- `_mockData.ts` — 개발 초기 목업 데이터 (현재는 Firebase 연동으로 대체)

---

### src/components/

#### 레이아웃
- `MainLayout.tsx` — 사이드바 + 헤더 + 콘텐츠 영역 레이아웃
- `AppHeader.tsx` — 상단 헤더 (페이지 제목, 사용자 정보, 로그아웃)
- `AppSidebar.tsx` — 좌측 네비게이션, 메뉴 토글
- `ProtectedRoute.tsx` — 인증 필수 라우트 보호
- `AdminProtectedRoute.tsx` — 어드민 전용 라우트 보호 (isOperator 체크)
- `AdminLayout.tsx` — 어드민 전용 레이아웃 (AdminSidebar + AdminHeader)
- `AdminSidebar.tsx` — 어드민 좌측 네비게이션 (다크 슬레이트 테마)
- `AdminHeader.tsx` — 어드민 상단 헤더 (operator 배지, 로그아웃)

#### 공통 UI
- `DateInput.tsx` — 날짜 선택 입력 (react-datepicker 래퍼, 한국어 로케일)
- `ToastMessage.tsx` — 토스트 알림 (success/danger/warning/info)

#### modals/member/
- `AddMemberModal.tsx` — 신규 회원 추가 (이메일/전화 형식 검증)
- `MemberDetailsModal.tsx` — 회원 상세 정보 조회 (읽기 전용)
- `MemberManagementModal.tsx` — 통합 회원 관리 (회원권 추가/수정, 락커 이력 탭)
- `MemberDeletionModal.tsx` — 회원 삭제 확인
- `ActiveMembersModal.tsx` — 활성 회원 목록
- `WarningMembersModal.tsx` — 만료 임박 회원 목록
- `NewMembersModal.tsx` — 신규 회원 목록
- `ApplyRequestModal.tsx` — 가입 신청 승인/거절

#### modals/membership/
- `EditMembershipModal.tsx` — 회원권 기간/금액 수정
- `MembershipPlanModal.tsx` — 회원권 플랜 추가/수정
- `HoldMembershipModal.tsx` — 회원권 홀딩 처리
- `RefundMembershipModal.tsx` — 회원권 환불 처리
- `RefundInfoModal.tsx` — 환불 상세 정보 조회
- `DeleteMembershipConfirmModal.tsx` — 회원권 삭제 확인
- `ExtendAllModal.tsx` — 전체 회원권 일괄 연장
- `AdjustmentHistoryModal.tsx` — 회원권 조정 이력

#### modals/class/
- `SaveClassModal.tsx` — 새 수업 생성
- `ManageClassModal.tsx` — 수업 수정/삭제
- `ReservedMembersModal.tsx` — 수업 예약자 목록
- `AddReserveMemberModal.tsx` — 수업에 회원 추가

#### modals/locker/
- `AddLockerModal.tsx` — 락커 번호 범위 추가
- `AssignLockerModal.tsx` — 락커 회원 배정 (회원 검색, 기간/금액 입력)
- `UpdateLockerModal.tsx` — 락커 배정 정보 수정 (종료일, 금액)
- `LockerDetailsModal.tsx` — 락커 상세 정보 (수정/반납/삭제/이력 접근)
- `LockerHistoryModal.tsx` — 락커 전체 사용 이력
- `ReleaseLockerConfirmModal.tsx` — 락커 반납 확인 (사유, 담당자 입력)
- `DeleteLockerConfirmModal.tsx` — 락커 삭제 확인

#### modals/revenue/
- `TransactionHistoryModal.tsx` — 거래 내역 상세 조회

#### modals/common/
- `CoachActionConfirmModal.tsx` — 코치 추가/삭제 확인

---

### src/utils/
- `dateUtils.ts` — 날짜 포맷 (YYYY-MM-DD), 파싱, getDaysBetween (양 끝 포함)
- `phoneUtils.ts` — 전화번호 정규화, 포맷팅 (010-1234-5678)
- `memberUtils.ts` — 성별/나이 계산, 회원권 상태, 락커 이력 상태 판단 (getLockerHistoryStatus 등)
- `keyGenerator.ts` — 회원권/락커 배정 고유 키 생성 (8자리 랜덤)
- `coachStorage.ts` — 코치 목록 localStorage 캐싱

---

### src/constants/
- `colors.ts` — 앱 전체 색상 팔레트 (primary, success, warning, error 등)
- `gradients.ts` — 그라데이션 상수 (primary, primaryHover, primaryLight)
- `adminColors.ts` — 어드민 전용 색상 팔레트 (다크 슬레이트 계열, #1e293b 기반)

---

### src/design-system/
- `theme.css` — 전체 테마 CSS 변수
- `tokens/index.ts` — 디자인 토큰 export
- `tokens/primitives/blue.ts` — 파란색 톤 정의
- `tokens/primitives/gray.ts` — 회색 톤 정의
- `tokens/primitives/red.ts` — 빨간색 톤 정의
- `tokens/semantic/colors.ts` — 의미 기반 색상 (primary, error, success 등)

---

### src/tests/
- `unit/App.test.tsx` — App 컴포넌트 기본 테스트
- `unit/architecture-refactor.models.test.ts` — 모델 계층 단위 테스트
- `integration/architecture-refactor.services.test.ts` — 서비스 계층 통합 테스트
- `integration/architecture-refactor.golden.test.ts` — 골든 파일 통합 테스트
- `fixtures/architectureFixtures.ts` — 테스트용 목(Mock) 데이터
