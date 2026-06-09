// =============================================================================
// Firestore 보안 규칙 테스트 (T0)
// =============================================================================
// 실행:
//   1) firebase CLI + Java(에뮬레이터) 필요
//   2) cd react_web_app/firestore-tests && npm install
//   3) firebase emulators:exec --only firestore --project sweat-bridge \
//        "node --test" --config ../firebase.json
//      (또는 루트에서: npm run test:rules — package.json script 참고)
//
// 검증 대상: ../firestore.rules
// 매트릭스: security-review.md 부록 D + 백엔드 감사로 추가된 reconciliation 케이스.
//   ⚠️ #8(회원이 본인 회원권 조작)은 "Denied"가 아니라 "Allowed(잔존 위험)"로
//      검증한다 — 현재 데이터 모델상 예약 quota self-write가 필요하기 때문.
//      완전 차단은 server-side quota 이전 후속 과제(규칙 파일 상단 주석 참고).
// =============================================================================

const { test, before, after, beforeEach } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} = require('@firebase/rules-unit-testing');
const {
  doc, getDoc, setDoc, updateDoc, deleteDoc,
  collection, getDocs, addDoc,
} = require('firebase/firestore');

let testEnv;

const BOX_X = 'BOXX';
const BOX_Y = 'BOXY';
const COACH_X = 'coachx@test.com';       // role 'COACH' (모바일 대문자 표기)
const COACH_LOWER = 'coachlower@test.com'; // role 'coach' (웹 소문자 표기) — 케이싱 검증
const MEMBER_A = 'membera@test.com';
const MEMBER_B = 'memberb@test.com';
const MEMBER_C = 'memberc@test.com';     // 박스 Y 소속
const APPLICANT = 'applicant@test.com';
const ADMIN = 'admin@test.com';          // 플랫폼 관리자

// 인증 컨텍스트 (token.email 필수 — 규칙이 email을 문서 ID로 사용)
const ctx = (email) =>
  testEnv.authenticatedContext(email, { email }).firestore();
const anon = () => testEnv.unauthenticatedContext().firestore();

before(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'sweat-bridge-rules-test',
    firestore: {
      rules: fs.readFileSync(path.resolve(__dirname, '../firestore.rules'), 'utf8'),
    },
  });
});

after(async () => {
  await testEnv.cleanup();
});

// 매 테스트마다 시드 재구성
beforeEach(async () => {
  await testEnv.clearFirestore();
  await testEnv.withSecurityRulesDisabled(async (c) => {
    const db = c.firestore();
    // user 문서 (이메일 = 문서 ID). role 케이싱은 의도적으로 섞어서 검증한다.
    await setDoc(doc(db, 'user', COACH_X), { email: COACH_X, role: 'COACH', boxName: BOX_X });        // 대문자
    await setDoc(doc(db, 'user', COACH_LOWER), { email: COACH_LOWER, role: 'coach', boxName: BOX_X }); // 소문자
    await setDoc(doc(db, 'user', MEMBER_A), { email: MEMBER_A, role: 'MEMBER', boxName: BOX_X });
    await setDoc(doc(db, 'user', MEMBER_B), { email: MEMBER_B, role: 'MEMBER', boxName: BOX_X });
    await setDoc(doc(db, 'user', MEMBER_C), { email: MEMBER_C, role: 'MEMBER', boxName: BOX_Y });
    await setDoc(doc(db, 'user', APPLICANT), { email: APPLICANT, role: 'MEMBER', boxName: `?${BOX_X}` });
    await setDoc(doc(db, 'user', ADMIN), { email: ADMIN, role: 'admin', boxName: '' });

    // 박스 X 데이터
    await setDoc(doc(db, 'box', BOX_X), { boxName: BOX_X });
    await setDoc(doc(db, 'box', BOX_Y), { boxName: BOX_Y });
    await setDoc(doc(db, `box/${BOX_X}/member`, MEMBER_A), {
      email: MEMBER_A, realName: '회원A', boxName: BOX_X,
      memberships: [{ type: 'countPass', quota: { total: 10, used: 0, remaining: 10 } }],
    });
    await setDoc(doc(db, `box/${BOX_X}/member`, MEMBER_B), {
      email: MEMBER_B, realName: '회원B', boxName: BOX_X, memberships: [],
    });
    await setDoc(doc(db, `box/${BOX_X}/class`, 'class1'), {
      cap: 10, coach: '코치', reserved: [],
    });
    await setDoc(doc(db, `box/${BOX_X}/revenue/2026`), { '5': {} });
    await setDoc(doc(db, `box/${BOX_X}/wod`, 'wod1'), { createdBy: COACH_X, temp: 'x' });
    await setDoc(doc(db, `box/${BOX_Y}/wod`, 'wodY'), { createdBy: 'coachy@test.com', temp: 'y' });
    await setDoc(doc(db, `box/${BOX_X}/applied/applieddoc`), {});
  });
});

// ─── 부록 D 매트릭스 ──────────────────────────────────────────────────────────

test('1. 미인증: 박스 조회 거부', async () => {
  await assertFails(getDoc(doc(anon(), 'box', BOX_X)));
});

test('3. 회원A: 박스 X member list 거부 (코치만)', async () => {
  await assertFails(getDocs(collection(ctx(MEMBER_A), `box/${BOX_X}/member`)));
});

test('4. 회원A: 본인 user 문서 조회 OK', async () => {
  await assertSucceeds(getDoc(doc(ctx(MEMBER_A), 'user', MEMBER_A)));
});

test('5. 회원A: 회원B user 문서 조회 거부', async () => {
  await assertFails(getDoc(doc(ctx(MEMBER_A), 'user', MEMBER_B)));
});

test('6. 회원A: 본인 member 문서 조회 OK', async () => {
  await assertSucceeds(getDoc(doc(ctx(MEMBER_A), `box/${BOX_X}/member`, MEMBER_A)));
});

test('7. 회원A: 회원B member 문서 조회 거부', async () => {
  await assertFails(getDoc(doc(ctx(MEMBER_A), `box/${BOX_X}/member`, MEMBER_B)));
});

test('9. 회원A: 박스 X WOD 조회 OK', async () => {
  await assertSucceeds(getDoc(doc(ctx(MEMBER_A), `box/${BOX_X}/wod`, 'wod1')));
});

test('10. 회원A: 박스 Y WOD 조회 거부', async () => {
  await assertFails(getDoc(doc(ctx(MEMBER_A), `box/${BOX_Y}/wod`, 'wodY')));
});

test('11. 회원A: 클래스 reserved 필드만 수정 OK', async () => {
  await assertSucceeds(
    updateDoc(doc(ctx(MEMBER_A), `box/${BOX_X}/class`, 'class1'), {
      reserved: [`${MEMBER_A},회원A,A`],
    })
  );
});

test('12. 회원A: 클래스 cap 수정 거부', async () => {
  await assertFails(
    updateDoc(doc(ctx(MEMBER_A), `box/${BOX_X}/class`, 'class1'), { cap: 999 })
  );
});

test('13. 회원A: revenue 조회 거부', async () => {
  await assertFails(getDoc(doc(ctx(MEMBER_A), `box/${BOX_X}/revenue/2026`)));
});

test('14. 코치X: 본인 박스 revenue 조회 OK', async () => {
  await assertSucceeds(getDoc(doc(ctx(COACH_X), `box/${BOX_X}/revenue/2026`)));
});

test('15. 코치X: 박스 Y revenue 조회 거부', async () => {
  await assertFails(getDoc(doc(ctx(COACH_X), `box/${BOX_Y}/revenue/2026`)));
});

test('16. 코치X: 본인 박스 회원 삭제 OK', async () => {
  await assertSucceeds(deleteDoc(doc(ctx(COACH_X), `box/${BOX_X}/member`, MEMBER_B)));
});

test('17. 코치X: createdBy 누락 WOD 생성 거부', async () => {
  await assertFails(
    setDoc(doc(ctx(COACH_X), `box/${BOX_X}/wod`, 'wodNew'), { temp: 'z' })
  );
});

test('18. 코치X: createdBy=본인 WOD 생성 OK', async () => {
  await assertSucceeds(
    setDoc(doc(ctx(COACH_X), `box/${BOX_X}/wod`, 'wodNew'), { createdBy: COACH_X, temp: 'z' })
  );
});

test('19. 코치X: 박스 Y WOD 생성 거부', async () => {
  await assertFails(
    setDoc(doc(ctx(COACH_X), `box/${BOX_Y}/wod`, 'wodNew'), { createdBy: COACH_X, temp: 'z' })
  );
});

test('20. 회원A: 레거시 /records read/write 거부', async () => {
  await assertFails(getDoc(doc(ctx(MEMBER_A), 'records', 'r1')));
  await assertFails(setDoc(doc(ctx(MEMBER_A), 'records', 'r1'), { x: 1 }));
});

test('21. 신청자: 본인 이메일 키로 applieddoc 추가 OK', async () => {
  await assertSucceeds(
    setDoc(
      doc(ctx(APPLICANT), `box/${BOX_X}/applied/applieddoc`),
      { [APPLICANT]: { realName: '신청자', email: APPLICANT } },
      { merge: true }
    )
  );
});

test('22. 신청자: 타인 이메일 키로 applieddoc 추가 거부', async () => {
  await assertFails(
    setDoc(
      doc(ctx(APPLICANT), `box/${BOX_X}/applied/applieddoc`),
      { [MEMBER_B]: { realName: '남', email: MEMBER_B } },
      { merge: true }
    )
  );
});

test('23/24. audit log: 코치 생성 OK, 수정 거부', async () => {
  const ref = await assertSucceeds(
    addDoc(collection(ctx(COACH_X), `box/${BOX_X}/auditLog`), {
      at: new Date(), actor: COACH_X, action: 'test',
    })
  );
  await assertFails(updateDoc(ref, { action: 'tampered' }));
});

test('25. 회원C(박스 Y): 박스 X member 조회 거부', async () => {
  await assertFails(getDoc(doc(ctx(MEMBER_C), `box/${BOX_X}/member`, MEMBER_A)));
});

// ─── 감사로 추가된 reconciliation 케이스 ──────────────────────────────────────

test('R1. 회원A: 본인 member 문서 self-write OK (예약 quota 감산 경로)', async () => {
  // reservation_service.updateMemberships 가 깨지지 않아야 한다.
  await assertSucceeds(
    updateDoc(doc(ctx(MEMBER_A), `box/${BOX_X}/member`, MEMBER_A), {
      memberships: [{ type: 'countPass', quota: { total: 10, used: 1, remaining: 9 } }],
      updatedAt: new Date(),
    })
  );
});

test('R2. 회원A: 타 회원 member 문서 write 거부', async () => {
  await assertFails(
    updateDoc(doc(ctx(MEMBER_A), `box/${BOX_X}/member`, MEMBER_B), { memberships: [] })
  );
});

test('R3. 코치X: 신청자(?BOXX) user 문서를 본인 박스로 편입 OK', async () => {
  // approveApplicant / AddMemberModal.updateUser 경로
  await assertSucceeds(
    updateDoc(doc(ctx(COACH_X), 'user', APPLICANT), {
      boxName: BOX_X, realName: '신청자', joinedAt: new Date(),
    })
  );
});

test('R4. 코치X: 신청자 거절(boxName 비우기) OK', async () => {
  await assertSucceeds(
    updateDoc(doc(ctx(COACH_X), 'user', APPLICANT), { boxName: '' })
  );
});

test('R5. 코치X: 타 박스(Y) 활성 회원 가로채기 거부', async () => {
  // 회원C는 박스 Y 활성 회원 — 코치X가 본인 박스로 빼앗지 못해야 한다.
  await assertFails(
    updateDoc(doc(ctx(COACH_X), 'user', MEMBER_C), { boxName: BOX_X })
  );
});

test('R6. 회원A: 본인 푸시 토큰 write OK / 타인 거부', async () => {
  await assertSucceeds(
    setDoc(doc(ctx(MEMBER_A), `user/${MEMBER_A}/keys/push_token`), { token: 't', updatedTime: new Date() })
  );
  await assertFails(
    setDoc(doc(ctx(MEMBER_A), `user/${MEMBER_B}/keys/push_token`), { token: 't' })
  );
});

test('R7. ⚠️ 의도적으로 허용된 잔존 위험: 회원A가 본인 회원권을 임의 추가 — ALLOWED', async () => {
  // 팀 결정(2026-05-28): 데이터 모델상 예약 quota self-write가 불가피하므로
  // member self-write를 의도적으로 허용하고 Cloud Logging으로 사후 감지한다.
  // server-side quota callable로 전환할 경우 이 케이스를 assertFails로 뒤집을 것.
  // 상세: scripts/t0-firestore-rules-runbook.md §3.
  await assertSucceeds(
    updateDoc(doc(ctx(MEMBER_A), `box/${BOX_X}/member`, MEMBER_A), {
      memberships: [{ type: 'periodPass', period: { startDate: '2026-01-01', endDate: '2099-12-31' } }],
    })
  );
});

// ─── 역할 케이싱 (대/소문자) ──────────────────────────────────────────────────

test('C1. 소문자 role "coach"도 코치 권한 인정 (revenue 조회 OK)', async () => {
  await assertSucceeds(getDoc(doc(ctx(COACH_LOWER), `box/${BOX_X}/revenue/2026`)));
});

test('C2. 대문자 role "COACH"(모바일)도 코치 권한 인정 (revenue 조회 OK)', async () => {
  await assertSucceeds(getDoc(doc(ctx(COACH_X), `box/${BOX_X}/revenue/2026`)));
});

// ─── 플랫폼 관리자 (멀티테넌트 콘솔) ─────────────────────────────────────────

test('AD1. 관리자: 신규 박스 생성 OK', async () => {
  await assertSucceeds(
    setDoc(doc(ctx(ADMIN), 'box', 'NEWBOX'), { boxName: 'NEWBOX', status: 'APPROVED' })
  );
});

test('AD2. 관리자: 박스 status 업데이트(타 박스 포함) OK', async () => {
  await assertSucceeds(
    updateDoc(doc(ctx(ADMIN), 'box', BOX_Y), { status: 'APPROVED' })
  );
});

test('AD3. 관리자: /user list OK (유저 관리 콘솔)', async () => {
  await assertSucceeds(getDocs(collection(ctx(ADMIN), 'user')));
});

test('AD4. 관리자: 타 박스 revenue 등 전체 read OK (콘솔 운영)', async () => {
  await assertSucceeds(getDoc(doc(ctx(ADMIN), `box/${BOX_X}/revenue/2026`)));
  await assertSucceeds(getDoc(doc(ctx(ADMIN), `box/${BOX_Y}/wod`, 'wodY')));
});

test('AD5. 비-관리자(회원A): 박스 생성 거부', async () => {
  await assertFails(
    setDoc(doc(ctx(MEMBER_A), 'box', 'NEWBOX2'), { boxName: 'NEWBOX2' })
  );
});

test('AD6. 비-관리자(코치X): /user list 거부 (관리자 전용)', async () => {
  await assertFails(getDocs(collection(ctx(COACH_X), 'user')));
});
