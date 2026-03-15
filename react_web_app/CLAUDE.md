# CLAUDE.md

이 파일은 Claude Code가 이 저장소에서 작업할 때 참고하는 가이드다.

## 명령어

```bash
npm install      # 의존성 설치
npm start        # 개발 서버 실행 (포트 3000)
npm run build    # 프로덕션 빌드 (build/ 디렉토리)
npm test         # Jest 테스트 실행 (인터랙티브 watch 모드)
npm test -- --watchAll=false  # 테스트 1회 실행 (CI 모드)
```

## 문서

도메인별 상세 문서는 `rules/` 디렉토리에 한국어로 작성되어 있다.

- `rules/README.md` — 전체 아키텍처 개요, Firestore 구조, 상태 관리 패턴, 문서 인덱스
- `rules/pages/` — 각 페이지 + 모달 컴포넌트 상세 (UI 구성, 비즈니스 로직, 연관 서비스)
  - `dashboard.md`, `member-management.md`, `class-reservation.md`
  - `locker.md`, `revenue-management.md`, `box-settings.md`
- `rules/services/` — 각 서비스 레이어 상세 (Firebase 컬렉션 구조, 함수 설명, 서비스 간 연동)
  - `auth-service.md`, `member-service.md`, `membership-service.md`
  - `class-service.md`, `locker-service.md`, `revenue-service.md`

## 아키텍처

Sweat Bridge Box는 React 19, TypeScript, Firebase 기반의 헬스장/CrossFit 박스 관리 앱이다.

### 기술 스택
- **React 19** with TypeScript
- **Firebase**: Firestore (데이터베이스) + Auth (인증)
- **React Router DOM 7**: 라우팅 및 보호된 라우트
- **FullCalendar**: 수업 스케줄 달력
- **react-datepicker + date-fns**: 날짜 입력 처리
- **Lucide React**: 아이콘 라이브러리

### 데이터 흐름 패턴
```
사용자 액션 → Modal/Page → Custom Hook → Service → Firebase Firestore
                               ↓
                     Context 업데이트 → UI 리렌더링
```

### 상태 관리
Redux 없이 React Context + useReducer 패턴 사용:
- `AuthContext`: 인증 상태 (로그인/로그아웃)
- `ClassContext`: 수업 이벤트 (useReducer)
- `PageContext`: 페이지 헤더/네비게이션 상태

### Firestore 데이터 구조
모든 컬렉션은 박스 단위로 격리: `/box/{boxName}/collection/{documentId}`

박스 이름은 localStorage에 `boxName` 키로 저장된다.

### 주요 디렉토리
- `src/services/`: Firebase 연산 (memberService, membershipService, classService 등)
- `src/hooks/`: 비즈니스 로직 훅 (useClassManagement, useMemberManagement 등)
- `src/contexts/`: React Context 프로바이더
- `src/components/modals/`: 기능별 모달 컴포넌트 (class/, member/, membership/, locker/, revenue/)
- `src/pages/`: 라우트 페이지 컴포넌트
- `src/types/`: 모든 엔티티의 TypeScript 인터페이스

### UI 패턴
- CRUD 작업은 모달 다이얼로그 방식으로 처리
- `ProtectedRoute` 컴포넌트가 인증된 라우트를 보호
- `MainLayout`이 모든 인증 페이지를 사이드바 + 헤더로 감쌈
- `DateInput` 컴포넌트를 모든 날짜 입력에 사용 (한국어 로케일, 연도 범위 2000-2999)

### 색상 테마
- Primary: `#2563EB` (파란색)
- Success: `#16A34A` (초록색)
- Warning: `#F59E0B` (주황색)
- Error: `#DC2626` (빨간색)
- Background: `#F8FAFC` (연한 회색)

### 날짜 유틸리티
- `src/utils/dateUtils.ts`: 날짜 포맷 및 계산 유틸리티
- `getDaysBetween(start, end)`: 시작일과 종료일을 포함한 일수 반환 (양 끝 포함)
  - 예시: 01.04 ~ 01.05 = 2일

## Firebase 설정

`.env` 파일에 아래 항목이 필요하다:
```
REACT_APP_FIREBASE_API_KEY=
REACT_APP_FIREBASE_AUTH_DOMAIN=
REACT_APP_FIREBASE_PROJECT_ID=
REACT_APP_FIREBASE_STORAGE_BUCKET=
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=
REACT_APP_FIREBASE_APP_ID=
```
