# Sweat Bridge Box - React Web

기존 Vue.js(Core UI) 웹 애플리케이션을 React로 전환하는 프로젝트입니다.
Flutter Web 버전과 동일한 기능을 React로 구현했습니다.

## 프로젝트 구조

```
src/
├── components/         # 재사용 가능한 컴포넌트
│   ├── AppHeader.tsx   # 상단 헤더 컴포넌트
│   ├── AppSidebar.tsx  # 좌측 사이드바 컴포넌트
│   └── MainLayout.tsx  # 메인 레이아웃 컴포넌트
├── pages/             # 페이지 컴포넌트
│   ├── Dashboard.tsx   # 대시보드 페이지
│   └── Login.tsx       # 로그인 페이지
├── constants/         # 상수 정의
│   └── colors.ts       # 색상 상수
├── types/            # TypeScript 타입 정의
├── hooks/            # 커스텀 React 훅
├── App.tsx           # 메인 앱 컴포넌트
├── App.css           # 전역 스타일
└── index.tsx         # 앱 진입점
```

## 주요 기능

### 현재 구현된 기능
- 🎨 모던한 UI/UX 디자인 (Flutter Web과 동일)
- 📱 반응형 레이아웃 (사이드바 + 헤더)
- 🔐 로그인 화면
- 📊 대시보드 (통계 카드, 수업 일정, 최근 가입 회원)
- 🧭 네비게이션 (와드, 회원, 수업 관리)
- ⚙️ 헤더 설정 메뉴 및 로그아웃 다이얼로그

### 계획된 기능
- 와드(운동) 관리 페이지
- 회원 관리 페이지
- ✅ 수업 스케줄 관리 페이지 (Firebase 연동)
- ✅ React Router 도입
- ✅ 상태 관리 (React Context + useReducer)
- ✅ Firebase 연동 (Firestore)

## 실행 방법

### Firebase 설정
1. Firebase 콘솔에서 새 프로젝트 생성
2. Firestore Database 활성화
3. 웹 앱 등록 후 구성 정보 복사
4. 프로젝트 루트에 `.env` 파일 생성:

```env
REACT_APP_FIREBASE_API_KEY=your-api-key-here
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

### 개발 환경 설정
```bash
# 의존성 설치
npm install

# 개발 서버 실행 (포트 3000)
npm start

# 브라우저에서 http://localhost:3000 접속
```

### 빌드
```bash
# 프로덕션 빌드
npm run build

# 빌드된 파일은 build/ 디렉토리에 생성됩니다
```

### 테스트
```bash
# 테스트 실행
npm test
```

## 사용된 패키지

- `react`: React 라이브러리
- `typescript`: TypeScript 지원
- `react-router-dom`: 라우팅 (설치됨, 추후 사용 예정)
- `lucide-react`: 아이콘 라이브러리

## 색상 테마

Flutter Web 버전과 동일한 색상 테마 사용:
- Primary: `#2563EB` (파란색)
- Success: `#16A34A` (초록색)
- Warning: `#F59E0B` (주황색)
- Error: `#DC2626` (빨간색)
- Background: `#F8FAFC` (연한 회색)

## 개발 가이드

### 새 페이지 추가
1. `src/pages/` 디렉토리에 새 페이지 컴포넌트 생성
2. `MainLayout.tsx`의 `renderContent` 함수에 케이스 추가
3. 필요시 라우팅 설정

### 새 컴포넌트 추가
1. `src/components/` 디렉토리에 컴포넌트 파일 생성
2. TypeScript 인터페이스로 props 타입 정의
3. CSS 클래스 활용하여 스타일링

### 스타일링 가이드
- CSS 클래스 기반 스타일링 사용
- `App.css`에 전역 스타일 정의
- 컴포넌트별 스타일은 인라인 또는 CSS 모듈 사용 고려

## Flutter Web vs React 비교

| 기능 | Flutter Web | React |
|------|-------------|-------|
| 언어 | Dart | TypeScript/JavaScript |
| 상태 관리 | Riverpod | useState (추후 Redux/Zustand) |
| 라우팅 | go_router | react-router-dom |
| 스타일링 | Widget 기반 | CSS 클래스 기반 |
| 아이콘 | Material Icons | Lucide React |
| 빌드 크기 | 큰 편 | 작은 편 |
| 개발 경험 | 핫 리로드 | 핫 리로드 |

## 마이그레이션 진행 상황

- ✅ 기본 프로젝트 구조 생성
- ✅ 레이아웃 및 네비게이션 구현
- ✅ 대시보드 기본 화면 구현
- ✅ 로그인 화면 구현
- ✅ 헤더 기능 (설정 메뉴, 로그아웃)
- ⏳ React Router 도입
- ⏳ 상태 관리 라이브러리 도입
- ⏳ 와드 관리 기능
- ⏳ 회원 관리 기능
- ⏳ 수업 관리 기능
- ⏳ API 연동

## 브라우저 지원

- Chrome (권장)
- Firefox
- Safari
- Edge

## 개발 참고사항

- 현재 `isLoggedIn` 상태가 `true`로 고정되어 있어 바로 대시보드가 표시됩니다
- 로그인 화면을 보려면 `App.tsx`에서 `isLoggedIn`을 `false`로 변경하세요
- 반응형 디자인이 적용되어 모바일에서도 사용 가능합니다
