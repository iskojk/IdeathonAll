import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const r = createRequire(new URL('../ideathon.api/package.json', import.meta.url));
const { MongoClient, BSON } = r('mongoose').mongo;
const { applicationYear, formatApplicationNumber } = r('./src/services/entrepreneurApplicationNumber');
const env = r('dotenv').parse(readFileSync(new URL('../ideathon.api/.env', import.meta.url)));
assert.equal(env.MONGODB_URI, 'mongodb://127.0.0.1:27027/ideathon_local', 'Geçiş yalnızca yerel veritabanında çalışır.');
const client = new MongoClient(env.MONGODB_URI);
try {
  await client.connect();
  const applications = client.db().collection('entrepreneurapplications');
  const counters = client.db().collection('entrepreneurapplicationcounters');
  const originals = await applications.find({}).sort({ _id: 1 }).toArray();
  const previousCounters = await counters.find({}).toArray();
  const indexes = await applications.indexes();
  const sequences = new Map(previousCounters.map(item => [Number(item._id), item.sequence]));
  const taken = new Set();
  for (const app of originals) {
    if (!app.applicationNumber) continue;
    assert.match(app.applicationNumber, /^AFZ\d{2}\d{3,}$/);
    assert.ok(!taken.has(app.applicationNumber), 'Mevcut numaralar mükerrer; geçiş durduruldu.');
    taken.add(app.applicationNumber);
    const year = 2000 + Number(app.applicationNumber.slice(3, 5));
    const sequence = Number(app.applicationNumber.slice(5));
    assert.ok(Number.isSafeInteger(sequence) && sequence > 0);
    sequences.set(year, Math.max(sequences.get(year) || 0, sequence));
  }
  const pending = originals.filter(app => app.status === 'submitted' && !app.applicationNumber).sort((a, b) => {
    const aTime = new Date(a.submittedAt || a.createdAt).getTime();
    const bTime = new Date(b.submittedAt || b.createdAt).getTime();
    return aTime - bTime || String(a._id).localeCompare(String(b._id));
  });
  const changes = pending.map(app => {
    const year = applicationYear(app.submittedAt || app.createdAt);
    const sequence = (sequences.get(year) || 0) + 1;
    sequences.set(year, sequence);
    return { updateOne: { filter: { _id: app._id, applicationNumber: null }, update: { $set: { applicationNumber: formatApplicationNumber(year, sequence) } } } };
  });
  const counterChanges = [...sequences].filter(([year, sequence]) => previousCounters.find(item => item._id === String(year))?.sequence !== sequence);
  if (changes.length || counterChanges.length || !indexes.some(item => item.name === 'entrepreneur_number_unique')) {
    const directory = new URL('../.local/backups/', import.meta.url);
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    writeFileSync(new URL(`before-entrepreneur-numbers-${Date.now()}.bson`, directory), BSON.serialize({ applications: originals, applicationIndexes: indexes, counters: previousCounters }), { flag: 'wx', mode: 0o600 });
    await applications.createIndex({ applicationNumber: 1 }, { name: 'entrepreneur_number_unique', unique: true, partialFilterExpression: { applicationNumber: { $type: 'string' } } });
    for (const [year, sequence] of counterChanges) await counters.updateOne({ _id: String(year) }, { $max: { sequence } }, { upsert: true });
    if (changes.length) assert.equal((await applications.bulkWrite(changes, { ordered: true })).modifiedCount, changes.length);
  }
  const after = await applications.find({}).sort({ _id: 1 }).toArray();
  const omit = ({ applicationNumber, ...app }) => app;
  assert.deepEqual(after.map(omit), originals.map(omit), 'Özgün başvuru içerikleri, tarihleri ve sürümleri değişmemeli.');
  const numbered = after.filter(app => app.status === 'submitted');
  assert.ok(numbered.every(app => app.applicationNumber));
  assert.equal(new Set(numbered.map(app => app.applicationNumber)).size, numbered.length);
  console.log(`OK: ${changes.length} başvuru tarihe göre numaralandırıldı; taslaklar, yanıtlar, evrak referansları ve özgün tarihler korundu.`);
} finally { await client.close(); }
