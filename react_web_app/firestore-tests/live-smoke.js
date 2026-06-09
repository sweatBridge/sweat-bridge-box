// =============================================================================
// 라이브 환경 보안 규칙 스모크 테스트
// =============================================================================
// 목적: 에뮬레이터 테스트와 동일한 매트릭스를 "실제 prod Firestore"에 대해 돌려서
//   - 방금 deploy한 규칙이 의도대로 동작하는지
//   - 케이싱/계정 데이터 등 prod 고유 조건에서 깨지는 경로는 없는지
// 를 30초 안에 확인한다.
//
// 사용법:
//   1) 한 번만(처음 설정):
//        a) Firebase Console → Authentication → 사용자 추가 — 아래 3개 계정 생성
//             - qa-admin@<도메인>
//             - qa-coach@<도메인>
//             - qa-member@<도메인>
//        b) Firestore Console → /user 컬렉션에 위 3개 이메일 키로 문서 생성:
//             - qa-admin:  { role: 'admin',  boxName: '' }
//             - qa-coach:  { role: 'coach',  boxName: <실제 박스 X> }
//             - qa-member: { role: 'MEMBER', boxName: <실제 박스 X> }
//        c) /box/<X>/member/qa-member@... 문서 생성 (최소: { email, realName, boxName })
//        d) .env 파일 작성 (.env.example 복사 후 값 채움)
//   2) 매 배포 후:
//        cd firestore-tests
//        npm run smoke:live
//
// 안전성: 본 스크립트는 READ만 수행한다. 쓰기/삭제 없음 → prod 데이터 손상 위험 없음.
//   (정원 차감/예약 같은 write 경로는 에뮬레이터 테스트가 검증.)
// =============================================================================

require('dotenv').config();
const { initializeApp } = require('firebase/app');
const {
  getAuth, signInWithEmailAndPassword, signOut,
} = require('firebase/auth');
const {
  getFirestore, doc, getDoc, collection, getDocs, query, limit,
} = require('firebase/firestore');

// ── 환경 변수 검증 ────────────────────────────────────────────────────────────
const REQUIRED = [
  'FIREBASE_API_KEY', 'FIREBASE_AUTH_DOMAIN', 'FIREBASE_PROJECT_ID',
  'ADMIN_EMAIL', 'ADMIN_PASSWORD',
  'COACH_EMAIL', 'COACH_PASSWORD',
  'MEMBER_EMAIL', 'MEMBER_PASSWORD',
  'TEST_BOX', 'OTHER_BOX',
];
const missing = REQUIRED.filter((k) => !process.env[k]);
if (missing.length) {
  console.error('[FATAL] .env에 누락된 키:', missing.join(', '));
  console.error('  firestore-tests/.env.example를 참고해 .env를 채우세요.');
  process.exit(2);
}

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ── 결과 집계 ─────────────────────────────────────────────────────────────────
let pass = 0;
let fail = 0;
const failures = [];

function record(ok, label, detail) {
  if (ok) {
    pass++;
    console.log(`  ✓ ${label}`);
  } else {
    fail++;
    failures.push({ label, detail });
    console.error(`  ✗ ${label} — ${detail}`);
  }
}

async function assertAllow(label, op) {
  try {
    await op();
    record(true, label);
  } catch (e) {
    record(false, label, `ALLOW 기대 / 실제: ${e.code || e.message}`);
  }
}

async function assertDeny(label, op) {
  try {
    await op();
    record(false, label, 'DENY 기대 / 실제: 성공함');
  } catch (e) {
    if (e.code === 'permission-denied') {
      record(true, label);
    } else {
      record(false, label, `DENY 기대 / 실제: 예상치 못한 에러 ${e.code || e.message}`);
    }
  }
}

// ── 각 역할별 어설션 ──────────────────────────────────────────────────────────
async function as(account, label, fn) {
  console.log(`\n── ${label} (${account.email}) ──`);
  await signInWithEmailAndPassword(auth, account.email, account.password);
  try {
    await fn();
  } finally {
    await signOut(auth);
  }
}

const ADMIN  = { email: process.env.ADMIN_EMAIL,  password: process.env.ADMIN_PASSWORD };
const COACH  = { email: process.env.COACH_EMAIL,  password: process.env.COACH_PASSWORD };
const MEMBER = { email: process.env.MEMBER_EMAIL, password: process.env.MEMBER_PASSWORD };
const BOX_X = process.env.TEST_BOX;
const BOX_Y = process.env.OTHER_BOX;
const OTHER_MEMBER = process.env.OTHER_MEMBER_EMAIL; // 선택 — 있으면 cross-user deny 검증

const currentYear = new Date().getFullYear();

async function adminTests() {
  await assertAllow('L1. 박스 목록 list',
    () => getDocs(query(collection(db, 'box'), limit(5))));
  await assertAllow(`L2. 박스 문서 get (${BOX_X})`,
    () => getDoc(doc(db, 'box', BOX_X)));
  await assertAllow('L3. /user list (관리자만 가능)',
    () => getDocs(query(collection(db, 'user'), limit(3))));
  await assertAllow(`L4. revenue 조회 (cross-box wildcard로 가능해야 함)`,
    () => getDoc(doc(db, `box/${BOX_X}/revenue/${currentYear}`)));
  await assertAllow(`L5. ${BOX_X} member list`,
    () => getDocs(query(collection(db, `box/${BOX_X}/member`), limit(3))));
}

async function coachTests() {
  await assertAllow(`L6. 본인 박스 revenue 조회`,
    () => getDoc(doc(db, `box/${BOX_X}/revenue/${currentYear}`)));
  await assertAllow(`L7. 본인 박스 member list`,
    () => getDocs(query(collection(db, `box/${BOX_X}/member`), limit(3))));
  await assertDeny(`L8. 타 박스(${BOX_Y}) revenue 조회 거부`,
    () => getDoc(doc(db, `box/${BOX_Y}/revenue/${currentYear}`)));
  await assertDeny('L9. /user list 거부 (관리자 전용)',
    () => getDocs(query(collection(db, 'user'), limit(3))));
}

async function memberTests() {
  await assertAllow(`L10. 본인 박스 wod 조회`,
    () => getDocs(query(collection(db, `box/${BOX_X}/wod`), limit(1))));
  await assertDeny(`L11. revenue 조회 거부`,
    () => getDoc(doc(db, `box/${BOX_X}/revenue/${currentYear}`)));
  await assertDeny(`L12. ${BOX_X} member list 거부 (코치만)`,
    () => getDocs(query(collection(db, `box/${BOX_X}/member`), limit(3))));
  await assertAllow(`L13. 본인 member 문서 get`,
    () => getDoc(doc(db, `box/${BOX_X}/member`, MEMBER.email)));
  if (OTHER_MEMBER) {
    await assertDeny(`L14. 타인 member 문서 get 거부 (${OTHER_MEMBER})`,
      () => getDoc(doc(db, `box/${BOX_X}/member`, OTHER_MEMBER)));
  } else {
    console.log('  - L14 스킵 (OTHER_MEMBER_EMAIL 미설정)');
  }
  await assertDeny(`L15. 타 박스(${BOX_Y}) wod 조회 거부`,
    () => getDocs(query(collection(db, `box/${BOX_Y}/wod`), limit(1))));
}

async function anonTests() {
  console.log('\n── 미인증 (signed-out) ──');
  await assertDeny('L16. 미인증 박스 조회 거부',
    () => getDoc(doc(db, 'box', BOX_X)));
}

// ── 실행 ──────────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\n=== Firestore 규칙 라이브 스모크 (project: ${firebaseConfig.projectId}) ===`);
  const t0 = Date.now();
  try {
    await as(ADMIN,  '관리자(admin)',         adminTests);
    await as(COACH,  `코치(box=${BOX_X})`,     coachTests);
    await as(MEMBER, `회원(box=${BOX_X})`,    memberTests);
    await anonTests();
  } catch (e) {
    console.error('\n[FATAL] 테스트 도중 예외:', e.code || e.message);
    fail++;
  }
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n=== 결과: ${pass} pass / ${fail} fail (${dt}s) ===`);
  if (fail > 0) {
    console.error('\n실패한 케이스:');
    failures.forEach((f) => console.error(`  - ${f.label}: ${f.detail}`));
    console.error('\n조치: 실패한 경로의 firestore.rules를 점검하고 재배포 후 다시 실행.');
    process.exit(1);
  } else {
    console.log('🎉 규칙이 의도대로 동작함.');
  }
})();
