# firestore-tree

실제 Firestore DB에 붙어서 컬렉션 → 서브컬렉션 → 필드 트리를 덤프하는 스크립트.
`firebase-admin`을 쓰기 때문에 클라이언트 SDK로는 불가능한 `listCollections()` 순회가 가능하다.

## 초기 설정 (1회)

### 1. 서비스 계정 키 발급

Firebase Console → 프로젝트 설정 → **서비스 계정** 탭 → **새 비공개 키 생성**
→ 다운로드된 JSON을 이 디렉토리에 `service-account.json`으로 저장.

> `.gitignore`에 등록되어 있어 커밋되지 않는다. 유출되면 프로젝트 전체 접근 권한이 털리니 취급 주의.

### 2. 의존성 설치

```bash
cd scripts/firestore-tree
npm install
```

## 실행

```bash
# 기본 (샘플 5개, 값 제외, ./firestore-tree.{json,md} 생성)
npm run dump

# 필드 샘플 값까지 포함 (이름/전화번호/이메일이 평문으로 박히니 주의)
npm run dump:values

# 옵션 직접 조정
node dump-tree.js --samples 10 --output ./snapshot-2026-04-22 --values

# 특정 루트 컬렉션만
node dump-tree.js --only box,user
```

### 옵션

| 플래그 | 기본값 | 설명 |
|---|---|---|
| `--service-account <path>` | `./service-account.json` 또는 `$GOOGLE_APPLICATION_CREDENTIALS` | 서비스 계정 JSON 경로 |
| `--samples <n>` | 5 | 컬렉션당 스캔할 샘플 문서 수. 서브컬렉션 발견용이므로 크게 줄 필요 없음 |
| `--max-depth <n>` | 10 | 재귀 최대 깊이. 안전장치 |
| `--output <base>` | `./firestore-tree` | 접두사. `.json`과 `.md` 두 파일 생성 |
| `--values` | false | 각 필드의 샘플 값 포함. **민감정보 주의** |
| `--only <csv>` | 전체 | 루트 컬렉션 필터 (예: `--only box,user`) |

## 출력

- `firestore-tree.json` — 기계 판독용. 트리, 필드 타입, 샘플 문서 ID, 문서 수
- `firestore-tree.md` — 사람 친화적 트리. PR/문서 리뷰용

### 작동 방식

1. `db.listCollections()`로 루트 컬렉션 열거
2. 각 컬렉션에서 `SAMPLES`개 문서 조회 (`.limit(N)`)
3. 각 문서의 필드를 타입 추론해서 병합 (`string`, `Timestamp`, `map<N>` 등)
4. 각 샘플 문서의 `listCollections()`로 서브컬렉션 발견 → 재귀
5. `.count()` 집계 쿼리로 컬렉션당 총 문서 수 조회

샘플이 적으면 어떤 문서에만 존재하는 서브컬렉션은 놓칠 수 있다. 의심되면 `--samples`를 늘려라.

## 안전/비용 주의

- **읽기**: 컬렉션당 `SAMPLES + 1(count)`개 + 서브컬렉션 탐지 쿼리. 박스 수가 적으면 무시할 수준.
- **쓰기 없음**: 전부 read-only.
- **민감정보**: `--values` 사용 시 이메일/이름/전화가 `firestore-tree.md`에 박힌다. `.gitignore`에 등록되어 있지만 외부 공유 전 한번 더 확인.
- **권한**: 서비스 계정이 가진 IAM 권한으로 실행된다. `roles/datastore.viewer`면 충분.
