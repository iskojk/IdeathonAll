import { verificationTarget } from './verification-target.mjs';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { createHash, randomBytes } from 'node:crypto';
const r = createRequire(new URL('../ideathon.api/package.json', import.meta.url));
const env = r('dotenv').parse(readFileSync(new URL('../ideathon.api/.env', import.meta.url)));
assert.equal(env.MONGODB_URI, 'mongodb://127.0.0.1:27027/ideathon_local');
const target = verificationTarget(env.MONGODB_URI);
const mongoose = r('mongoose');
const User = r('./src/models/User');
const userIds = [];
const hash = value => createHash('sha256').update(mongoose.mongo.BSON.serialize(value)).digest('hex');
await mongoose.connect(target.mongoURI, { autoIndex: false });
const db = mongoose.connection.db;
const originals = new Map();
for (const name of ['users', 'entrepreneurapplications', 'entrepreneurdocuments', 'entrepreneurformsettings', 'entrepreneurformdrafts', 'entrepreneurapplicationcounters']) originals.set(name, await db.collection(name).find({}).toArray());
async function account(role) {
  const user = await User.create({ name: 'Geçici Yetki Kontrolü', email: `entrepreneur-access-${randomBytes(8).toString('hex')}@example.com`, password: randomBytes(24).toString('base64url'), role });
  userIds.push(user._id);
  return { user, token: r('jsonwebtoken').sign({ userId: String(user._id), role }, env.JWT_SECRET, { expiresIn: '10m' }) };
}
async function request(path, who, method = 'GET', body, expected = 200) {
  const response = await fetch(`${target.apiOrigin}/api/entrepreneurs/admin${path}`, { method, headers: { Authorization: `Bearer ${who.token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20000) });
  assert.equal(response.status, expected, `${method} ${path}: beklenen ${expected}, gelen ${response.status}`);
  return response.headers.get('content-type')?.includes('application/json') ? response.json() : response;
}
try {
  const admin = await account('admin'), superadmin = await account('superadmin');
  const list = await request('', admin);
  assert.ok(list.data.length, 'Yetki kontrolü için mevcut yerel başvuru bulunmalı.');
  const app = list.data[0];
  assert.match(app.applicationNumber, /^AFZ\d{2}\d{3,}$/);
  const detail = (await request(`/${app._id}`, admin)).data;
  assert.equal(detail.applicationNumber, app.applicationNumber);
  await request(`/${app._id}/export?format=pdf`, admin);
  if (detail.documents.length) await request(`/${app._id}/documents/${detail.documents[0]._id}`, admin);
  const denied = [
    ['', 'POST', {}], [`/${app._id}`, 'PUT', { revision: -1 }],
    [`/${app._id}/archive`, 'POST', { revision: -1 }], [`/${app._id}/restore`, 'POST', { revision: -1 }],
    ['/import/preview', 'POST', {}], [`/${app._id}/view`, 'POST', {}], [`/${app._id}/review`, 'POST', {}],
    ['/form', 'PUT', {}], ['/form/publish', 'POST', {}], ['/form/drafts', 'POST', {}],
    [`/form/drafts/${app._id}/delete`, 'POST', {}], [`/form/drafts/${app._id}/restore`, 'POST', {}],
    ['/form/drafts?view=deleted', 'GET'],
  ];
  for (const [path, method, body] of denied) await request(path, admin, method, body, 403);
  await request('', superadmin, 'POST', {}, 422);
  await request(`/${app._id}`, superadmin, 'PUT', { revision: -1 }, 409);
  await request(`/${app._id}/archive`, superadmin, 'POST', { revision: -1 }, 409);
  // A previously issued superadmin token must not retain write rights after demotion.
  await User.updateOne({ _id: superadmin.user._id }, { $set: { role: 'admin' } });
  await request(`/${app._id}`, superadmin);
  for (const [path, method, body] of denied) await request(path, superadmin, method, body, 403);
  console.log('OK: Admin liste/detay/PDF/evrak okuyabilir; tüm havuz ve soru seti yazma yolları 403; süperadmin erişebilir; rol düşürülünce eski token yazamaz.');
} finally {
  await User.deleteMany({ _id: { $in: userIds } });
  try {
    for (const [name, before] of originals) {
      const after = await db.collection(name).find({}).toArray();
      assert.equal(after.length, before.length, `${name}: test kayıtları temizlenmeli.`);
      const hashes = new Map(after.map(item => [String(item._id), hash(item)]));
      for (const item of before) assert.equal(hashes.get(String(item._id)), hash(item), `${name}: özgün içerik değişmemeli.`);
    }
    console.log('OK: Geçici hesaplar temizlendi; mevcut veriler ve gerçek başvuru numarası sayacı birebir korundu.');
  } finally { await mongoose.disconnect(); }
}
