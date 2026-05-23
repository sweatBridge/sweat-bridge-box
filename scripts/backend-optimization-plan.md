# 백엔드(Firestore) 호출 최적화 계획

- 작성일: 2026-04-23
- 대상 브랜치: `develop/v1.1`
- 범위: `src/services/`, `src/repositories/`, `src/hooks/`, `src/pages/`, `src/components/modals/`
- 기준 스키마: [firestore-tree.md](./firestore-tree.md)

이 문서는 프론트엔드에서 Firestore로 나가는 호출을 훑어보고, **중복 호출 / 불필요한 컬렉션 스캔 / N+1 / 트랜잭션 누락 / 로직 버그** 관점에서 고쳐야 할 항목을 우선순위 순으로 정리한다. 각 항목은 원인(Why) → 영향 → 수정안을 포함한다.

---

## 🔴 P0 — 지금 바로 고쳐야 하는 항목

### 1. 수업 4주 반복 생성이 실제로는 16번 쓰이고 있음 (버그)

- 위치: [src/pages/ClassReservation.tsx:280-301](../../src/pages/ClassReservation.tsx#L280-L301), [src/pages/ClassReservation.tsx:244-278](../../src/pages/ClassReservation.tsx#L244-L278)
- 증상
  - `handleSaveModalResult`가 `applyToFourWeeks === true`일 때 `for (let i = 0; i < 4; i++) await saveClass(modalResult)`로 **4번 호출**한다.
  - `saveClass` 내부도 `applyToFourWeeks`를 다시 체크해서 `createRecurringClasses`(= 4개 주간 클래스 생성)를 실행한다.
  - 결과: **총 4 × 4 = 16회의 `setDoc`**이 발생하고, 성공 토스트도 4번 뜬다. 같은 docKey(요일·시간 동일)가 반복 overwrite된다.
- 영향: Firestore write 4배 낭비, 동일 문서 `reserved` 필드 덮어쓰기 가능성(지금은 `reserved: []`로 매번 초기화됨 — **실사용자 예약이 있었다면 날아감**).
- 수정
  - `handleSaveModalResult`에서 `for` 루프를 제거하고 `saveClass(modalResult)` 한 번만 호출한다.
  - `applyToFourWeeks` 분기는 `saveClass` 안에서만 처리한다.
  - `ClassRepository.setClassDocument`가 현재 `setDoc(ref, data)` 전체 덮어쓰기라서 위험. 이미 존재하는 문서를 건너뛰고 싶다면 `getDoc` 선행 체크 또는 트랜잭션(`tx.set` with exists 체크) 도입.

### 2. 락커 해지 시 전체 회원 컬렉션 스캔

- 위치: [src/pages/Locker.tsx:232-259](../../src/pages/Locker.tsx#L232-L259)
- 증상: `onConfirmRelease`에서 `MemberService.getMembers(BOX_NAME)` — **회원 전체**를 불러와 `realName`이 일치하는 첫 번째 회원을 찾는다.
- 원인: 락커 엔트리의 `id` 필드가 이미 회원 `email`을 담고 있음(`LockerService.assignLocker`가 그렇게 저장함). 즉, 별도 회원 조회가 필요 없다.
- 영향: 회원 수에 비례하는 네트워크/읽기 비용. 현재 20명 정도라 티가 안 나지만 규모가 커질수록 선형 증가.
- 수정: `currentLocker.id`(= email)를 그대로 `MemberService.unassignLockerFromMember`에 넘긴다. 전체 조회 제거.

### 3. 매출 관리 페이지 마운트 시 월별 데이터가 2번 fetch된다

- 위치: [src/pages/RevenueManagement.tsx:42-51](../../src/pages/RevenueManagement.tsx#L42-L51)
- 증상
  - 마운트 effect 1: `loadInitialData(year, month)` → 내부에서 `getMonthlyRevenue` + `getRevenueStats`를 병렬로 호출.
  - 마운트 effect 2: `currentMonth`(초깃값 `new Date()`) 변경 감지 → `loadMonthlyRevenue(year, month)`를 **또** 호출.
  - 결과: `getMonthlyRevenue`가 마운트 1회에 2번 돌아간다.
- 수정
  - effect 1을 제거하고, effect 2에서 `currentMonth`가 바뀔 때마다 월별을 로드하도록 단일화한다.
  - 통계(`getRevenueStats`)는 별도 1회만 로드하는 effect로 분리(혹은 첫 effect에서만 로드).

### 4. 매출 데이터 read-modify-write에 트랜잭션이 없다 (동시성 위험)

- 위치
  - [src/services/revenueService.ts:190-218](../../src/services/revenueService.ts#L190-L218) — `addUserMembership`
  - [src/services/revenueService.ts:230-265](../../src/services/revenueService.ts#L230-L265) — `addLockerRevenue`
  - [src/services/revenueService.ts:273-298](../../src/services/revenueService.ts#L273-L298) — `refundUserMembership`
  - [src/services/revenueService.ts:305-337](../../src/services/revenueService.ts#L305-L337) — `removeUserMembership`
- 증상
  - `getRevenueYear` → 객체 조작 → `setRevenueYear(setDoc, merge 없음)` 패턴.
  - `setRevenueYear`는 `setDoc(ref, data)`로 **전체 덮어쓰기**. 두 명이 동시에 결제를 등록하면 **한쪽 데이터가 날아간다**.
- 수정 (✅ 완료)
  - **RevenueRepository에 타겟 메서드 3개 신설** ([src/repositories/revenueRepository.ts](../../src/repositories/revenueRepository.ts))
    - `setRevenueEntry(box, year, month, key, entry)` — `setDoc(yearRef, { [month]: { [key]: entry } }, { merge: true })`. 단일 엔트리만 추가/갱신, 다른 월·엔트리 보존.
    - `updateRevenueEntryField(box, year, month, key, field, value)` — `updateDoc(yearRef, { 'month.key.field': value })`. 엔트리 안의 단일 필드만 변경.
    - `deleteRevenueEntry(box, year, month, key)` — `updateDoc(yearRef, { 'month.key': deleteField() })`.
  - **`setRevenueYear`는 `merge: true`로 전환** — 호환성 유지용 안전망(이제 직접 호출하지 않음).
  - **RevenueService 4개 메서드 단순화** ([src/services/revenueService.ts](../../src/services/revenueService.ts))
    - `addUserMembership` / `addLockerRevenue`: `getRevenueYear → 객체 조작 → setRevenueYear` 패턴을 `setRevenueEntry` 한 줄로 교체. **read 1회 제거**.
    - `refundUserMembership(key, amount, purchaseAt?)`: 시그니처에 `purchaseAt?` 추가. 있으면 `updateRevenueEntryField` 1회로 정확한 연/월 문서만 touch. 없으면 기존 전체 스캔 폴백 유지.
    - `removeUserMembership(key, purchaseAt?)`: 동일 패턴. 빠른 경로는 `deleteRevenueEntry` 1회.
  - **MembershipService에서 `purchaseAt` 전달** ([src/services/membershipService.ts](../../src/services/membershipService.ts))
    - 환불·삭제 시 `membership.purchase.at`을 `this.toDate(...)`로 정규화 후 RevenueService에 인자로 전달 → fast-path 자동 적용.
  - **테스트 동기화** ([src/tests/integration/architecture-refactor.services.test.ts](../../src/tests/integration/architecture-refactor.services.test.ts))
    - 추가 케이스를 `setRevenueEntry` 어설션으로 변경.
    - 환불/삭제 테스트를 "`purchaseAt` 있을 때 1-doc만 touch" + "없을 때 폴백 동작" 4 케이스로 분리.
    - MembershipService 환불/삭제 spy 어설션에 `expect.any(Date)` 추가.
  - 결과: 매출 추가 시 read 0회 / write 1회, 동시 결제 충돌 제거, 환불·삭제는 `purchase.at` 있는 경우 전체 연도 스캔 없이 정밀 타겟.

### 5. 락커 배정이 3개 문서에 걸쳐 비-원자적으로 수행됨

- 위치: [src/pages/Locker.tsx:363-427](../../src/pages/Locker.tsx#L363-L427)
- 증상: `assignLocker` → `assignLockerToMember` → `addLockerRevenue` 3단계 순차. 중간 단계가 실패하면 락커만 배정된 상태로 남고 매출/회원 히스토리가 누락된다.
- 수정
  - 3개 문서(`lockerdoc`, `member/{email}`, `revenue/{year}`)에 걸친 `runTransaction` 도입.
  - 또는 writes만 있는 후반부를 `writeBatch`로 묶기(락커 쪽은 이미 트랜잭션이므로 전체 트랜잭션 통합이 더 깔끔).

---

## 🟠 P1 — 비용/응답 시간에 눈에 띄게 영향을 주는 항목

### 6. `MembershipPlanModal` — 플랜 추가/삭제 시 plansDoc을 3번 읽는다

- 위치: [src/components/modals/membership/MembershipPlanModal.tsx:89-151](../../src/components/modals/membership/MembershipPlanModal.tsx#L89-L151), [src/services/membershipService.ts:116-129](../../src/services/membershipService.ts#L116-L129)
- 증상 (플랜 추가 클릭 1회 기준)
  1. `addMembershipPlan` 내부에서 `getMembershipPlans` (read 1)
  2. 같은 함수에서 `setMembershipPlans` (write 1)
  3. 모달이 `loadMembershipPlans` 재호출 (read 2)
  → **read 2회 + write 1회**. 삭제도 동일.
- 수정
  - `addMembershipPlan`이 새 `plans` 배열을 반환하게 하고, 모달은 그 결과로 로컬 상태를 갱신한다. 추가 read 제거.
  - 또는 `arrayUnion` / `arrayRemove` 사용 → read 없이 write 1회로 끝남.

### 7. `ExtendAllModal` — 락커 연장 후 회원 히스토리 업데이트가 순차 루프

- 위치: [src/components/modals/membership/ExtendAllModal.tsx:116-131](../../src/components/modals/membership/ExtendAllModal.tsx#L116-L131)
- 증상: `extendAllLockers`에서 돌려준 `extendedLockers` 개수만큼 `MemberService.updateLockerHistoryEndDate`를 `for await` 루프로 호출. 각 호출은 회원 문서를 읽고(read) 쓰는(write) 작업 → 30개 락커면 **60회 순차 왕복**.
- 수정
  - `Promise.all`로 병렬화(최소 개선).
  - 더 나은 방법: `extendAllMemberships`와 마찬가지로 **단일 루프 안에서 문서별로 writeBatch**에 담고, 500건마다 commit. 락커와 회원권 extend를 하나의 flow로 묶기.

### 8. `MembershipService.extendAllMemberships` — 회원당 순차 write

- 위치: [src/services/membershipService.ts:528-659](../../src/services/membershipService.ts#L528-L659)
- 증상: `for (const document of documents) { ... await MembershipRepository.setUserMemberships(...) }` — 20명이면 20회 순차 write.
- 수정
  - `Promise.all(documents.map(...))`로 병렬화(동시성 제한이 필요하면 p-limit 등으로 5~10 정도로 throttle).
  - 또는 `writeBatch` 사용(Firestore 배치 최대 500 operation).

### 9. 매출 통계가 매번 전체 연도 문서를 스캔

- 위치: [src/services/revenueService.ts:124-165](../../src/services/revenueService.ts#L124-L165)
- 증상: `getRevenueStats`는 `/box/{box}/revenue/*` 컬렉션을 **전부** 읽는 뒤 클라이언트에서 현재 연/월/일만 합산한다.
- 영향: 해마다 문서 1개씩 늘어남. 지금은 2026, 2025 → 2개라 괜찮지만 앞으로 6~7년 운영 시 **모든 페이지 방문마다** 수년치 데이터를 다운받게 된다.
- 수정
  - 현재 연도 문서 1개만 `getDoc`으로 읽고 그 안에서 월/일을 계산. 필요 시 `totalRevenue`를 현재 연도 기준으로만 산출(현재 로직도 `currentYear` 필터를 넣고 있음).
  - 장기적으로는 `revenue/summary` 같은 별도 집계 문서를 두고 쓰기 시점에 카운터 업데이트하는 방식 고려.

### 10. 매출 환불/삭제에서도 전체 연도 문서 스캔

- 위치: [src/services/revenueService.ts:273-337](../../src/services/revenueService.ts#L273-L337)
- 증상: `refundUserMembership`, `removeUserMembership`이 membershipKey가 들어있는 연도를 찾기 위해 `getAllRevenueYears`로 모든 연 문서를 순회한다.
- 원인: membership 객체에 이미 `purchase.at`(구매일)이 있어 정확한 `year/month`를 알 수 있는데도 활용하지 않음.
- 수정
  - `refundUserMembership(key, amount, purchaseAt)` 처럼 시그니처에 `purchaseAt` 추가 → 정확히 1개 연도/월 문서만 touch.
  - 내부적으로 `updateDoc(yearRef, { [`${month}.${key}.refundAmount`]: amount.toString() })` 한 줄로 끝.

### 11. 회원/유저 조회가 collection `where` 쿼리를 돌고 있음 (문서 ID == email)

- 위치
  - [src/repositories/authRepository.ts:32-39](../../src/repositories/authRepository.ts#L32-L39) — `getUsersByEmail`
  - [src/repositories/memberRepository.ts:107-130](../../src/repositories/memberRepository.ts#L107-L130) — `getUsersByField('email', ...)`, `updateUsersByEmail`
- 증상: `user` 컬렉션은 [firestore-tree.md](./firestore-tree.md)에 따르면 문서 ID가 이메일이다. 그런데 email로 찾을 때도 `where('email', '==', ...)` 쿼리를 돌린다.
- 영향: 인덱스 비용 + 불필요한 서버 쿼리 경로. 읽기 수는 같지만 쿼리 레이턴시는 `getDoc`이 짧다.
- 수정: email로 찾는 경우 `getDoc(doc(db, 'user', email))`로 단순화. `updateUsersByEmail` → `updateDoc(doc(db, 'user', email), data)`로 변경해서 read 1회 제거.
- 주의: `getUsersByField('phone', ...)`, `getUsersByField('realName', ...)`, `getUsersByField('nickName', ...)`처럼 이메일이 아닌 필드는 기존대로 유지.

### 12. `MemberManagement` 페이지에서 회원 목록과 신청자 수를 따로 fetch

- 위치: [src/pages/MemberManagement.tsx:67-86](../../src/pages/MemberManagement.tsx#L67-L86)
- 증상: 2개의 useEffect가 병렬이 아닌 독립 실행 — `loadMembers()` + `loadPendingApplicantsCount()`. 각각이 완료 후 setState 2번.
- 수정: 단일 effect에서 `Promise.all([loadMembers(), loadPendingApplicantsCount()])`로 묶기. 네트워크는 이미 병렬이지만 리렌더 횟수가 줄고 `ApplyRequestModal` 닫을 때 2번 `await` 하지 않아도 된다.

### 13. `ApplyRequestModal` — 승인/거절 후 전체 목록 재조회

- 위치: [src/components/modals/member/ApplyRequestModal.tsx:48-92](../../src/components/modals/member/ApplyRequestModal.tsx#L48-L92)
- 증상: 승인/거절마다 `loadApplicants()`로 `applied/applieddoc`을 다시 읽음. 삭제된 항목은 로컬 state에서 제거해도 된다.
- 수정: `setApplicants(prev => prev.filter(a => a.email !== applicant.email))`로 낙관적 업데이트. 실패 시 재조회.

### 14. `approveApplicant` 플로우가 read/write 5번 (순차)

- 위치: [src/services/memberService.ts:316-342](../../src/services/memberService.ts#L316-L342)
- 증상: `getUserByEmail`(read) → `removeApplication`(= `deleteApplication` write + `updateUserBoxName` write) → `createMember` 안에서 `getMemberDocument` exists 체크(read) → `setMember`(write). **read 2, write 3, 전부 순차**.
- 수정
  - 중복 체크가 꼭 필요한 경우만 유지. 사용자가 방금 승인 버튼을 누른 시나리오에서 "이미 존재"는 희박.
  - `writeBatch`로 `deleteApplication` + `updateUserBoxName` + `setMember`를 한 커밋에 묶기(원자성도 덤).

### 15. `addUserMembership` 직후 `RevenueService.addUserMembership`도 따로 write

- 위치: [src/services/membershipService.ts:155-190](../../src/services/membershipService.ts#L155-L190)
- 증상: 회원권 write + 매출 doc read-modify-write가 **서로 다른 트랜잭션**. 매출 쪽이 실패해도 회원권은 이미 저장됨 → 데이터 불일치 가능.
- 수정: 위 P0-4번과 함께, 매출 쪽을 `updateDoc(yearRef, { [`${month}.${key}`]: payload })` 한 줄로 바꾸면 read가 사라지고 `writeBatch`에 합칠 수 있다.

---

## 🟡 P2 — 개선하면 좋지만 당장 치명적이진 않음

### 16. 대시보드의 회원 / 클래스 / 메모 로드가 3개 useEffect로 분산

- 위치: [src/pages/Dashboard.tsx:37-70](../../src/pages/Dashboard.tsx#L37-L70)
- 수정: `loadData` 안에서 `DashboardMemoService.getCoachMemo`도 `Promise.all`에 끼워넣기. 네트워크는 이미 병렬이라 체감 이득은 작지만 렌더 flicker 감소.

### 17. `MembershipService.getUserMemberships`는 이미 로드된 member 문서를 한 번 더 읽음

- 위치: [src/services/membershipService.ts:137-146](../../src/services/membershipService.ts#L137-L146), [src/components/modals/member/MemberManagementModal.tsx:65-88](../../src/components/modals/member/MemberManagementModal.tsx#L65-L88)
- 증상: `MemberManagement` 페이지에서 이미 모든 회원의 `memberships` 배열을 가져온 상태인데, 모달을 열면 `getUserMemberships`가 같은 회원 문서를 다시 `getDoc`한다.
- 영향: 회원당 모달 1회 오픈 = read 1회 추가.
- 수정
  - `MemberManagementModal`에 이미 `member.memberships`를 prop으로 넘기거나(이미 넘어감), 첫 렌더에 해당 데이터를 `convertMembershipsFromFirebase`로 변환해 사용.
  - 또는 "모달 열 때만 최신 데이터가 필요" 라는 요구가 있다면 그 이유를 주석으로 명시(지금은 없음).

### 18. 전역 캐시 레이어(React Query/SWR) 부재

- 증상: `boxInfo`, `membershipPlans`, 오늘의 수업 같은 비교적 정적인 데이터가 페이지 이동마다 매번 재요청된다.
- 수정: `@tanstack/react-query` 도입 권장(5~10분 staleTime으로도 효과 큼). 최소 다음 쿼리 키는 cache 대상:
  - `['box', boxName]` (박스 정보)
  - `['membershipPlans', boxName]` (플랜 목록)
  - `['members', boxName]` (회원 목록 — invalidation 규칙 잘 정해야 함)
  - `['revenue', boxName, year, month]`
- 부수 효과: `useMemberManagement`, `useRevenueManagement` 등의 커스텀 훅이 훨씬 단순해진다.

### 19. `MemberService.searchMembersByName`이 매번 전체 회원 fetch

- 위치: [src/services/memberService.ts:88-94](../../src/services/memberService.ts#L88-L94)
- 증상: 락커 배정 모달에서 이름 검색 버튼 클릭 → `getMembers` 전체 호출 → 클라이언트 필터.
- 수정
  - React Query로 회원 목록이 이미 캐시되어 있다면 `getMembers` 재호출 대신 캐시에서 `filter`.
  - 캐시가 없다면 Firestore 쿼리 `orderBy('realName').startAt(term).endAt(term + '')`로 서버 측 필터링.

### 20. `AssignLockerModal`/`AddReserveMemberModal`에서 유저 검색 API가 서로 다르게 사용됨

- 위치
  - [src/components/modals/locker/AssignLockerModal.tsx:42-54](../../src/components/modals/locker/AssignLockerModal.tsx#L42-L54) → `searchMembersByName`
  - [src/components/modals/class/AddReserveMemberModal.tsx:52-74](../../src/components/modals/class/AddReserveMemberModal.tsx#L52-L74) → `getUserByRealName` (user collection)
- 의미상: 수업 예약은 박스 회원이 아니어도 검색 가능해야 함. 락커 배정은 박스 회원만. 그건 의도적임.
- 수정: 의도는 맞지만, `AddReserveMemberModal`에서 `getUserByRealName`은 `user` 컬렉션 전체에서 동명이인을 다 끌어온다(`realName` 필터 쿼리). 결과 수가 많을 수 있으므로 `boxName` 필터를 where 체인에 추가하거나 `limit()` 검토.

### 21. `getMembers`가 반환하는 payload가 무겁다

- 위치: [src/services/memberService.ts:17-48](../../src/services/memberService.ts#L17-L48)
- 증상: 회원 문서 전체 필드(연락처, memberships 배열, lockerHistory 등)를 그대로 들고 옴. 대시보드에서는 카운트/뱃지 계산에만 쓰는데도 전체 페이로드를 받는다.
- 현재 규모(회원 20명)에서는 무시할 수준이지만 회원 수가 100명+로 늘어나면 문제.
- 수정(장기)
  - "목록용 경량 문서"(예: `/box/{box}/memberIndex/{email}` — realName, 상태 플래그만)를 write-time에 동기화.
  - 또는 Firestore의 projection은 불가능하므로, Dashboard용으로는 집계 카운터 문서(`/box/{box}/stats/members`) 하나만 읽는 방식.
  - React Query 도입 후 `getMembers`는 1회만 가져오고 Dashboard ↔ MemberManagement가 공유하면 체감 이득이 가장 큼.

### 22. `localStorage.getItem('boxName')`이 서비스 로직 곳곳에 박혀 있음

- 위치 예시: [src/services/membershipService.ts:77-81](../../src/services/membershipService.ts#L77-L81), [src/services/revenueService.ts:13-15](../../src/services/revenueService.ts#L13-L15), [src/pages/Locker.tsx:33](../../src/pages/Locker.tsx#L33)
- 증상: 런타임마다 `localStorage` 접근. 기능적으로는 OK지만 서비스가 사이드이펙트에 결합되어 테스트/멀티박스 전환이 어렵다.
- 수정: `boxName`을 인자로 받도록 서비스를 변경하거나, `BoxContext`에서 단일 소스로 관리.

---

## 실행 순서 제안

1. **이번 스프린트**
   - P0-1 (수업 4주 버그) — 실제 데이터 손실 리스크
   - P0-2 (락커 해지 전체 스캔 제거) — 한 줄 수정
   - P0-3 (매출 페이지 중복 fetch)
   - P0-4 (매출 트랜잭션 + merge) + P1-15 (회원권-매출 일관성)
2. **다음 스프린트**
   - P0-5 (락커 배정 트랜잭션)
   - P1-6, P1-7, P1-8 (write batch / 병렬화)
   - P1-9, P1-10 (매출 통계/환불에서 정확한 연도 타겟팅)
   - P1-11 (user 컬렉션 `getDoc` 전환), P1-12, P1-13, P1-14
3. **중기 과제**
   - P2-18 React Query 도입 → P2-19, P2-21, P2-22 동시 해결에 유리
   - P2-16, P2-17, P2-20

---

## 예상 효과 (스크립트 기준 회원 20 / 연도 2개)

| 시나리오 | 현재 Firestore op | 수정 후 | 비고 |
|---|---|---|---|
| 수업 4주 반복 생성 | 16 writes | 4 writes | P0-1 |
| 락커 해지 1건 | 1 locker read/write + **20 member reads** + 1 member write | 1 locker read/write + 1 member read/write | P0-2 |
| 매출 페이지 첫 진입 | monthly read × 2 + all-years read | monthly read × 1 + 1-year read | P0-3, P1-9 |
| 플랜 1개 추가 | plans read × 2 + write × 1 | plans write × 1 (arrayUnion) | P1-6 |
| 회원권 추가 | member read/write + revenue read/write | member write + revenue write(merge) in batch | P0-4, P1-15 |
| 전체 락커 30개 연장 후 회원 히스토리 | 60 순차 ops (~4–6초) | 60 병렬 ops (~500ms) 또는 ≤60 in batch | P1-7 |
| 회원 승인 | 2 reads + 3 writes 순차 | 0 reads + 3 writes batch | P1-14 |

---

## 부록: 동시성 위험이 있는 read-modify-write 지점

| 지점 | 파일 | 현재 | 필요 조치 |
|---|---|---|---|
| 매출 추가 | [revenueService.ts:190](../../src/services/revenueService.ts#L190) | get + setDoc(overwrite) | `updateDoc`(필드 경로) 또는 `runTransaction` |
| 매출 환불 | [revenueService.ts:273](../../src/services/revenueService.ts#L273) | 전체 연도 get + setDoc | 정확한 연도 `updateDoc` |
| 매출 삭제 | [revenueService.ts:305](../../src/services/revenueService.ts#L305) | 전체 연도 get + setDoc | 정확한 연도 `updateDoc({ [`${month}.${key}`]: deleteField() })` |
| 회원권 추가 | [membershipService.ts:155](../../src/services/membershipService.ts#L155) | get memberships + set | `runTransaction` or arrayUnion |
| 락커 히스토리 | [memberService.ts:108,147,177](../../src/services/memberService.ts#L108) | get + updateDoc | `arrayUnion` 으로 read 제거 가능 |
| 플랜 추가/삭제 | [membershipService.ts:116,126](../../src/services/membershipService.ts#L116) | get + setDoc(merge) | `arrayUnion` / `arrayRemove` |

락커 문서는 이미 [LockerRepository.runLockerDocumentTransaction](../../src/repositories/lockerRepository.ts#L33)이 준비되어 있어서, 위 지점들도 같은 헬퍼 패턴으로 표준화하면 코드베이스 일관성이 올라간다.
