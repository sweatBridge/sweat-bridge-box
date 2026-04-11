# Box Settings (박스 설정)

## Table of Contents
- [1. 개요](#1-개요)
- [2. 파일 위치](#2-파일-위치)
- [3. 주요 데이터](#3-주요-데이터)
- [4. UI 구성](#4-ui-구성)
- [5. 비즈니스 로직](#5-비즈니스-로직)
- [6. 연관 서비스 및 훅](#6-연관-서비스-및-훅)

---

## 1. 개요

박스(헬스장/CrossFit 박스) 기본 정보와 코치 목록을 관리하는 설정 페이지.

---

## 2. 파일 위치

```
src/pages/BoxSettings.tsx
src/hooks/useBoxManagement.ts
```

---

## 3. 주요 데이터

| 데이터 | 타입 | 설명 |
|---|---|---|
| `boxInfo` | `BoxInfo` | 박스 기본 정보 |
| `coaches` | `Coach[]` | 코치 목록 (`boxInfo.coaches`에 포함) |

### BoxInfo 구조
```typescript
{
  name: string          // 박스 이름 (읽기 전용 - localStorage에서)
  email: string         // 대표 이메일
  representative: string // 대표자명
  phone: string         // 연락처
  address: Address      // 주소 (상세주소 포함)
  description: string   // 박스 소개
  coaches: Coach[]      // 코치 목록
}
```

### Coach 구조
```typescript
{
  name: string    // 코치 이름
  phone: string   // 코치 연락처
  email: string   // 코치 이메일
}
```

---

## 4. UI 구성

### 4-1. 박스 기본 정보 폼
| 필드 | 수정 가능 여부 | 설명 |
|---|---|---|
| 박스 이름 | 읽기 전용 | localStorage `boxName` 값 |
| 이메일 | 편집 가능 | 대표 이메일 |
| 대표자명 | 편집 가능 | |
| 연락처 | 편집 가능 | |
| 주소 | 편집 가능 | 다음(Kakao) 주소 API 팝업 사용 |
| 상세 주소 | 편집 가능 | 주소 선택 후 수동 입력 |
| 박스 소개 | 편집 가능 | textarea |

> 주소 검색: 다음 우편번호 API 팝업 → 우편번호, 도로명 주소 자동 입력

### 4-2. 코치 관리
- 코치 목록 테이블 (이름, 연락처, 이메일)
- **코치 추가**: 이름/연락처/이메일 입력 폼 → 목록에 추가
- **코치 삭제**: 해당 행의 삭제 버튼
- **코치 편집**: 인라인 편집 또는 별도 폼

### 4-3. 저장 버튼
- 변경사항 전체 저장 → `boxService.updateBoxInfo()` 호출
- 저장 완료 시 Toast 알림 표시

---

## 5. 비즈니스 로직

### 박스 이름 정책
- 박스 이름은 변경 불가 (읽기 전용 표시)
- Firestore 경로 키(`/box/{boxName}`)로 사용되므로 변경 시 데이터 접근 불가

### 코치 목록 관리
- 코치 목록은 `BoxInfo.coaches[]` 배열에 포함되어 저장
- 별도 컬렉션 없이 박스 문서 내 필드로 관리
- 코치 추가/삭제는 로컬 상태에서 먼저 처리 → 저장 시 일괄 반영

### 수업 생성과의 연관성
- `BoxInfo.coaches[]`에 등록된 코치만 수업 생성 시 선택 가능
- 코치 삭제 시 기존 수업의 코치 정보는 유지됨 (참조 삭제 없음)

---

## 6. 연관 서비스 및 훅

- `src/hooks/useBoxManagement.ts` → 박스 정보 상태 관리
- `src/services/boxService.ts` → Firebase 박스 데이터 조작
  - `getBoxInfo(boxName)`
  - `updateBoxInfo(boxInfo)`
