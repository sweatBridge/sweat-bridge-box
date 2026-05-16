# Auth Service (인증 서비스)

## Table of Contents
- [1. 개요](#1-개요)
- [2. 파일 위치](#2-파일-위치)
- [3. Firebase 컬렉션](#3-firebase-컬렉션)
- [4. 주요 함수](#4-주요-함수)
- [5. localStorage 관리](#5-localstorage-관리)
- [6. 인증 흐름](#6-인증-흐름)
- [7. 연관 컨텍스트](#7-연관-컨텍스트)

---

## 1. 개요

Firebase Authentication과 Firestore `user` 컬렉션을 연동하여 로그인/로그아웃 및 사용자 프로필을 관리하는 서비스.

---

## 2. 파일 위치

```
src/services/authService.ts
src/contexts/AuthContext.tsx
```

---

## 3. Firebase 컬렉션

```
/user/{email}
  boxName: string       // 소속 박스 이름
  email: string
  realName: string      // 실명
  nickName: string      // 닉네임
  phone: string
  role: string          // 역할 (admin, coach 등)
```

> 사용자 문서 ID = 이메일 주소

---

## 4. 주요 함수

### `login(credentials: LoginCredentials): Promise<User>`
1. `signInWithEmailAndPassword(auth, email, password)` 호출
2. Firebase ID 토큰 획득
3. `/user` 컬렉션에서 이메일로 사용자 프로필 조회
4. localStorage에 토큰 및 사용자 정보 저장
5. `User` 객체 반환

### `logout(): Promise<void>`
1. `signOut(auth)` 호출
2. localStorage의 모든 인증 관련 데이터 삭제

### `getUserInfo(email: string): Promise<User | null>`
- `/user` 컬렉션에서 이메일로 문서 조회
- 사용자 없으면 `null` 반환

---

## 5. localStorage 관리

| 키 | 값 | 설명 |
|---|---|---|
| `userToken` | Firebase ID 토큰 | 인증 토큰 |
| `tokenExpiration` | ISO 날짜 문자열 | 토큰 만료 시각 |
| `id` | string | 사용자 이메일 |
| `boxName` | string | 소속 박스 이름 |
| `realName` | string | 실명 |
| `nickName` | string | 닉네임 |
| `userEmail` | string | 이메일 |
| `userPhone` | string | 연락처 |
| `userRole` | string | 역할 |

> `boxName`은 모든 Firestore 쿼리의 경로 prefix로 사용됨
> (`/box/{boxName}/...`)

---

## 6. 인증 흐름

```
로그인 폼 입력
    ↓
authService.login()
    ↓
Firebase Auth 인증
    ↓
ID 토큰 발급
    ↓
/user 컬렉션 프로필 조회
    ↓
localStorage 저장
    ↓
AuthContext 상태 업데이트 (isAuthenticated: true)
    ↓
/dashboard 리다이렉트
```

### 토큰 만료 처리
- `AuthContext`에서 컨텍스트 초기화 시 `tokenExpiration` 확인
- 만료된 경우 자동 로그아웃 처리

### ProtectedRoute
- `AuthContext.isAuthenticated`가 false이면 `/login`으로 리다이렉트
- 로딩 중(`loading: true`)에는 스피너 표시

---

## 7. 연관 컨텍스트

- `src/contexts/AuthContext.tsx`
  - `AuthProvider`: 앱 전체 인증 상태 관리
  - `useAuth()`: 인증 상태와 메서드 접근 훅
  - `login()`, `logout()`, `clearError()` 제공
- `src/components/ProtectedRoute.tsx`: 인증된 사용자만 접근 허용
