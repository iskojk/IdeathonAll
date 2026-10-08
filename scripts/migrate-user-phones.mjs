import assert from 'node:assert/strict';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const requireAPI = createRequire(new URL('../ideathon.api/package.json', import.meta.url));
const { MongoClient, BSON } = requireAPI('mongoose').mongo;
const { normalizePhone } = requireAPI('./src/services/entrepreneurPhone');
const env = requireAPI('dotenv').parse(readFileSync(new URL('../ideathon.api/.env', import.meta.url)));
assert.equal(env.MONGODB_URI, 'mongodb://127.0.0.1:27027/ideathon_local', 'Bu geçiş yalnızca yerel veritabanında çalışır.');
const client = new MongoClient(env.MONGODB_URI);
try {
  await client.connect();
  const users = client.db().collection('users');
  const originals = await users.find({}).sort({ _id: 1 }).toArray();
  const indexes = await users.indexes();
  const groups = new Map();
  for (const user of originals) {
    const phone = typeof user.phone === 'string' ? normalizePhone(user.phone) : null;
    if (!phone) continue;
    assert.ok(!user.phoneKey || user.phoneKey === phone, 'Mevcut telefon anahtarı uyuşmuyor; geçiş durduruldu.');
    if (!groups.has(phone)) groups.set(phone, []);
    groups.get(phone).push(user);
  }
  const changes = [];
  for (const [phone, group] of groups) {
    const owners = group.filter(user => user.phoneKey === phone);
    assert.ok(owners.length <= 1, 'Telefon tekilliği için birden fazla sahip bulundu.');
    if (!owners.length) changes.push({ updateOne: { filter: { _id: group[0]._id, phoneKey: { $exists: false } }, update: { $set: { phoneKey: phone } } } });
  }
  if (changes.length || !indexes.some(index => index.name === 'user_phone_unique')) {
    const directory = new URL('../.local/backups/', import.meta.url);
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    writeFileSync(new URL(`before-user-phone-uniqueness-${Date.now()}.bson`, directory), BSON.serialize({ documents: originals, indexes }), { mode: 0o600, flag: 'wx' });
    await users.createIndex({ phoneKey: 1 }, { name: 'user_phone_unique', unique: true, partialFilterExpression: { phoneKey: { $type: 'string' } } });
    if (changes.length) {
      const result = await users.bulkWrite(changes, { ordered: true });
      assert.equal(result.modifiedCount, changes.length);
    }
  }
  const after = await users.find({}).sort({ _id: 1 }).toArray();
  const omitKey = ({ phoneKey, ...record }) => record;
  assert.deepEqual(after.map(omitKey), originals.map(omitKey), 'Özgün kullanıcı bilgileri değişmemeli.');
  const keys = after.filter(user => typeof user.phoneKey === 'string').map(user => user.phoneKey);
  assert.equal(new Set(keys).size, keys.length);
  for (const phone of groups.keys()) assert.ok(keys.includes(phone), 'Eski telefon numarası yeni kayıtlara karşı ayrılmalı.');
  console.log(`OK: ${changes.length} telefon anahtarı eklendi; ${[...groups.values()].filter(group => group.length > 1).length} eski mükerrer grup korundu; özgün hesap bilgileri değişmedi.`);
} finally { await client.close(); }
