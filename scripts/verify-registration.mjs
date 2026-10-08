import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash, randomBytes } from 'node:crypto';
const r = createRequire(new URL('../ideathon.api/package.json', import.meta.url));
const env = r('dotenv').parse(readFileSync(new URL('../ideathon.api/.env', import.meta.url)));
assert.equal(env.MONGODB_URI, 'mongodb://127.0.0.1:27027/ideathon_local');
const { MongoClient, BSON } = r('mongoose').mongo;
const client = new MongoClient(env.MONGODB_URI);
const prefix = `registration-check-${randomBytes(8).toString('hex')}`;
const password = randomBytes(24).toString('base64url');
const phone = () => '05' + Array.from(randomBytes(9), n => n % 10).join('');
const hash = value => createHash('sha256').update(BSON.serialize(value)).digest('hex');
async function register(name, tel, email = `${prefix}-${name}@example.com`) {
  const response = await fetch('http://127.0.0.1:5010/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Geçici Kayıt Kontrolü', email, password, phone: tel, entrepreneur: true }), signal: AbortSignal.timeout(20000) });
  return { status: response.status, body: await response.json() };
}
await client.connect();
const users = client.db().collection('users');
const originals = await users.find({}).toArray();
try {
  const missing = await register('missing');
  assert.equal(missing.status, 400); assert.match(missing.body.message, /Telefon numarası zorunludur/);
  const invalid = await register('invalid', '123');
  assert.equal(invalid.status, 400); assert.match(invalid.body.message, /Geçerli bir telefon/);
  const number = phone();
  const first = await register('first', number);
  assert.equal(first.status, 201); assert.ok(first.body.data.token);
  const duplicatePhone = await register('duplicate-phone', '+90' + number.slice(1));
  assert.equal(duplicatePhone.status, 409); assert.equal(duplicatePhone.body.message, 'Daha önce bu telefon numarası kullanılmıştır.');
  const duplicateEmail = await register('duplicate-email', phone(), ` ${prefix}-FIRST@EXAMPLE.COM `);
  assert.equal(duplicateEmail.status, 409); assert.equal(duplicateEmail.body.message, 'Daha önce bu e-posta adresi kullanılmıştır.');
  const contestedPhone = phone();
  const race = await Promise.all([register('race-a', contestedPhone), register('race-b', contestedPhone)]);
  assert.deepEqual(race.map(item => item.status).sort(), [201, 409]);
  assert.equal(race.find(item => item.status === 409).body.message, 'Daha önce bu telefon numarası kullanılmıştır.');
  const existing = originals.find(item => item.phoneKey);
  assert.ok(existing);
  const historic = await register('historic', existing.phoneKey);
  assert.equal(historic.status, 409); assert.match(historic.body.message, /telefon numarası kullanılmıştır/);
  assert.equal(await users.countDocuments({ email: { $regex: `^${prefix}-` } }), 2);
  console.log('OK: Zorunlu/geçerli telefon, eski numara, farklı telefon yazılışları, e-posta tekilliği ve eşzamanlı çift kayıt engeli doğrulandı.');
} finally {
  await users.deleteMany({ email: { $regex: `^${prefix}-` } });
  for (const original of originals) assert.equal(hash(await users.findOne({ _id: original._id })), hash(original), 'Mevcut kullanıcı bilgileri değişmemeli.');
  assert.equal(await users.countDocuments({}), originals.length);
  await client.close();
  console.log('OK: Geçici kayıtlar temizlendi; özgün kullanıcılar korundu.');
}
