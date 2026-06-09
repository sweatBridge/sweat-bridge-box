// =============================================================================
// 일회용 마이그레이션: /user/{email}.role 의 'operator' 값을 'admin' 으로 일괄 변경
// =============================================================================
// 배경: 이전 'operator' 역할은 코드상 'admin'과 권한이 동일해 통합했다(2026-05-28).
// firestore.rules의 isPlatformAdmin은 이제 'admin'만 인정하므로, 기존 operator 유저는
// 마이그레이션 없이는 어드민 콘솔 접근이 거부된다.
//
// 사용법:
//   1) Firebase Console → 프로젝트 설정 → 서비스 계정 → "새 비공개 키 생성"으로
//      service-account.json을 받아 이 파일과 같은 폴더에 둔다 (단, git에 커밋 금지!).
//   2) cd react_web_app/scripts && npm install
//   3) 먼저 드라이런으로 영향 범위 확인:
//        node migrate-operator-to-admin.js
//      → 어떤 문서를 어떻게 바꿀지 출력하지만 실제 쓰기는 안 함.
//   4) 결과가 예상대로면 실제 실행:
//        node migrate-operator-to-admin.js --execute
//
// 안전장치:
//   • 기본은 드라이런. --execute 플래그가 있어야 실제 write 발생.
//   • 매 write 전후로 before/after 로그.
//   • 'admin' / 'coach' 등 다른 role은 절대 건드리지 않음.
//   • role 필드가 없는 문서, 대/소문자 변형 'OPERATOR' 등도 대상 (소문자 비교).
//   • 100건씩 배치 커밋(Firestore writeBatch 한계 500 내). 이 프로젝트 규모(<100명)에선
//     단일 배치로 끝나지만 일반화해 둠.
// =============================================================================

const path = require('path');
const admin = require('firebase-admin');

const EXECUTE = process.argv.includes('--execute');
const SERVICE_ACCOUNT_PATH = path.resolve(__dirname, 'service-account.json');

let serviceAccount;
try {
  serviceAccount = require(SERVICE_ACCOUNT_PATH);
} catch (e) {
  console.error(`[FATAL] service-account.json 을 찾을 수 없습니다: ${SERVICE_ACCOUNT_PATH}`);
  console.error('Firebase Console → 프로젝트 설정 → 서비스 계정 → 비공개 키 생성으로 받아 같은 폴더에 두세요.');
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function main() {
  const mode = EXECUTE ? 'EXECUTE' : 'DRY-RUN';
  console.log(`\n=== operator → admin 마이그레이션 (${mode}) ===\n`);

  const snap = await db.collection('user').get();
  const toMigrate = [];

  for (const doc of snap.docs) {
    const data = doc.data();
    const role = typeof data.role === 'string' ? data.role.toLowerCase() : '';
    if (role === 'operator') {
      toMigrate.push({
        id: doc.id,
        currentRole: data.role,
        email: data.email,
        realName: data.realName,
      });
    }
  }

  console.log(`전체 user 문서: ${snap.size}`);
  console.log(`마이그레이션 대상 (role==operator, 대/소문자 무관): ${toMigrate.length}\n`);

  if (toMigrate.length === 0) {
    console.log('대상 없음. 종료.');
    return;
  }

  toMigrate.forEach((u, i) => {
    console.log(`  [${i + 1}] ${u.id}  (${u.realName ?? '?'})  role: "${u.currentRole}" → "admin"`);
  });

  if (!EXECUTE) {
    console.log('\n드라이런 종료. 실제 실행: node migrate-operator-to-admin.js --execute');
    return;
  }

  console.log('\n실제 write 진행...');
  const BATCH = 100;
  for (let i = 0; i < toMigrate.length; i += BATCH) {
    const chunk = toMigrate.slice(i, i + BATCH);
    const batch = db.batch();
    for (const u of chunk) {
      batch.update(db.collection('user').doc(u.id), { role: 'admin' });
    }
    await batch.commit();
    console.log(`  - 커밋 완료: ${i + chunk.length}/${toMigrate.length}`);
  }

  console.log('\n✓ 마이그레이션 완료. Firebase Console에서 임의 1~2건 표본 확인 권장.');
}

main().catch((err) => {
  console.error('[FATAL]', err);
  process.exit(1);
});
