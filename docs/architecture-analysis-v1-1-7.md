# feature/V1-1-7 아키텍처 변경 분석

## 문서 목적

이 문서는 `feature/V1-1-7` 브랜치가 `develop/v1.1` 대비 어떤 아키텍처 변경을 도입했는지 정리한다.
결론부터 말하면, 이 브랜치는 프론트엔드 전체 구조를 새로 바꾼 것이 아니라 **기존 서비스 중심 구조를 `model / repository / service` 3계층으로 재정리한 리팩터링**이다.

---

## 한 줄 요약

이전 구조:

```text
Page / Hook
  -> Service
    -> Firebase 호출
    -> Timestamp -> Date 변환
    -> 도메인 계산
    -> 화면용 데이터 조합
```

현재 구조:

```text
Page / Hook
  -> Service
    -> Repository (Firestore 접근)
    -> Model (도메인 변환/판단/파싱)
```

즉, 서비스가 하던 일을 더 작은 책임으로 분리했다.

---

## 변경 전 구조의 문제

`develop/v1.1` 기준 서비스 클래스들은 다음 책임을 한 파일 안에서 동시에 처리하고 있었다.

- Firestore CRUD
- Firestore 경로 조립
- `Timestamp` -> `Date` 변환
- 레거시 데이터 보정
- 상태 판별 로직
- 화면에서 바로 쓰는 DTO 조합
- 일부 도메인 규칙 계산

대표적인 예시는 다음과 같다.

- `src/services/memberService.ts`
  - 회원 조회
  - Firestore 문서 순회
  - 회원권 배열 변환
  - 회원권 상태 분류
  - `membershipInfo` 계산
- `src/services/membershipService.ts`
  - 회원권 플랜 조회/저장
  - 회원권 데이터 변환
  - 홀딩/유효 상태 판별
  - 매출 서비스 호출
- `src/services/classService.ts`
  - Firestore 조회
  - `docKey` 파싱
  - `ClassEvent` 생성
- `src/services/lockerService.ts`
  - Firestore transaction
  - 락커 데이터 정규화
  - 현재 사용 상태 판단

이 구조는 기능 추가는 빠르지만, 서비스 파일이 커지고 중복 로직이 늘어나기 쉽다.

---

## 이번 브랜치의 핵심 변경

### 1. `repository` 레이어 도입

새로운 `src/repositories/` 디렉토리가 추가되었다.

- `authRepository.ts`
- `boxRepository.ts`
- `classRepository.ts`
- `lockerRepository.ts`
- `memberRepository.ts`
- `membershipRepository.ts`
- `revenueRepository.ts`

이 레이어의 역할은 다음으로 제한된다.

- Firestore 경로 결정
- 문서 조회/저장/삭제
- transaction 래핑
- 원시 Firebase 데이터 반환

즉, DB 접근을 서비스에서 걷어냈다.

예시:

- `memberService.getMembers()`는 더 이상 직접 `getDocs()`를 호출하지 않는다.
- 대신 `MemberRepository.getMemberDocuments()`를 호출한 뒤, 서비스는 받은 원시 데이터를 해석하는 쪽에 집중한다.

### 2. `model` 레이어 도입

새로운 `src/models/` 디렉토리가 추가되었다.

- `classModel.ts`
- `lockerModel.ts`
- `memberModel.ts`
- `membershipModel.ts`

이 레이어는 DB 접근 없이 순수 계산을 담당한다.

- Firebase 원시 데이터 -> 앱 타입 변환
- 상태 판별
- 날짜/문서 키 파싱
- 화면용 요약값 계산

예시:

- `memberModel.ts`
  - `convertMembershipsFromFirebase`
  - `categorizeMemberships`
  - `buildMembershipInfo`
- `membershipModel.ts`
  - `isHold`
  - `isFutureHold`
  - `isValidActiveMembership`
  - `getMemberStatusBadge`
- `classModel.ts`
  - `generateDocKey`
  - `extractDateTimeFromDocKey`
  - `formatDateTime`
- `lockerModel.ts`
  - `toLocker`
  - `getLatestLocker`
  - `hasActiveAssignedUser`

기존에는 이 계산이 서비스 내부 private/static 메서드나 파일 내부 로직으로 흩어져 있었다.

### 3. 서비스 레이어의 책임 축소

서비스는 완전히 사라지지 않았고, 여전히 애플리케이션 유스케이스를 조합하는 중심 레이어다.
다만 지금은 다음 역할에 더 가깝다.

- 유스케이스 단위 orchestration
- repository 호출
- model 함수 조합
- 다른 service 호출
- 에러 처리와 입력 검증

즉, 서비스는 **비즈니스 흐름 조합자** 역할로 축소되었다.

예시:

- `MembershipService.addUserMembership()`
  - 기존 회원권 조회
  - 날짜 겹침 검증
  - repository 저장
  - `RevenueService` 연동

이 메서드는 여전히 유스케이스를 조합하지만, 저수준 DB 코드는 repository로 빠졌다.

---

## 현재 레이어 구조

```text
UI(Page / Modal)
  -> Hook
    -> Service
      -> Repository
      -> Model
      -> other Service
        -> Repository
```

각 레이어 책임은 아래처럼 정리할 수 있다.

| 레이어 | 책임 |
|---|---|
| Page / Modal | 화면 렌더링, 사용자 이벤트 전달 |
| Hook | 로딩/에러/선택 상태 관리, 서비스 호출 |
| Service | 유스케이스 조합, 검증, 에러 처리, 레이어 연결 |
| Repository | Firestore 접근 전담 |
| Model | 순수 데이터 변환과 도메인 계산 |

---

## 도메인별로 어떻게 바뀌었는지

## 회원(Member)

가장 분리 효과가 큰 영역이다.

이전:

- `MemberService`가 Firestore 조회와 회원권 변환, 상태 분류, `membershipInfo` 계산까지 수행

현재:

- `MemberRepository`
  - 회원 문서 조회/삭제/수정
  - 가입 신청 문서 조회/삭제
  - 사용자 문서 조회/수정
- `memberModel`
  - Firebase 회원권 데이터 변환
  - 과거/현재/미래/환불 회원권 분류
  - `MembershipInfo` 계산
- `MemberService`
  - repository에서 데이터를 읽고 model 함수로 가공
  - 회원/가입신청 관련 유스케이스 조합

즉, 회원 서비스는 더 이상 “DB + 변환 + 계산”을 혼자 들고 있지 않다.

## 회원권(Membership)

회원권도 같은 방향으로 정리되었다.

이전:

- `MembershipService` 안에 플랜 CRUD, 회원권 배열 조회, 상태 판별 함수가 섞여 있었음

현재:

- `MembershipRepository`
  - 플랜 문서 조회/저장
  - 회원 문서의 원시 `memberships` 배열 조회/저장
  - 전체 회원의 회원권 배열 조회
- `membershipModel`
  - 홀딩 여부
  - 활성 회원권 여부
  - 주의 회원 계산
  - 상태 배지 계산
- `MembershipService`
  - 회원권 추가/홀딩/해제/환불/일괄 연장 같은 유스케이스 담당

특징:

- `MembershipService`는 model 함수를 static alias로 노출한다.
- 그래서 페이지 쪽은 기존 사용 방식을 크게 안 바꾸고 내부 구현만 분리할 수 있었다.

## 수업(Class)

수업 도메인은 구조가 가장 명확하게 정리되었다.

이전:

- `ClassService`가 Firestore 범위 조회
- `docKey` 파싱
- `ClassEvent` 생성까지 모두 수행

현재:

- `ClassRepository`
  - 범위 조회, 단건 조회, 생성, 수정, 삭제
- `classModel`
  - `docKey` 생성/파싱/포맷
- `ClassService`
  - repository 결과를 `ClassEvent`로 변환
  - 날짜 범위 유스케이스 조합

추가로 이전에 쓰던 `utils/classCalendarUtils.ts`는 제거되었고, 관련 책임이 `classModel.ts`로 이동했다.

## 락커(Locker)

락커는 transaction-heavy 도메인이라 구조 변화가 특히 중요하다.

이전:

- `LockerService`가 transaction 직접 수행
- 락커 최신 엔트리 선택
- 상태 판단
- 삭제/복구/해지 히스토리 생성까지 모두 처리

현재:

- `LockerRepository`
  - 락커 문서 조회
  - transaction 실행 공통화
- `lockerModel`
  - raw -> `Locker` 정규화
  - 최신 엔트리 계산
  - 활성 배정 여부 판별
- `LockerService`
  - transaction handler 안에서 유스케이스별 payload 조합

즉, transaction 자체는 repository가 관리하고, 서비스는 "무엇을 기록할지"를 결정한다.

## 매출(Revenue)

매출도 Firestore 직접 접근이 repository로 이동했다.

현재:

- `RevenueRepository`
  - 연도 문서 조회/저장
- `RevenueService`
  - 월별 집계
  - 통계 계산
  - 회원권 구매 시 매출 반영

이 도메인은 model 파일이 따로 생기지는 않았지만, 최소한 DB 접근과 집계 로직은 분리되었다.

---

## 이 브랜치가 실제로 달성한 것

- 서비스 파일의 책임이 줄었다.
- Firebase 의존 코드가 `repositories/`로 모였다.
- 순수 계산 로직이 `models/`로 분리되었다.
- 도메인 로직 재사용 지점이 명확해졌다.
- 테스트 대상을 나누기 쉬운 구조가 되었다.
- 레거시 데이터 보정 위치가 명확해졌다.

특히 `memberService`와 `membershipService`에 흩어져 있던 회원권 변환 로직이 `memberModel`로 모인 점은 중복 제거 효과가 크다.

---

## 아직 그대로인 것

이 브랜치를 과대평가하면 안 되는 부분도 있다.

### 1. Hook / Page 경계는 크게 바뀌지 않았다

UI 계층은 여전히 다음 흐름을 유지한다.

- Page가 Hook을 사용
- Hook이 Service를 호출
- 일부 Page는 Service를 직접 호출

예를 들어 `MemberManagement.tsx`는 훅을 사용하면서도 `MemberService`, `MembershipService`를 직접 import해서 일부 기능을 수행한다.
즉, UI 계층까지 완전히 추상화된 구조는 아니다.

### 2. Service는 여전히 큰 편이다

레이어 분리는 되었지만, `membershipService.ts`, `lockerService.ts`, `revenueService.ts`는 여전히 크다.
이유는 유스케이스 자체가 많고, 트랜잭션 흐름이나 연쇄 업데이트가 서비스에 남아 있기 때문이다.

### 3. DI 기반 구조는 아니다

모든 레이어가 static class 중심이다.

- 의존성 주입 컨테이너 없음
- 인터페이스 기반 구현 교체 없음
- 런타임 wiring 없음

따라서 전형적인 Clean Architecture / Hexagonal Architecture보다는,
**실용적인 계층 분리형 프론트엔드 서비스 구조**에 가깝다.

### 4. 타입 위치가 완전히 통일되지는 않았다

- 도메인 공용 타입은 `src/types/`
- Firebase 문서 타입은 `src/repositories/`
- 순수 계산은 `src/models/`

이 방향은 일관성이 생겼지만, 일부 타입은 여전히 `types`와 `repositories` 사이 경계가 애매할 수 있다.

---

## 아키텍처적으로 보는 최종 평가

이 브랜치는 다음과 같이 정의하는 것이 가장 정확하다.

> 기존의 "거대 서비스 클래스" 구조를
> `repository + model + service`로 쪼개어
> 데이터 접근, 도메인 계산, 유스케이스 조합을 분리한 리팩터링

즉:

- 클린 아키텍처 전체 도입: 아님
- 3레이어 분리 리팩터링: 맞음
- Firebase 직접 접근 감소: 맞음
- 도메인 규칙의 순수 함수화: 맞음
- UI 계층까지 완전 분리: 아직 아님

---

## 이후 확장 방향

이 구조를 더 밀어붙이려면 다음 순서가 자연스럽다.

1. Page에서 Service 직접 호출하는 코드를 Hook으로 더 모은다.
2. Service 내부의 큰 유스케이스를 작은 use-case 함수로 분리한다.
3. Repository 반환 타입을 더 엄격하게 정리한다.
4. `models/`의 순수 함수에 대한 단위 테스트를 추가한다.
5. 서비스 간 직접 호출이 많은 부분은 도메인별 orchestration 경계를 다시 나눈다.

현재 상태만으로도 유지보수성은 이전보다 확실히 좋아졌지만, 구조 정리는 아직 진행형이라고 보는 편이 맞다.
