# Models / Services 로직 가이드

이 문서는 `src/models` 와 `src/services`의 실제 코드를 읽고,
"이 파일이 무슨 책임을 가지며, 어떤 입력을 받아 어떤 판단을 하고, 어떤 값을 돌려주는지"를
자연어로 정리한 문서다.

목표는 다음 두 가지다.

- 코드를 처음 보는 사람이 문서만 읽어도 전체 동작 구조를 이해할 수 있게 한다.
- 특정 기능을 수정할 때 "어느 파일을 봐야 하는지"를 빠르게 판단할 수 있게 한다.

---

## 1. 전체 구조 요약

현재 React 앱은 대략 다음 레이어로 나뉜다.

- `models`
  - Firebase에서 읽어온 원시 데이터를 화면/서비스가 쓰기 쉬운 형태로 바꾸거나
    화면 상태 판단에 필요한 순수 계산 로직을 담는다.
  - 가능한 한 "읽기/변환/판단" 중심이다.
- `services`
  - 실제 기능 흐름을 담당한다.
  - repository를 호출해 데이터를 읽고 쓰고, model 함수를 조합해 화면용 결과를 만든다.
  - 회원권 추가 시 매출 기록을 같이 남기는 것처럼
    여러 도메인을 연결하는 오케스트레이션이 여기서 일어난다.

간단히 보면:

- `models` = 계산기
- `services` = 업무 처리 담당자

---

## 2. Models

### 2.1 `memberModel.ts`

이 파일은 "회원 문서 안에 들어 있는 회원권 데이터"를 다루는 모델이다.

핵심 역할은 세 가지다.

1. Firebase 원시 회원권 데이터를 앱 타입으로 변환한다.
2. 회원권들을 과거/현재/미래/환불 상태로 분류한다.
3. 화면에서 보여줄 `membershipInfo`를 계산한다.

#### `convertMembershipFromFirebase`

이 함수는 Firestore에서 읽은 회원권 1건을 앱 내부의 `UserMembership` 형식으로 바꾼다.

주요 동작:

- `purchase.at`, `period.startDate`, `period.endDate`, `refund.at` 같은 날짜 필드를 `Date`로 바꾼다.
- `holds`, `adjustments` 내부의 날짜도 전부 `Date`로 바꾼다.
- `period` 또는 `purchase`가 없으면 유효한 신형 회원권이 아니라고 보고 `null`을 반환한다.

즉, 이 함수의 목적은 "Firestore Timestamp 섞인 데이터"를
"앱이 바로 계산 가능한 순수 JS 객체"로 만드는 것이다.

#### `convertMembershipsFromFirebase`

회원권 배열 버전이다.

주요 동작:

- 각 회원권에 `convertMembershipFromFirebase`를 적용한다.
- 변환 실패한 항목(`null`)은 버린다.

이 때문에 레거시 구조처럼 `period`가 없는 오래된 회원권은
React 앱 기준에서는 자연스럽게 제외된다.

#### `isCurrentlyOnHold`

회원권이 오늘 기준으로 홀딩 중인지 확인한다.

주요 동작:

- `holds` 배열이 비어 있으면 `false`
- 각 홀딩의 시작일과 종료일을 하루 단위로 비교
- 오늘이 그 범위 안에 있으면 `true`

이 함수는 "현재 활성 회원권인데 홀딩 상태인지"를 계산할 때 쓴다.

#### `categorizeMemberships`

회원권 배열을 네 그룹으로 나눈다.

- `pastMemberships`
- `currentMemberships`
- `futureMemberships`
- `refundedMemberships`

분류 기준:

- `refund.isRefunded === true`면 무조건 `refundedMemberships`
- `deleted` 이거나 환불된 회원권은 현재/과거/미래 분류에서 제외
- 종료일이 오늘보다 이전이면 과거
- 시작일이 오늘보다 이후면 미래
- 그 외는 현재

이 함수 덕분에 회원 목록 화면은
"현재 유효 회원권", "곧 시작될 회원권", "이미 끝난 회원권"을 분리해서 다룰 수 있다.

#### `buildMembershipInfo`

회원 한 명의 대표 회원권 상태를 화면용으로 만든다.

반환 정보:

- 타입: `기간권`, `횟수권`, `홀딩`, `사용 예정`, `만료`, `미등록` 등
- 만료일 문자열
- 남은 일수
- 남은 횟수

주요 판단 흐름:

- 회원권이 아예 하나도 없으면 `미등록`
- 현재 회원권은 없고 미래 회원권만 있으면 `사용 예정`
- 현재 회원권은 없지만 과거/환불 이력은 있으면 `만료`
- 현재 회원권이 있으면 그 회원권이 대표값
- 현재 회원권이 홀딩 중이면 타입을 `홀딩`으로 표시
- 기간권은 남은 횟수를 `∞`
- 횟수권은 `quota.remaining`을 그대로 사용

이 함수는 회원 목록 카드나 상세 정보에서 보이는
"등록 타입 / 남은 일수 / 남은 횟수"를 거의 전부 결정한다.

---

### 2.2 `membershipModel.ts`

이 파일은 회원권의 활성 여부와 화면 뱃지 계산을 담당하는 순수 모델이다.

#### `isHold`

가장 마지막 홀딩이 오늘 기준으로 진행 중인지 본다.

특징:

- `holds`의 마지막 항목만 본다.
- 즉, 최신 홀딩 상태를 기준으로 UI를 판단한다.

#### `isFutureHold`

가장 마지막 홀딩의 시작일이 오늘보다 뒤면 `true`를 반환한다.

즉 "이미 등록된 홀딩이지만 아직 시작되지는 않은 상태"를 의미한다.

#### `isValidActiveMembership`

현재 날짜 기준으로 이 회원권이 유효한 활성 회원권인지 확인한다.

조건:

- `period`가 있어야 한다.
- 삭제되지 않아야 한다.
- 환불되지 않아야 한다.
- 시작일과 종료일이 유효한 날짜여야 한다.
- 오늘이 시작일 이상 종료일 이하 범위여야 한다.

이 함수가 실제로 "예약 가능 여부", "현재 회원권 목록", "전체 연장 대상" 같은 판단의 기준이다.

#### `getCurrentMemberships`

회원권 배열에서 `isValidActiveMembership`가 `true`인 것만 모은다.

#### `getWarningMemberThreshold`

주의 회원 기준 일수를 반환한다.

- 현재 하드코딩 값은 `14일`

#### `isWarningMember`

회원의 `membershipInfo.remainingDays`를 보고
0보다 크고 14일 이하이면 `주의 회원`으로 판정한다.

#### `filterWarningMembers`

회원 배열에서 주의 회원만 걸러낸다.

#### `isNewMember`

가입일(`joinedAt`) 기준으로 최근 30일 이내 가입 회원이면 `true`

#### `getMemberStatusBadge`

회원 상태를 대표 뱃지 하나로 계산한다.

우선순위:

1. 신규 회원이면 `신규`
2. 회원권 타입이 `없음` 또는 `만료`면 `비활성`
3. 주의 회원이면 `주의`
4. 나머지는 `활성`

즉, 신규 여부가 가장 먼저 우선 적용된다.

#### `getMembershipStatusBadges`

회원권 타입 기반의 뱃지 색상 정보를 계산한다.

- `기간권`, `횟수권` → `primary`
- `없음` → `none`
- `홀딩` → `hold`

현재는 하나의 뱃지만 반환하지만, 반환 타입은 배열이어서 향후 확장 여지가 있다.

---

### 2.3 `classModel.ts`

이 파일은 수업 문서 키와 날짜 문자열을 다루는 작은 유틸 모델이다.

#### `generateDocKey`

날짜와 시작/종료 시각으로 클래스 문서 키를 만든다.

형식:

- `YYYYMMDD + 시작시 + 종료시`
- 예: `2026041010001130`

이 키가 클래스 문서의 식별자 역할을 한다.

#### `extractDateTimeFromDocKey`

문서 키를 다시

- 연/월/일
- 시작 시/분
- 종료 시/분

으로 쪼갠다.

수업 화면은 이 값을 이용해 이벤트의 `start`, `end` 문자열을 만든다.

#### `extractDateAndTime`

ISO 날짜 문자열에서

- `YYYY-MM-DD`
- `HH:MM`

형태로 분리한다.

#### `formatDateTime`

ISO 날짜 문자열을 `YYYY.MM.DD HH:MM` 포맷으로 바꾼다.

---

### 2.4 `lockerModel.ts`

이 파일은 락커 문서를 정규화하고,
"현재 활성 사용자가 배정된 락커인지"를 판단하는 모델이다.

#### `toLocker`

원시 Firebase 데이터를 `Locker` 타입으로 바꾼다.

특징:

- 상태값이 이상하면 `UNUSED`로 보정
- 문자열 필드는 기본값 `''`
- 가격/결제수단은 있으면 유지

즉, 부분 필드가 비어 있는 문서도 앱에서 안전하게 다룰 수 있게 한다.

#### `getLatestLocker`

락커 문서의 특정 번호 엔트리에서 "최신 상태 1건"을 뽑는다.

락커 데이터는 두 형태가 가능하다.

- 단일 객체
- 히스토리 배열

배열이면 마지막 항목을 최신으로 간주한다.

#### `hasActiveAssignedUser`

최신 락커 상태 기준으로 현재 활성 배정 사용자가 있는지 본다.

판단 기준:

- `realName`이 비어 있지 않아야 함
- `getLockerState(...)` 결과가 `USED`여야 함

즉, 단순히 이름만 있다고 active로 보지 않고,
만료 여부까지 포함한 상태 계산 결과를 본다.

---

## 3. Services

### 3.1 `authService.ts`

인증과 로컬 사용자 세션 관리를 담당한다.

#### 전체 역할

- 로그인
- 로그아웃
- 사용자 정보 조회
- 로컬 스토리지에 인증/사용자 정보 저장
- 토큰 만료 검사

#### `login`

로그인 흐름은 다음과 같다.

1. `AuthRepository.signIn`으로 Firebase 로그인
2. ID 토큰과 만료 시각을 가져옴
3. 이메일 기준으로 실제 사용자 정보를 다시 조회
4. 토큰, 만료시각, 사용자 기본정보를 localStorage에 저장
5. 완성된 `User` 객체 반환

즉, "인증 성공"과 "앱에서 필요한 사용자 프로필 확보"를 같이 처리한다.

#### `logout`

- Firebase 세션 종료
- localStorage의 인증 관련 키 전부 삭제

#### `getUserInfo`

이메일로 사용자 정보를 조회한다.

특징:

- 정확히 1건일 때만 성공
- 0건이거나 여러 건이면 실패로 본다.

#### `saveUserToLocalStorage`, `getUserFromLocalStorage`

앱이 자주 참조하는

- `boxName`
- `realName`
- `nickName`
- `email`
- `phone`
- `role`

를 로컬에 저장/복원한다.

#### `checkTokenExpiration`

- `tokenExpiration`이 없으면 만료로 처리
- 현재 시간보다 지나면 만료
- 만료된 경우 저장된 인증 정보도 함께 제거

#### `isAuthenticated`

- `userToken`이 있고
- 토큰이 아직 만료되지 않았으면

인증 상태로 본다.

---

### 3.2 `boxService.ts`

박스 설정 정보 조회/저장만 담당하는 얇은 서비스다.

#### `getBoxInfo`

- 박스 이름으로 설정 문서를 읽는다.
- 실패하면 사용자용 에러 메시지로 감싼다.

#### `updateBoxInfo`

- `BoxInfo` 전체를 저장한다.

이 서비스는 특별한 비즈니스 규칙보다는
"repository 오류를 사용자 친화적인 메시지로 바꾸는 역할"에 가깝다.

---

### 3.3 `classService.ts`

수업 문서를 조회/생성/수정/삭제하고,
이를 화면용 FullCalendar 이벤트로 변환하는 서비스다.

#### 공개 유틸

이 서비스는 모델 유틸 일부를 그대로 노출한다.

- `generateDocKey`
- `extractDateTimeFromDocKey`
- `formatDateTime`

즉, 수업 화면은 model을 직접 모르고 service를 통해서도 같은 유틸을 쓸 수 있다.

#### `getTodayClasses`

- 오늘 00:00 ~ 23:59:59 범위를 만든다.
- 해당 범위의 클래스를 조회한다.
- 시작 시각 기준으로 정렬해서 반환한다.

#### `getMonthlyClasses`

- 전달받은 시작일/종료일을 하루 단위 경계로 보정한다.
- 범위 내 클래스 문서를 읽는다.
- 이벤트 리스트로 변환해 반환한다.

이 함수는 월간 캘린더용이라 정렬은 repository 조회 순서를 그대로 따른다.

#### `getClass`

레거시 경로 형식으로 특정 클래스 문서를 직접 읽는다.

#### `setClass`

새 클래스 생성 흐름:

1. `docKey`에서 시작 시각을 복원
2. 저장용 `Timestamp` 생성
3. `cap`, `coach`, `date`, `reserved: []` 형태로 새 문서 저장

즉, 예약자 목록은 수업 생성 시 빈 배열로 시작한다.

#### `updateClass`

기존 클래스 수정 흐름:

1. `docKey` 기준으로 시간 다시 계산
2. `cap`, `coach`, `date`, `reserved`를 덮어씀
3. `reserved`가 없으면 빈 배열로 보정

#### `deleteClass`

문서 키 기준으로 수업 문서를 삭제한다.

#### 내부 로직: `getClassesInRange`

이 함수가 실제 조회 핵심이다.

1. repository에서 문서 목록 조회
2. 각 문서를 `toClassEvent`로 변환
3. 변환 실패한 문서는 제외
4. 필요하면 시작 시각 기준 정렬

#### 내부 로직: `toClassEvent`

문서 키에서 날짜/시각을 복원해
FullCalendar용 이벤트로 만든다.

반환값 예시 구조:

- `title: "${box} WOD"`
- `start`, `end`: `+09:00`이 포함된 ISO 문자열
- `extendedProps`: coach, cap, reserved

즉, 화면은 별도 계산 없이 이 이벤트를 그대로 렌더링하면 된다.

---

### 3.4 `dashboardMemoService.ts`

대시보드 코치 메모를 불러오고 저장하는 전용 서비스다.

문서 위치:

- `box/{boxName}/dashboardCoachMemos/coachMemoDoc`

#### `getCoachMemo`

- 박스 이름이 없으면 빈 문자열 반환
- 문서가 없으면 빈 문자열 반환
- 있으면 `coachMemo` 값만 반환

즉, 메모가 없는 상황을 오류가 아니라 "빈 메모"로 취급한다.

#### `saveCoachMemo`

- 박스 이름이 없으면 에러
- `coachMemo`와 `updatedAt: serverTimestamp()`를 `merge` 저장

메모는 덮어쓰기보다 "문서 일부 갱신" 방식이다.

---

### 3.5 `lockerService.ts`

락커 도메인의 핵심 서비스다.

이 서비스는 단순 조회보다 "상태 전이"를 많이 담당한다.
즉, 락커는 하나의 값이 아니라 시간이 지남에 따라 이력이 쌓이는 구조로 관리된다.

#### 락커 데이터 관점

락커 번호 하나는 다음 둘 중 하나로 저장될 수 있다.

- 단일 객체
- 상태 변경 이력을 담은 배열

서비스는 이 두 형식을 모두 처리한다.

#### 공개 헬퍼

- `toLocker`
- `hasActiveAssignedUser`

둘 다 model 함수를 그대로 노출한다.

#### 내부 공통 유틸: `createLockerEntry`

상태 변경용 표준 엔트리를 만든다.

기본값:

- 상태: `UNUSED`
- 문자열 필드: `''`
- `createdAt`: 오늘 날짜 문자열

즉, 락커 상태를 바꿀 때 항상 같은 형태의 엔트리를 만들도록 강제한다.

#### 내부 공통 유틸: `getLockerEntry`

락커 문서에서 특정 번호를 찾는다.

특징:

- 번호가 없으면 바로 에러
- 이후 로직은 이 함수가 반환한 엔트리를 기준으로 동작

#### `getLockers`

전체 락커 문서에서 각 번호별 최신 상태만 뽑아 번호순 정렬해서 반환한다.

화면의 "현재 락커 목록"은 이 결과를 사용한다.

#### `addLockers`

지정한 번호 범위를 한 번에 추가한다.

판단 규칙:

- 번호가 아예 없으면 새 기본 엔트리 추가
- 마지막 상태가 `DELETED`면 다시 활성화
- 이미 살아 있는 락커면 건너뜀

반환값:

- 추가된 번호 목록
- 건너뛴 번호 목록

#### `deleteLocker`

락커를 완전히 지우기보다는 "삭제 상태"로 바꾼다.

핵심 규칙:

- 과거 배정 이력이 있으면 삭제 엔트리를 새로 추가
- 비어 있는 락커면 최신 엔트리의 상태만 `DELETED`로 변경

즉, 히스토리를 보존하는 삭제다.

#### `releaseLocker`

사용 중인 락커를 해지하고 `UNUSED` 상태 엔트리를 추가한다.

특징:

- 해지 사유가 있으면 `[해지]` 접두사를 붙여 저장
- 기존 엔트리를 지우지 않고 새 엔트리를 이어붙임

즉, 해지 자체도 하나의 이력 이벤트다.

#### `updateLocker`

비어 있는 락커의 상태를 `UNUSED` 또는 `NA`로 변경한다.

중요 제약:

- `USED` 같은 상태로 직접 변경하는 용도는 아니다.
- 현재 활성 배정 회원이 있으면 변경 불가

사유 메모 처리 방식:

- 메모가 있으면 새 히스토리 엔트리 추가
- 메모가 없으면 최신 엔트리를 덮어씀

즉, 메모 유무가 "이 변경을 히스토리로 남길지"를 결정한다.

#### `getLockerHistory`

특정 번호의 락커 전체 히스토리를 오래된 순으로 반환한다.

단일 객체도 배열로 감싸서 돌려주므로
화면은 항상 `Locker[]`로만 처리하면 된다.

#### `assignLocker`

회원을 락커에 배정한다.

핵심 규칙:

- 현재 활성 배정 회원이 있으면 실패
- 최신 상태가 "깨끗한 UNUSED"면 마지막 엔트리를 덮어씀
- 그렇지 않으면 새 배정 엔트리를 뒤에 추가

여기서 "깨끗한 UNUSED"란:

- 상태가 `UNUSED`
- 메모가 비어 있음

즉, 쓸데없이 히스토리를 늘리지 않으면서도
의미 있는 상태 변경은 보존하려는 설계다.

#### `extendAllLockers`

현재 사용 중이며 아직 만료되지 않은 락커를 전부 연장한다.

연장 대상 조건:

- 최신 상태가 `USED`
- 종료일이 있음
- 종료일이 오늘 이전이 아님

반환값:

- 연장된 개수
- 후속 회원 히스토리 갱신에 필요한 최소 정보
  - `id`
  - `key`
  - `endDate`

즉, 락커만 연장하는 게 아니라
필요하면 회원 문서의 락커 히스토리 종료일도 이어서 갱신할 수 있게 설계돼 있다.

---

### 3.6 `memberService.ts`

회원 조회/검색/생성/수정/승인과
회원 문서 안의 락커 히스토리 관리까지 담당한다.

#### `getMembers`

이 서비스의 가장 중요한 조회 함수다.

동작 흐름:

1. 회원 문서 목록 조회
2. `birth`만 있고 `birthDate`가 없으면 보정
3. 회원권 배열을 `convertMembershipsFromFirebase`로 변환
4. 회원권을 과거/현재/미래/환불로 분류
5. `membershipInfo`를 계산
6. `futureMemberships`를 포함한 화면용 `Member` 반환

즉, 원시 회원 문서를 "회원 관리 화면에서 바로 렌더링 가능한 객체"로 가공해 주는 함수다.

#### 단순 CRUD 계열

- `deleteMember`
- `updateMemberMembership`
- `addMember`

이 함수들은 repository 호출 위주라 비교적 얇다.

#### `searchMembersByName`

- `getMembers` 결과를 먼저 다 가져온다.
- 이름을 소문자 기준 includes 검색한다.
- 검색어가 비어 있으면 전체 목록 반환

즉, 서버 검색이 아니라 클라이언트 필터링이다.

#### 락커 히스토리 관련

이 서비스는 회원 문서 안의 `lockerHistory` 배열도 관리한다.

##### `assignLockerToMember`

- 회원 문서를 읽고 기존 `lockerHistory`를 가져온다.
- 새 배정 기록을 배열에 추가한다.
- `createdAt`, `key`, `price`, `paymentType`까지 저장한다.

##### `updateLockerHistoryEndDate`

- 특정 `key`를 가진 락커 히스토리의 종료일을 수정한다.
- 찾지 못하면 에러 대신 `warn`만 남기고 종료한다.

이 함수는 "전체 연장"처럼 후속 동기화 작업에 쓰기 좋게 설계돼 있다.

##### `unassignLockerFromMember`

- `lockerNumber + key`로 정확한 기록을 찾는다.
- 종료일만 수정한다.
- 못 찾으면 에러

즉, 일반 해지 로직은 더 엄격하게 동작한다.

#### 사용자 조회 계열

- `getUserByEmail`
- `getUserByPhone`
- `getUserByRealName`
- `getUserByNickName`

모두 repository의 필드 검색을 감싼 함수다.

#### `createMember`

회원 문서를 이메일 키로 생성한다.

특징:

- 같은 이메일 문서가 이미 있으면 생성하지 않고 종료
- 에러가 아니라 skip 로그만 남김

즉, 중복 생성 방지용 안전 장치가 있다.

#### `updateUser`

사용자 컬렉션에서 이메일이 같은 문서를 찾아 수정한다.

찾지 못하면 경고 로그를 남기고 `null`

#### 신청 승인/거절 관련

##### `fetchApplicants`

- 신청자 맵 문서를 읽는다.
- 이를 배열 형태의 `MemberApplicant`로 바꾼다.

##### `approveApplicant`

승인 흐름은 다음과 같다.

1. 이메일로 사용자 조회
2. `boxName`이 `?`로 시작하는 신청 상태인지 확인
3. 신청 문서 제거 + 사용자의 박스명 갱신
4. 회원 문서용 데이터 정리
   - `memberships` 제거
   - `birth` → `birthDate` 보정
   - `joinedAt` 추가
5. 실제 회원 문서 생성

즉, 승인 = "신청 상태 사용자"를 "정식 회원 문서"로 옮기는 작업이다.

##### `rejectApplicant`

- 신청 문서 삭제
- 사용자 박스명을 빈 문자열로 되돌림

##### `removeApplication`

- 신청 문서 삭제
- 사용자 박스명을 실제 박스명으로 반영

승인 흐름 안에서도 재사용된다.

#### `updateMemberMemo`

회원 메모만 수정하는 얇은 함수다.

#### 내부 유틸: `getLockerHistory`

회원 문서의 `lockerHistory`를 항상 배열로 안전하게 꺼낸다.

---

### 3.7 `membershipService.ts`

회원권 도메인의 중심 서비스다.

플랜 관리, 회원별 회원권 CRUD, 홀딩, 환불, 수정, 전체 연장,
그리고 매출 연동까지 대부분의 규칙이 여기에 모여 있다.

#### model 함수 재노출

다음 로직은 membership model의 함수를 그대로 노출한다.

- `isHold`
- `isFutureHold`
- `isValidActiveMembership`
- `getCurrentMemberships`
- `getWarningMemberThreshold`
- `isWarningMember`
- `filterWarningMembers`
- `isNewMember`
- `getMemberStatusBadge`
- `getMembershipStatusBadges`

즉, UI는 model을 직접 몰라도 service를 통해 같은 판단 로직을 사용할 수 있다.

#### 내부 기준: `getBoxName`

- localStorage의 `boxName`을 읽음
- 없으면 바로 에러

이 서비스 대부분은 "현재 로그인한 박스 문맥"을 전제로 동작한다.

#### 플랜 관리

##### `getMembershipPlans`, `setMembershipPlans`

회원권 플랜 문서를 읽고 쓴다.

##### `addMembershipPlan`

- 기존 플랜 목록 조회
- 뒤에 새 플랜 추가
- 전체 저장

##### `deleteMembershipPlan`

- 플랜 이름으로 필터링 후 전체 저장

즉, 플랜 문서는 부분 수정이 아니라
"배열 전체를 읽고 다시 저장"하는 방식이다.

#### `getUserMemberships`

- 회원 이메일 기준으로 raw memberships를 읽는다.
- `convertMembershipsFromFirebase`로 변환한다.
- 이메일이 없으면 빈 배열

#### `addUserMembership`

새 회원권 추가 시의 핵심 규칙:

1. 이메일/회원권/회원이름이 모두 있어야 함
2. 기존 회원권을 읽어옴
3. 삭제/환불되지 않은 회원권과 기간이 겹치면 추가 불가
4. 저장 성공 후 매출도 같이 기록 시도

매출 기록 특징:

- 실패해도 회원권 저장은 성공으로 남긴다.
- 즉, 회원권 저장과 매출 저장은 강한 트랜잭션으로 묶여 있지 않다.

#### `addHold`

회원권 홀딩 등록 로직이다.

핵심 동작:

1. 대상 회원권 찾기
2. 홀딩 일수 계산
3. `holds` 배열에 새 홀딩 추가
4. `adjustments`에 홀딩 등록 이력 추가
5. 현재 회원권 종료일을 홀딩 일수만큼 뒤로 민다
6. 뒤에 이어지는 회원권과 기간이 겹치면 후속 회원권도 뒤로 밀어낸다

즉, 홀딩은 단순 메모가 아니라
"실제 이용 종료일과 후속 회원권 스케줄까지 바꾸는 작업"이다.

#### `releaseHold`

홀딩 해제는 두 경우로 나뉜다.

##### 1) 아직 시작하지 않은 미래 홀딩 해제

- 마지막 홀딩을 배열에서 제거
- 늘어났던 종료일을 다시 줄임
- 뒤 회원권도 원래 위치로 당김
- `adjustments`에 `[미래 홀딩 해제]` 이력 추가

##### 2) 현재 진행 중인 홀딩 해제

- 현재 홀딩을 찾아 종료일을 "어제"로 변경
- 실제 홀딩 일수를 다시 계산
- 원래 홀딩 일수와의 차이만큼 회원권 종료일을 당김
- `adjustments`에 `[홀딩 해제]` 이력 추가

즉, 미래 홀딩 해제는 "취소"에 가깝고,
현재 홀딩 해제는 "조기 종료"에 가깝다.

#### `editMembershipPeriod`

회원권의 기간이나 횟수 정보를 수정한다.

핵심 규칙:

- 대상 인덱스가 유효해야 함
- 레거시 회원권은 수정 불가
- 날짜 변경 시 다른 유효 회원권과 겹치면 실패
- 날짜 또는 횟수가 바뀌면 `adjustments`에 before/after 기록 추가
- 횟수권이면 `remaining`, `used`, `total`을 함께 정리

즉, 수정 기능은 단순 덮어쓰기가 아니라
"무엇이 어떻게 바뀌었는지"를 이력으로 남긴다.

#### `refundUserMembership`

현재 정책 기준 환불 처리 함수다.

핵심 규칙:

- 이미 환불된 회원권은 다시 환불 불가
- `purchase` 정보가 있어야 함
- 환불 금액은 0보다 커야 함
- 결제 금액을 초과할 수 없음

성공 시:

1. `refund.isRefunded = true`
2. 환불 일시, 금액, 사유, 담당자 기록
3. 회원권 저장
4. 회원권 key가 있으면 매출에도 환불액 반영

현재 구조상 의미:

- 환불되면 이 회원권은 활성 회원권에서 제외된다.
- 매출은 "환불 거래를 새로 만들기"보다
  "원 결제 매출의 refundAmount를 수정"하는 방식이다.

#### 담당자 입력 정책

- 회원권 등록/수정/홀딩/환불의 `assignee`는 자유 입력 문자열이 아니라
  현재 박스의 코치 목록에서 고르는 드롭다운 값이다.
- 코치 목록은 우선 `localStorage` 캐시를 보고,
  캐시가 없을 때만 `BoxService.getCoaches()`를 통해 박스 문서를 조회한다.
- 코치가 0명이어도 조회 완료 플래그를 남겨 같은 세션에서 반복 조회하지 않는다.

#### `removeUserMembership`

회원권을 배열에서 삭제한다.

동작:

1. 인덱스 검증
2. 배열에서 제거 후 저장
3. 회원권 key가 있으면 관련 매출 데이터도 제거

매출 삭제 실패 시에도 회원권 삭제는 유지된다.

#### `extendAllMemberships`

전체 활성 회원권을 일괄 연장하는 복잡한 함수다.

핵심 흐름:

1. 모든 회원 문서의 memberships 배열 조회
2. 각 회원권 중 오늘 기준 활성 회원권만 대상
3. 종료일을 `days` 만큼 늘림
4. `adjustments`에 `[전체 연장]` 이력 추가
5. 현재 홀딩 중인 회원권이면 홀딩 종료일도 같이 연장
6. 연장 후 다음 회원권과 기간이 겹치면
   후속 회원권의 시작일/종료일도 자동 조정
7. 자동 조정된 후속 회원권에도 adjustment 기록 추가

즉, 전체 연장은 단순히 `endDate + n일`이 아니라
"체인처럼 이어진 미래 회원권 일정까지 재정렬하는 작업"이다.

#### 내부 유틸: `toDate`

`Timestamp | Date | string | seconds 기반 객체`를 모두 `Date`로 정규화한다.

이 함수는 연장/홀딩/충돌 계산처럼 날짜 비교가 많은 로직에서 공통으로 쓰인다.

---

### 3.8 `revenueService.ts`

매출 도메인의 서비스다.

현재 구조는 "연도 문서 아래에 월별 거래 맵을 저장"하는 방식이다.

중요한 점은:

- 일별 집계 문서를 따로 저장하지 않고
- 거래 원본을 읽어서 화면용 집계를 계산한다는 점이다.

#### 내부 기준: `getBoxName`

- localStorage의 `boxName`
- 없으면 기본값 `SWEAT`

membershipService와 다르게, 여기는 boxName이 없을 때 fallback이 있다.

#### `getMonthlyRevenue`

특정 연/월의 거래를 읽어서 화면용 월별 매출 정보를 만든다.

계산 항목:

- 회원권 매출
- 기타 매출
- 현금/카드 매출
- 환불액
- 일자별 거래 목록

중요한 계산 규칙:

- 회원권 매출 여부는 `type === countPass | periodPass`로 판별
- 총 매출은 `cash + card - refund`
- 환불은 별도 거래를 합산하는 게 아니라 각 거래의 `refundAmount` 필드를 본다

즉, 이 함수는 저장된 raw revenue를
"캘린더/차트/상세 모달용 월간 집계"로 바꿔준다.

#### `getRevenueStats`

전체 연도 문서를 돌면서

- 올해 누적 매출
- 이번 달 매출
- 오늘 매출
- 월평균 매출

을 계산한다.

계산 방식:

- 거래별 실제 매출 = `price - refundAmount`
- 현재 연도 문서만 `totalRevenue`에 포함
- 오늘 매출은 거래 생성일 기준

주의점:

- 변수 이름은 `averageDailyRevenue`지만 실제 계산은 `totalRevenue / currentMonth`
- 즉, 엄밀히 보면 "일평균"보다 "월 인덱스 기준 평균"에 가깝다.

#### `updateDailyRevenue`

현재는 자리만 있는 함수다.

- repository 호출은 하지만 실질 구현은 TODO 상태
- 현재 매출 화면 핵심은 이 함수에 의존하지 않는다.

#### `addUserMembership`

회원권 구매 시 매출 기록을 생성한다.

특징:

- 매출 저장 연/월은 `membership.purchase.at` 기준
- 키는 `membership.key`
- `refundAmount`는 기본 `'0'`

즉, 회원권 구매 매출은 "구매일이 속한 월 문서"에 저장된다.

#### `addLockerRevenue`

락커 결제 매출을 생성한다.

특징:

- 저장 시점의 현재 날짜 기준 연/월 문서에 기록
- `plan`은 `'사물함 이용권'`
- `type`은 `'locker'`

#### `refundUserMembership`

회원권 환불액을 기존 매출 건에 반영한다.

동작 방식:

1. 모든 연도 문서 조회
2. `membershipKey`가 있는 월/거래를 찾음
3. 그 거래의 `refundAmount`만 수정

즉, 환불을 "새 음수 거래"로 추가하지 않고
"원래 결제 건을 수정"하는 구조다.

이 구조의 의미:

- 환불 매출은 원 결제일 기준으로 차감된다.
- 환불일 기준 별도 거래 히스토리는 남지 않는다.

#### `removeUserMembership`

회원권 매출 건을 통째로 삭제한다.

동작:

1. 모든 연도 문서 조회
2. 해당 key를 가진 거래 삭제
3. 월 데이터가 비면 그 월도 제거
4. 연도 문서가 비면 빈 객체로 저장

즉, 회원권 자체를 삭제할 때 매출 흔적도 함께 정리한다.

---

## 4. 서비스 간 연결 관계

핵심 연결만 보면 다음과 같다.

- `MemberService`
  - 회원 목록을 만들 때 `memberModel` + `membershipModel` 계산 결과를 사용
- `MembershipService`
  - 회원권 저장/수정/홀딩/환불/연장 담당
  - 매출 반영이 필요할 때 `RevenueService` 호출
- `LockerService`
  - 락커 상태와 히스토리 관리
- `MemberService`
  - 락커 배정 이력을 회원 문서에도 별도로 기록
- `RevenueService`
  - 회원권/락커 결제 결과를 연도별 매출 문서에 기록
- `ClassService`
  - 수업 문서를 FullCalendar 이벤트로 변환

가장 중요한 도메인 연결은 이 두 개다.

- 회원권 추가/환불/삭제 ↔ 매출
- 락커 배정/연장/해지 ↔ 회원 문서의 락커 히스토리

---

## 5. 수정할 때 먼저 봐야 할 파일

### 회원권 상태 표시가 이상할 때

- `src/models/memberModel.ts`
- `src/models/membershipModel.ts`

### 회원권 추가/홀딩/환불/연장이 이상할 때

- `src/services/membershipService.ts`
- 필요 시 `src/services/revenueService.ts`

### 매출 숫자나 거래 내역이 이상할 때

- `src/services/revenueService.ts`

### 락커 배정/해지/상태 변경이 이상할 때

- `src/services/lockerService.ts`
- 회원 히스토리까지 보면 `src/services/memberService.ts`

### 수업 이벤트 시간이 이상할 때

- `src/models/classModel.ts`
- `src/services/classService.ts`

### 로그인/세션 문제가 있을 때

- `src/services/authService.ts`

---

## 6. 이 코드베이스에서 특히 기억해야 할 설계 포인트

1. 회원권은 회원 문서의 `memberships[]` 배열 안에서 관리된다.
   별도 membership 문서 중심 구조가 아니다.

2. 환불은 "새 거래 생성"이 아니라
   기존 매출 건의 `refundAmount`를 수정하는 방식이다.

3. 락커는 현재 상태만 관리하지 않고,
   배열 히스토리를 계속 누적하는 방향으로 설계되어 있다.

4. 회원 목록 화면은 원시 회원 문서를 그대로 쓰지 않고,
   model/service에서 계산한 `membershipInfo`에 크게 의존한다.

5. 전체 연장, 홀딩, 홀딩 해제는
   뒤에 이어지는 미래 회원권의 일정까지 자동 조정할 수 있다.

이 다섯 가지를 이해하면,
대부분의 화면 동작과 데이터 변화가 왜 그렇게 보이는지 쉽게 따라갈 수 있다.
