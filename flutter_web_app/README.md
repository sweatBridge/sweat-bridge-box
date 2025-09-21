# Sweat Bridge Box - Flutter Web

기존 Vue.js(Core UI) 웹 애플리케이션을 Flutter Web으로 전환하는 프로젝트입니다.

## 프로젝트 구조

```
lib/
├── constants/          # 앱 상수 (색상, 테마 등)
│   └── app_colors.dart
├── models/            # 데이터 모델
├── providers/         # Riverpod 상태 관리
├── screens/           # 화면 위젯들
│   ├── main_layout.dart
│   ├── dashboard_screen.dart
│   └── login_screen.dart
├── utils/            # 유틸리티 함수들
├── widgets/          # 재사용 가능한 위젯들
│   ├── app_header.dart
│   └── app_sidebar.dart
└── main.dart         # 앱 진입점
```

## 주요 기능

### 현재 구현된 기능
- 🎨 모던한 UI/UX 디자인
- 📱 반응형 레이아웃 (사이드바 + 헤더)
- 🔐 로그인 화면
- 📊 대시보드 (통계 카드, 수업 일정, 최근 가입 회원)
- 🧭 네비게이션 (와드, 회원, 수업 관리)

### 계획된 기능
- 와드(운동) 관리
- 회원 관리
- 수업 스케줄 관리
- Firebase 연동
- 인증 시스템

## 실행 방법

### 개발 환경 설정
```bash
# Flutter 의존성 설치
flutter pub get

# 웹 서버로 실행 (포트 3000)
flutter run -d web-server --web-port 3000

# 또는 Chrome에서 실행
flutter run -d chrome
```

### 빌드
```bash
# 웹용 빌드
flutter build web

# 빌드된 파일은 build/web/ 디렉토리에 생성됩니다
```

## 사용된 패키지

- `flutter_riverpod`: 상태 관리
- `go_router`: 라우팅
- `shared_preferences`: 로컬 저장소

## 색상 테마

앱에서 사용되는 주요 색상들:
- Primary: `#2563EB` (파란색)
- Success: `#16A34A` (초록색)
- Warning: `#F59E0B` (주황색)
- Error: `#DC2626` (빨간색)
- Background: `#F8FAFC` (연한 회색)

## 개발 가이드

### 새 화면 추가
1. `lib/screens/` 디렉토리에 새 화면 파일 생성
2. `main.dart`의 라우터에 경로 추가
3. 필요시 사이드바 메뉴에 항목 추가

### 새 위젯 추가
1. `lib/widgets/` 디렉토리에 위젯 파일 생성
2. 재사용 가능하도록 설계
3. AppColors를 사용하여 일관된 색상 적용

## 마이그레이션 진행 상황

- ✅ 기본 프로젝트 구조 생성
- ✅ 레이아웃 및 네비게이션 구현
- ✅ 대시보드 기본 화면 구현
- ✅ 로그인 화면 구현
- ⏳ 와드 관리 기능
- ⏳ 회원 관리 기능
- ⏳ 수업 관리 기능
- ⏳ Firebase 연동
- ⏳ 인증 시스템 구현

## 브라우저 지원

- Chrome (권장)
- Firefox
- Safari
- Edge
