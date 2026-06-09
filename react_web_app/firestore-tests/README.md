# firestore-tests

Firestore 보안 규칙을 검증하는 두 종류의 테스트가 담긴 폴더.

| 파일 | 무엇을 검증하나 | 언제 돌리나 |
|---|---|---|
| `rules.test.js` | **에뮬레이터 환경**에서 규칙 매트릭스 (32+ 케이스) — write 포함 | 규칙을 수정할 때마다, prod 배포 전 |
| `live-smoke.js` | **실제 prod Firestore**에 붙어 규칙이 의도대로 deploy됐는지 (16 케이스, read-only) | prod 배포 직후 ~30초 검증 |

테스트 자체는 자동인데, **`live-smoke.js`는 한 번의 초기 설정**(~15분)이 필요하다 — 테스트용
Auth 계정 3개와 `.env` 파일이 있어야 prod에 붙어서 규칙을 검증할 수 있기 때문이다. 한 번
설정해두면 그 뒤로는 `npm run smoke:live` 한 줄.

이 문서는 그 초기 설정 + 일상적인 사용법을 담는다.

---

## 0. 사전 요구사항

- **Node.js 18+** (이미 있을 것)
- **JDK 21+** — `rules.test.js`만 필요(Firebase 에뮬레이터 런타임). 자세한 건 §4 참고.
- **firebase CLI** (`npm i -g firebase-tools` 또는 `npx firebase ...`)
- 이 repo의 `firestore-tests/` 폴더로 이동:
  ```bash
  cd react_web_app/firestore-tests
  npm install
  ```

---

## 1. 에뮬레이터 테스트 (`rules.test.js`) — 규칙 수정할 때

규칙 파일(`../firestore.rules`)을 수정한 뒤 prod에 배포하기 전, 로컬 에뮬레이터에서 매트릭스
전체를 돌려서 회귀가 없는지 확인한다.

```bash
npm run test:rules
```

내부적으로 `firebase emulators:exec`가 Firestore 에뮬레이터를 띄우고 `node --test`로 테스트를
돌린 뒤 에뮬레이터를 내린다. 한 번 실행에 5~10초.

**필요한 것**: JDK 21+ (에뮬레이터가 Java 21 이상을 요구함). 자세한 트러블슈팅 §4 참고.

---

## 2. 라이브 스모크 (`live-smoke.js`) — 배포 직후

규칙을 prod에 배포한 뒤, 실제로 의도대로 떠 있는지 30초만에 확인. read-only라 prod 데이터에
어떤 영향도 없다.

### 2-1. 초기 설정 (한 번만, ~15분)

#### a) 테스트 Auth 계정 3개 생성

Firebase Console → **Authentication** → "사용자 추가" 클릭 3번:

| 이메일 | 비밀번호 | 용도 |
|---|---|---|
| `qa-admin@sweat.test` | 임의 (메모해두기) | 관리자(admin) 권한 검증 |
| `qa-coach@sweat.test` | 임의 | 코치 권한 검증 |
| `qa-member@sweat.test` | 임의 | 회원 권한 검증 |

> 도메인은 `sweat.test`처럼 실재하지 않는 도메인으로 두면 진짜 사용자와 헷갈리지 않는다.
> 진짜 메일은 안 가도 되니까(Auth는 이메일 형식만 검증) 임의 도메인 OK.

#### b) `/user` 컬렉션에 해당 3개 문서 생성

Firebase Console → **Firestore Database** → `/user` 컬렉션 → "문서 추가". 문서 ID에 이메일을
그대로 입력하고 필드를 채운다.

| 문서 ID | role | boxName |
|---|---|---|
| `qa-admin@sweat.test` | `admin` | `` (빈 문자열) |
| `qa-coach@sweat.test` | `coach` | 실제 박스 이름 하나 (예: `SWEAT`) |
| `qa-member@sweat.test` | `MEMBER` | 위와 같은 박스 (`SWEAT`) |

> 셋 다 같은 컬렉션(`/user`) 안에 들어간다. `role` 값은 정확히 위 문자열로 (`role.lower()` 비교라
> 대소문자 자체는 자유롭지만 일관성을 위해 위 표대로 권장).

#### c) `/box/{TEST_BOX}/member/qa-member@...` 문서 생성

회원이 본인 member doc을 읽는 케이스(L13) 검증용. 위에서 정한 박스 이름 아래 member 컬렉션에
qa-member 이메일을 ID로 문서 하나 만든다. 최소 필드:

```
email: "qa-member@sweat.test"
realName: "QA Member"
boxName: "SWEAT"   ← 위에서 정한 박스와 동일
```

#### d) `.env` 작성

`firestore-tests/.env.example`를 복사해서 `firestore-tests/.env`를 만들고 값을 채운다:

```bash
cp .env.example .env
# 그 다음 .env를 편집기로 열어 값 채우기
```

채울 값:

| 키 | 어디서 가져오나 |
|---|---|
| `FIREBASE_API_KEY` | `react_web_app/src/config/firebase.ts` → `firebaseConfig.apiKey` |
| `FIREBASE_AUTH_DOMAIN` | 위 파일 → `firebaseConfig.authDomain` |
| `FIREBASE_PROJECT_ID` | 위 파일 → `firebaseConfig.projectId` (= `sweat-bridge`) |
| `ADMIN_EMAIL`/`PASSWORD` | (a)에서 만든 qa-admin 계정 |
| `COACH_EMAIL`/`PASSWORD` | (a)에서 만든 qa-coach 계정 |
| `MEMBER_EMAIL`/`PASSWORD` | (a)에서 만든 qa-member 계정 |
| `TEST_BOX` | (b)/(c)에서 정한 박스 이름 (예: `SWEAT`) |
| `OTHER_BOX` | TEST_BOX와 다른 실제 박스 이름 (예: `CFBD`) — cross-tenant 거부 검증용 |
| `OTHER_MEMBER_EMAIL` | (선택) TEST_BOX의 다른 실제 회원 이메일 — 비워두면 L14만 스킵 |

> `.env`는 `.gitignore`로 보호된다. **절대 git에 올리지 말 것.** 비밀번호/API 키가 들어 있다.

### 2-2. 실행

```bash
npm run smoke:live
```

성공 출력 예시:
```
=== Firestore 규칙 라이브 스모크 (project: sweat-bridge) ===

── 관리자(admin) (qa-admin@sweat.test) ──
  ✓ L1. 박스 목록 list
  ✓ L2. 박스 문서 get (SWEAT)
  ✓ L3. /user list (관리자만 가능)
  ✓ L4. revenue 조회 (cross-box wildcard로 가능해야 함)
  ✓ L5. SWEAT member list

── 코치(box=SWEAT) (qa-coach@sweat.test) ──
  ✓ L6. 본인 박스 revenue 조회
  ✓ L7. 본인 박스 member list
  ✓ L8. 타 박스(CFBD) revenue 조회 거부
  ✓ L9. /user list 거부 (관리자 전용)

── 회원(box=SWEAT) (qa-member@sweat.test) ──
  ✓ L10. 본인 박스 wod 조회
  ✓ L11. revenue 조회 거부
  ✓ L12. SWEAT member list 거부 (코치만)
  ✓ L13. 본인 member 문서 get
  ✓ L14. 타인 member 문서 get 거부 (some-real@member.com)
  ✓ L15. 타 박스(CFBD) wod 조회 거부

── 미인증 (signed-out) ──
  ✓ L16. 미인증 박스 조회 거부

=== 결과: 16 pass / 0 fail (4.2s) ===
🎉 규칙이 의도대로 동작함.
```

### 2-3. 실패가 나오면

각 실패는 그 자리에서 출력된다:
```
  ✗ L7. 본인 박스 member list — ALLOW 기대 / 실제: permission-denied
```

대처:
- **ALLOW 기대인데 denied** → 규칙이 너무 엄격. `firestore.rules`의 해당 경로(`box/{boxName}/member`)
  규칙을 확인. 보통 헬퍼 함수의 `userBox()`/`roleLower()` 가 의도대로 매칭 안 되는 경우.
- **DENY 기대인데 succeeded** → 규칙이 너무 느슨. **중대한 보안 회귀**. 즉시 rollback 고려.
- **예상치 못한 에러 코드** (`unavailable`, `unauthenticated` 등) → 네트워크/Auth 문제, 또는 테스트
  계정 자격이 무효. 비밀번호 잘못됐거나 계정 비활성화 된 거 아닌지 확인.

수정 → 에뮬레이터로 재검증(§1) → prod 배포 → 라이브 스모크 재실행, 의 사이클.

### 2-4. 보안 주의

- `live-smoke.js`는 **READ만 수행**한다. 어떤 prod 문서도 수정/삭제하지 않는다 (코드 직접 확인 OK).
  반복 실행해도 안전.
- `.env` 파일은 git에 절대 올리지 말 것. 노출되면 테스트 계정으로 누구든 prod에 접근 가능.
- 테스트 계정 비밀번호가 노출됐다고 의심되면 즉시 Firebase Console에서 그 계정 비활성화 후
  새로 만들고 `.env`만 업데이트하면 된다.

---

## 3. 두 테스트 관계

```
   ┌──────────────────────────┐                  ┌──────────────────────┐
   │  ../firestore.rules      │   배포           │  prod Firestore       │
   │  (소스)                  │ ─────────────►  │  (실제 운영 DB)        │
   └──────────────────────────┘                  └──────────────────────┘
            ▲                                            ▲
            │ 수정 후 사전 검증                          │ 배포 직후 사후 검증
            │                                            │
   ┌──────────────────────────┐                  ┌──────────────────────┐
   │  rules.test.js           │                  │  live-smoke.js        │
   │  (에뮬레이터)            │                  │  (실제 prod 대상)     │
   └──────────────────────────┘                  └──────────────────────┘
```

- 규칙을 고치면 → 에뮬레이터로 매트릭스 통과 확인 → 배포 → 라이브 스모크로 prod에서도 통과 확인.
- 둘 다 통과해야 안심. 에뮬레이터는 write까지 검증 가능(많은 케이스), 라이브는 read만 가능하지만
  진짜 환경에서 도는 게 의미.

---

## 4. 트러블슈팅

### "firebase-tools no longer supports Java version before 21"

`npm run test:rules`(에뮬레이터)가 JDK 21+를 요구한다. JDK 21이 PATH에 있는지 확인:

```powershell
where.exe java
# 또는
java -version
```

JDK 17이 위에 잡혀 있다면 한 세션 동안 PATH 앞에 21을 끼워넣는다:

```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.0.11.10-hotspot"  # 실제 경로
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
java -version   # 21로 보이면 OK
npm run test:rules
```

영구 설정: Windows 환경변수에서 `JAVA_HOME`을 JDK 21로 두고 `%JAVA_HOME%\bin`을 PATH 상단으로.

JDK 21 설치가 없으면:
```powershell
winget install --id EclipseAdoptium.Temurin.21.JDK -e
```
설치 후 VSCode를 완전히 종료하고 재실행해야 새 PATH가 잡힘.

### `npm install` ERESOLVE peer dependency 오류

`firebase` 버전 충돌. 현재 `firebase-tests/package.json`은 `firebase@^11.0.0`으로 고정돼 있다
(`@firebase/rules-unit-testing@4.x`의 peer 요구사항). 만약 직접 손대 12.x로 올렸다면 원래대로
되돌리고 `node_modules`/`package-lock.json` 지운 뒤 다시 `npm install`.

### 라이브 스모크가 "ALLOW 기대 / 실제: permission-denied" 로 죄다 실패

가장 흔한 원인 둘:
1. **테스트 계정의 `/user` 문서가 없거나 role/boxName이 잘못됨** — Firestore Console에서 §2-1 (b)
   다시 확인.
2. **Firebase Auth 비밀번호와 `.env`의 비밀번호 불일치** — 로그인 자체가 실패하면서 모든
   인증된 read도 깨진다. Console에서 해당 계정의 비밀번호 재설정 후 `.env` 업데이트.

### 라이브 스모크가 "DENY 기대 / 실제: 성공함" 으로 실패

규칙이 너무 느슨한 상태로 배포됐다. **즉시 점검 필요** — 어떤 케이스가 실패했는지 보고 해당
경로의 `firestore.rules`를 점검. 의심스러우면 직전 규칙으로 rollback (runbook §4-5 참고).

---

## 5. 파일 구성

```
firestore-tests/
├── README.md            ← 이 문서
├── package.json         ← npm scripts + 의존성
├── rules.test.js        ← 에뮬레이터 매트릭스 (32 케이스, write 포함)
├── live-smoke.js        ← prod 라이브 스모크 (16 케이스, read-only)
├── .env.example         ← .env 템플릿 (커밋됨)
├── .env                 ← 실제 비밀(API 키, 비밀번호) — .gitignore로 보호, 커밋 금지
└── .gitignore           ← .env, node_modules 차단
```

## 6. 관련 문서

- 배포 절차/롤백/모니터링: [../scripts/t0-firestore-rules-runbook.md](../scripts/t0-firestore-rules-runbook.md)
- 규칙 자체 + 잔존 위험 설명: [../firestore.rules](../firestore.rules)
- 전체 보안 리뷰 컨텍스트: [../scripts/security-review.md](../scripts/security-review.md)
