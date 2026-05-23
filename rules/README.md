# Sweat Bridge Box - 코드베이스 문서

## Table of Contents
- [1. 프로젝트 개요](#1-프로젝트-개요)
- [2. 기술 스택](#2-기술-스택)
- [3. 전체 아키텍처](#3-전체-아키텍처)
- [4. Firestore 데이터 구조](#4-firestore-데이터-구조)
- [5. 상태 관리](#5-상태-관리)
- [6. 디렉토리 구조](#6-디렉토리-구조)
- [7. 도메인별 문서 링크](#7-도메인별-문서-링크)

---

## 1. 프로젝트 개요

**Sweat Bridge Box**는 CrossFit 박스 또는 헬스장을 관리하는 웹 애플리케이션이다.
박스 관리자가 회원, 수업, 락커, 매출을 한 곳에서 통합 관리할 수 있도록 설계되었다.

### 핵심 기능
| 기능 | 설명 |
|---|---|
| 회원 관리 | 회원 등록/삭제, 회원권 추가/수정/환불/보류 |
| 수업 관리 | FullCalendar 기반 수업 스케줄 생성 및 예약 관리 |
| 락커 관리 | 락커 배정/반납/이력 추적 |
| 매출 관리 | 일별/월별 매출 집계, 현금/카드 구분 |
| 박스 설정 | 박스 기본 정보, 코치 목록 관리 |

---

## 2. 기술 스택

| 분류 | 기술 |
|---|---|
| Frontend | React 19, TypeScript |
| Backend/DB | Firebase Firestore |
| 인증 | Firebase Authentication |
| 라우팅 | React Router DOM 7 |
| 달력 | FullCalendar |
| 날짜 처리 | react-datepicker, date-fns |
| 아이콘 | Lucide React |

---

## 3. 전체 아키텍처

```
사용자 액션
    ↓
Page / Modal (UI 레이어)
    ↓
Custom Hook (비즈니스 로직)
    ↓
Service (Firebase 호출)
    ↓
Firebase Firestore
    ↓
Context 업데이트 → UI 리렌더링
```

### 데이터 흐름 원칙
- **Service**: Firebase와의 모든 통신 담당. 타입 변환(Timestamp→Date) 포함.
- **Hook**: 상태(`useState`) 보유, 서비스 호출 후 상태 업데이트.
- **Context**: 전역 공유 상태 (인증, 수업 목록).
- **Page/Modal**: Hook에서 함수와 상태를 받아 UI만 담당.

---

## 4. Firestore 데이터 구조

모든 박스 데이터는 `/box/{boxName}/` 하위에 격리되어 저장된다.
`boxName`은 로그인 시 localStorage에 저장되며 모든 쿼리에 사용된다.

```
/user/{email}                           ← 앱 사용자 (관리자/코치/회원)

/box/{boxName}/
  member/{email}                        ← 회원 정보 + 회원권 배열 + 락커 이력
  membership/plansDoc                   ← 회원권 플랜 목록
  class/{docKey}                        ← 수업 (YYYYMMDDHHMMHHMM 키)
  lockers/lockerdoc                     ← 전체 락커 (번호 → 이력 배열)
  revenue/{year}                        ← 연도별 매출 문서
  applied/applieddoc                    ← 외부 가입 신청자
  dashboardCoachMemos/coachMemoDoc      ← 대시보드 코치 메모
  wod/{YYYYMMDD}                        ← WOD (모바일 앱 전용)

/feedback/{email}/feedbacks/{id}        ← 피드백 (모바일 앱 전용)
/records/{autoId}                       ← 🪦 레거시 WOD 기록 인덱스
```

전체 Firestore 트리(모바일 앱 경로, 필드 상세, 문서 ID 컨벤션 포함)는 [firebase-structure.md](./firebase-structure.md) 참고.

---

## 5. 상태 관리

| 위치 | 패턴 | 목적 |
|---|---|---|
| `AuthContext` | useState | 로그인 상태, 사용자 프로필 |
| `ClassContext` | useReducer | 수업 이벤트 전역 목록 |
| `PageContext` | useState | 페이지 제목/부제목 |
| `useMemberManagement` | useState | 회원 목록, 로딩 상태 |
| `useRevenueManagement` | useState | 매출 데이터, 통계 |
| `useBoxManagement` | useState | 박스 정보 |
| `localStorage` | 브라우저 저장소 | 인증 토큰, 사용자 정보, boxName |

---

## 6. 디렉토리 구조

```
src/
├── pages/                  ← 라우트 페이지 컴포넌트
├── components/
│   ├── modals/             ← 도메인별 모달 컴포넌트
│   │   ├── member/
│   │   ├── class/
│   │   ├── membership/
│   │   ├── locker/
│   │   └── revenue/
│   ├── MainLayout.tsx      ← 사이드바 + 헤더 레이아웃
│   ├── ProtectedRoute.tsx  ← 인증 가드
│   └── DateInput.tsx       ← 공통 날짜 입력 컴포넌트
├── services/               ← Firebase 통신 레이어
├── hooks/                  ← 비즈니스 로직 훅
├── contexts/               ← React Context 프로바이더
├── types/                  ← TypeScript 인터페이스
├── utils/                  ← 유틸리티 함수
├── constants/              ← 색상, 그라디언트 상수
└── config/
    └── firebase.ts         ← Firebase 초기화
```

---

## 7. 도메인별 문서 링크

### Pages (페이지 + 컴포넌트)
| 문서 | 설명 |
|---|---|
| [dashboard.md](./pages/dashboard.md) | 대시보드 - 오늘 수업, 회원 현황 요약 |
| [member-management.md](./pages/member-management.md) | 회원 관리 - 회원 CRUD, 회원권 관리, 신청자 승인 |
| [class-reservation.md](./pages/class-reservation.md) | 수업 관리 - FullCalendar 기반 수업 스케줄 |
| [locker.md](./pages/locker.md) | 락커 관리 - 락커 배정/반납/이력 |
| [revenue-management.md](./pages/revenue-management.md) | 매출 관리 - 일별/월별 매출 집계 |
| [box-settings.md](./pages/box-settings.md) | 박스 설정 - 기본 정보, 코치 관리 |

### Services (서비스 레이어)
| 문서 | 설명 |
|---|---|
| [auth-service.md](./services/auth-service.md) | 인증 - 로그인/로그아웃, 토큰 관리 |
| [member-service.md](./services/member-service.md) | 회원 - Firestore member 컬렉션 CRUD |
| [membership-service.md](./services/membership-service.md) | 회원권 - 플랜 관리, 보류/환불/일괄 연장 |
| [class-service.md](./services/class-service.md) | 수업 - docKey 규칙, 반복 수업 생성 |
| [locker-service.md](./services/locker-service.md) | 락커 - 단일 문서 구조, 이력 배열 관리 |
| [revenue-service.md](./services/revenue-service.md) | 매출 - 자동 기록, 일별 집계, 통계 |
