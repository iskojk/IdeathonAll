import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const requireAPI = createRequire(new URL('../ideathon.api/package.json', import.meta.url));
const { MongoClient, BSON } = requireAPI('mongoose').mongo;
const env = requireAPI('dotenv').parse(readFileSync(new URL('../ideathon.api/.env', import.meta.url)));
assert.equal(env.MONGODB_URI, 'mongodb://127.0.0.1:27027/ideathon_local', 'Bu geçiş yalnızca yerel veritabanında çalışır.');
const client = new MongoClient(env.MONGODB_URI);
try {
  await client.connect();
  const db = client.db('ideathon_local');
  const collection = db.collection('entrepreneurapplications');
  const indexes = await collection.indexes();
  const old = indexes.find(index => index.name === 'userId_1');
  if (old) {
    assert.equal(old.unique, true);
    assert.deepEqual(old.key, { userId: 1 });
    const names = (await db.listCollections({}, { nameOnly: true }).toArray()).map(item => item.name).filter(name => name.startsWith('entrepreneur'));
    const snapshot = [];
    for (const name of names) snapshot.push({ name, indexes: await db.collection(name).indexes(), documents: await db.collection(name).find({}).toArray() });
    const directory = new URL('../.local/backups/', import.meta.url);
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const filename = new URL(`before-entrepreneur-pool-${Date.now()}.bson`, directory);
    writeFileSync(filename, BSON.serialize({ collections: snapshot }), { mode: 0o600, flag: 'wx' });
    // Install the replacement first: account uniqueness remains enforced throughout.
    await collection.createIndex({ userId: 1 }, { name: 'entrepreneur_account_unique', unique: true, partialFilterExpression: { userId: { $type: 'objectId' } } });
    await collection.dropIndex(old.name);
    for (const item of snapshot) {
      const current = await db.collection(item.name).find({}).toArray();
      assert.deepEqual(current, item.documents, `${item.name}: belgeler değişmemeli`);
    }
    console.log('OK: Özel yedek alındı; hesap tekilliği korundu; girişimci belgeleri değişmedi.');
  } else {
    const desired = indexes.find(index => index.name === 'entrepreneur_account_unique');
    assert.equal(desired?.unique, true);
    assert.deepEqual(desired.partialFilterExpression, { userId: { $type: 'objectId' } });
    console.log('OK: Girişimci havuzu indeks geçişi zaten uygulanmış.');
  }
} finally { await client.close(); }
