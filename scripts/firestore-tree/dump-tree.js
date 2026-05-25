#!/usr/bin/env node
/**
 * Firestore 트리 덤프 스크립트.
 *
 * firebase-admin으로 실제 DB에 붙어서 루트 컬렉션부터 재귀적으로
 * 컬렉션 → 샘플 문서 → 서브컬렉션을 걸어 다니며 구조를 파일로 저장한다.
 *
 * 필요: Firebase 콘솔 → 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성
 *       으로 받은 service-account.json.
 *
 * 사용 예:
 *   node dump-tree.js --service-account ./service-account.json
 *   GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node dump-tree.js
 *   node dump-tree.js --samples 10 --values --output ./snapshot
 *
 * 옵션:
 *   --service-account <path>  기본: $GOOGLE_APPLICATION_CREDENTIALS 또는 ./service-account.json
 *   --samples <n>             컬렉션당 샘플할 문서 수 (기본 5)
 *   --max-depth <n>           재귀 최대 깊이 (기본 10)
 *   --output <base>           출력 파일 접두사 (기본 ./firestore-tree → .json / .md)
 *   --values                  필드 샘플 값까지 포함 (민감정보 주의)
 *   --only <coll1,coll2>      해당 루트 컬렉션만 스캔
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// ---------- CLI ----------
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const idx = args.indexOf(name);
  return idx >= 0 && args[idx + 1] !== undefined ? args[idx + 1] : fallback;
};
const hasFlag = (name) => args.includes(name);

const SERVICE_ACCOUNT = flag(
  '--service-account',
  process.env.GOOGLE_APPLICATION_CREDENTIALS || './service-account.json'
);
const SAMPLES = parseInt(flag('--samples', '5'), 10);
const MAX_DEPTH = parseInt(flag('--max-depth', '10'), 10);
const OUTPUT_BASE = flag('--output', './firestore-tree');
const INCLUDE_VALUES = hasFlag('--values');
const ONLY = flag('--only', null);
const ONLY_LIST = ONLY ? ONLY.split(',').map((s) => s.trim()) : null;

// ---------- Init ----------
const serviceAccountPath = path.resolve(SERVICE_ACCOUNT);
if (!fs.existsSync(serviceAccountPath)) {
  console.error(`[error] 서비스 계정 파일을 찾을 수 없다: ${serviceAccountPath}`);
  console.error(`        --service-account <path> 로 지정하거나`);
  console.error(`        GOOGLE_APPLICATION_CREDENTIALS 환경변수를 설정해라.`);
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(require(serviceAccountPath))
});

const db = admin.firestore();

// ---------- Helpers ----------
function inferType(value) {
  if (value === null || value === undefined) return 'null';
  if (Array.isArray(value)) {
    if (value.length === 0) return 'array<empty>';
    const inner = new Set(value.slice(0, 5).map(inferType));
    return `array<${[...inner].join('|')}>`;
  }
  if (value instanceof admin.firestore.Timestamp) return 'Timestamp';
  if (value instanceof admin.firestore.DocumentReference) return 'DocumentReference';
  if (value instanceof admin.firestore.GeoPoint) return 'GeoPoint';
  if (Buffer.isBuffer(value)) return 'Bytes';
  if (typeof value === 'object') {
    const keys = Object.keys(value);
    if (keys.length === 0) return 'map<empty>';
    return `map<${keys.length}>`;
  }
  return typeof value;
}

function sampleValue(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof admin.firestore.Timestamp) return value.toDate().toISOString();
  if (value instanceof admin.firestore.DocumentReference) return `ref:${value.path}`;
  if (value instanceof admin.firestore.GeoPoint) return `geo:${value.latitude},${value.longitude}`;
  if (Buffer.isBuffer(value)) return `bytes(${value.length})`;
  if (Array.isArray(value)) return value.slice(0, 2).map(sampleValue);
  if (typeof value === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(value).slice(0, 5)) out[k] = sampleValue(v);
    return out;
  }
  if (typeof value === 'string' && value.length > 80) return value.slice(0, 77) + '...';
  return value;
}

function mergeFields(agg, data) {
  for (const [key, val] of Object.entries(data)) {
    if (!agg[key]) agg[key] = { types: new Set(), sample: undefined };
    agg[key].types.add(inferType(val));
    if (INCLUDE_VALUES && agg[key].sample === undefined && val !== null && val !== undefined) {
      agg[key].sample = sampleValue(val);
    }
  }
}

// ---------- Walk ----------
async function walkCollection(collRef, depth, displayPath) {
  if (depth > MAX_DEPTH) return { truncated: true };

  const indent = '  '.repeat(depth);
  console.log(`${indent}↳ ${displayPath} (sampling ${SAMPLES})`);

  let docCount = null;
  try {
    const countSnap = await collRef.count().get();
    docCount = countSnap.data().count;
  } catch (err) {
    console.log(`${indent}  (count failed: ${err.message})`);
  }

  let snapshot;
  try {
    snapshot = await collRef.limit(SAMPLES).get();
  } catch (err) {
    console.log(`${indent}  (read failed: ${err.message})`);
    return { docCount, error: err.message };
  }

  const fields = {};
  const sampleDocIds = [];
  const subcollections = {};

  for (const docSnap of snapshot.docs) {
    sampleDocIds.push(docSnap.id);
    const data = docSnap.data();
    if (data) mergeFields(fields, data);

    let subs;
    try {
      subs = await docSnap.ref.listCollections();
    } catch (err) {
      console.log(`${indent}  (listCollections failed on ${docSnap.id}: ${err.message})`);
      continue;
    }

    for (const sub of subs) {
      if (subcollections[sub.id]) continue;
      subcollections[sub.id] = await walkCollection(
        sub,
        depth + 1,
        `${displayPath}/${docSnap.id}/${sub.id}`
      );
    }
  }

  return {
    docCount,
    sampleDocIds,
    fields: Object.fromEntries(
      Object.entries(fields).map(([k, v]) => [
        k,
        INCLUDE_VALUES ? { types: [...v.types], sample: v.sample } : [...v.types]
      ])
    ),
    subcollections
  };
}

// ---------- Render ----------
function renderMarkdown(tree, meta) {
  const lines = [
    '# Firestore Tree Snapshot',
    '',
    `- Generated: ${meta.generatedAt}`,
    `- Project: ${meta.projectId}`,
    `- Samples per collection: ${meta.samples}`,
    `- Values included: ${meta.includeValues}`,
    ''
  ];

  function renderColl(name, data, depth, pathStr) {
    const indent = '  '.repeat(depth);
    const count =
      data.docCount !== null && data.docCount !== undefined ? ` _(${data.docCount} docs)_` : '';
    lines.push(`${indent}- **\`${pathStr}\`**${count}`);
    if (data.truncated) {
      lines.push(`${indent}  - _truncated: max depth reached_`);
      return;
    }
    if (data.error) {
      lines.push(`${indent}  - _error: ${data.error}_`);
      return;
    }
    if (data.sampleDocIds && data.sampleDocIds.length) {
      lines.push(`${indent}  - sample IDs: ${data.sampleDocIds.map((id) => `\`${id}\``).join(', ')}`);
    }
    if (data.fields && Object.keys(data.fields).length) {
      lines.push(`${indent}  - fields:`);
      for (const [k, v] of Object.entries(data.fields)) {
        if (Array.isArray(v)) {
          lines.push(`${indent}    - \`${k}\`: ${v.join(' | ')}`);
        } else {
          const types = v.types.join(' | ');
          const sample =
            v.sample !== undefined ? ` — ex: \`${JSON.stringify(v.sample)}\`` : '';
          lines.push(`${indent}    - \`${k}\`: ${types}${sample}`);
        }
      }
    }
    if (data.subcollections && Object.keys(data.subcollections).length) {
      for (const [subName, subData] of Object.entries(data.subcollections)) {
        renderColl(subName, subData, depth + 1, `${pathStr}/{id}/${subName}`);
      }
    }
  }

  for (const [name, data] of Object.entries(tree)) {
    renderColl(name, data, 0, `/${name}`);
    lines.push('');
  }
  return lines.join('\n');
}

// ---------- Main ----------
(async () => {
  const projectId =
    admin.app().options.credential?.projectId ||
    require(serviceAccountPath).project_id ||
    'unknown';

  console.log(`Project: ${projectId}`);
  console.log('Listing root collections...');
  let rootCollections = await db.listCollections();
  console.log(
    `Found ${rootCollections.length} root collection(s): ${rootCollections
      .map((c) => c.id)
      .join(', ')}`
  );

  if (ONLY_LIST) {
    rootCollections = rootCollections.filter((c) => ONLY_LIST.includes(c.id));
    console.log(`Filtered to: ${rootCollections.map((c) => c.id).join(', ')}`);
  }

  const tree = {};
  for (const coll of rootCollections) {
    console.log(`\nScanning /${coll.id}...`);
    tree[coll.id] = await walkCollection(coll, 0, `/${coll.id}`);
  }

  const meta = {
    generatedAt: new Date().toISOString(),
    projectId,
    samples: SAMPLES,
    includeValues: INCLUDE_VALUES
  };

  const jsonPath = path.resolve(`${OUTPUT_BASE}.json`);
  const mdPath = path.resolve(`${OUTPUT_BASE}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify({ meta, tree }, null, 2));
  fs.writeFileSync(mdPath, renderMarkdown(tree, meta));

  console.log(`\nDone.`);
  console.log(`  JSON: ${jsonPath}`);
  console.log(`  Markdown: ${mdPath}`);
  process.exit(0);
})().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
