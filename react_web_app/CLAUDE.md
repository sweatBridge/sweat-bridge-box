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

## 문서 / 디렉토리

`src/` 하위 디렉토리와 파일 전체 목록 및 역할은 `.claude/toc.md` 참고.

## 아키텍처

Sweat Bridge Box는 React 19, TypeScript, Firebase 기반의 헬스장/CrossFit 박스 관리 앱이다.

### 기술 스택
- **React 19** with TypeScript
- **Firebase 12**: Firestore (데이터베이스) + Auth (인증)
- **React Router DOM 7**: 라우팅 및 보호된 라우트
- **FullCalendar 6**: 수업 스케줄 달력
- **react-datepicker 9**: 날짜 입력 처리
- **Lucide React**: 아이콘 라이브러리

### 데이터 흐름 패턴

계층 구조: Page/Modal → Hook → Service → Model → Repository → Firebase

```
사용자 액션 → Modal/Page → Custom Hook → Service → Model → Repository → Firebase Firestore
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

주요 컬렉션:
- `members/{email}` — 회원 정보, 회원권, 락커 이력
- `memberships/membershipdoc` — 회원권 플랜 정의
- `lockers/lockerdoc` — 락커 전체 상태 (번호를 키로 사용, 이력 배열로 관리)
- `classes/{YYYYMM}` — 월별 수업 문서
- `revenue/{YYYY}` — 연도별 매출 데이터
- `box/boxdoc` — 박스 기본 정보, 코치 목록

### UI 패턴
- CRUD 작업은 모달 다이얼로그 방식으로 처리
- `ProtectedRoute` 컴포넌트가 인증된 라우트를 보호
- `MainLayout`이 모든 인증 페이지를 사이드바 + 헤더로 감쌈
- `DateInput` 컴포넌트를 모든 날짜 입력에 사용 (한국어 로케일)

### 색상 테마
`src/constants/colors.ts`의 `AppColors`, `src/constants/gradients.ts`의 `Gradients`를 사용.

- Primary: `#3182f6`
- Success: `#03B26C`
- Warning: `#FE9800`
- Error: `#F04452`
- Background: `#F9FAFB`
- Sidebar: `#191F28`

어드민 전용 색상은 `src/constants/adminColors.ts`의 `AdminColors`를 사용.

- Primary: `#1e293b` (다크 슬레이트, 사이드바와 일관된 어두운 계열)
- Hover: `#334155`
- Light BG: `#f1f5f9`
- Accent: `#475569`
- Header Gradient: `linear-gradient(135deg, #1e293b 0%, #334155 100%)`

### 날짜 유틸리티
`src/utils/dateUtils.ts`:
- `formatDateToString(date)`: Date → `YYYY-MM-DD`
- `parseStringToDate(str)`: `YYYY-MM-DD` → Date
- `getDaysBetween(start, end)`: 시작일과 종료일을 포함한 일수 (예: 01.04~01.05 = 2일)
