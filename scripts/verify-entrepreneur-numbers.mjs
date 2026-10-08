import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
const r = createRequire(new URL('../ideathon.api/package.json', import.meta.url));
const env = r('dotenv').parse(readFileSync(new URL('../ideathon.api/.env', import.meta.url)));
assert.equal(env.MONGODB_URI, 'mongodb://127.0.0.1:27027/ideathon_local');
const mongoose = r('mongoose');
const dbName = `ideathon_local_number_qa_${randomBytes(6).toString('hex')}`;
await mongoose.connect(`mongodb://127.0.0.1:27027/${dbName}`);
const Application = r('./src/models/EntrepreneurApplication');
const Counter = r('./src/models/EntrepreneurApplicationCounter');
try {
  await Promise.all([Application.init(), Counter.init()]);
  const drafts = await Promise.all(Array.from({ length: 20 }, () => Application.create({ source: 'admin', form: { version: 1, title: 'İzole numara testi', questions: [], sections: [] }, status: 'draft' })));
  assert.equal(await Counter.countDocuments(), 0, 'Taslaklar numara tüketmemeli.');
  await Promise.all(drafts.map(app => { app.status = 'submitted'; app.submittedAt = new Date('2026-10-08T12:00:00Z'); return app.save(); }));
  assert.deepEqual(drafts.map(app => app.applicationNumber).sort(), Array.from({ length: 20 }, (_, index) => `AFZ26${String(index + 1).padStart(3, '0')}`));
  let app = await Application.findById(drafts[0]._id);
  const number = app.applicationNumber;
  app.editDraft = { answers: { changed: 'taslak' }, documents: [], startedAt: new Date() };
  await app.save();
  app.editDraft = undefined; app.answers = { changed: 'yeni' }; app.submittedAt = new Date('2027-02-01T10:00:00Z');
  await app.save(); assert.equal(app.applicationNumber, number, 'Düzenleme/iptal/yeniden gönderim numarayı değiştirmemeli.');
  app.applicationNumber = 'AFZ26099';
  await assert.rejects(app.save(), /Başvuru numarası değiştirilemez/);
  const nextYear = await Application.create({ source: 'admin', form: { version: 1, title: 'İzole numara testi', questions: [], sections: [] }, status: 'submitted', submittedAt: new Date('2026-12-31T21:00:00Z') });
  assert.equal(nextYear.applicationNumber, 'AFZ27001', 'Yıl sınırı Türkiye saatine göre olmalı.');
  await Counter.updateOne({ _id: '2027' }, { $set: { sequence: 999 } });
  const overflow = await Application.create({ source: 'admin', form: { version: 1, title: 'İzole numara testi', questions: [], sections: [] }, status: 'submitted', submittedAt: new Date('2027-02-01') });
  assert.equal(overflow.applicationNumber, 'AFZ271000', '999 sonrasında sayaç çakışmadan devam etmeli.');
  await assert.rejects(Application.create({ source: 'admin', form: { version: 1, title: 'İzole numara testi', questions: [], sections: [] }, status: 'submitted', applicationNumber: nextYear.applicationNumber }), error => error.code === 11000);
  console.log('OK: Taslaklar numarasız; paralel başvurular sıralı ve benzersiz; numara düzenleme/yeniden gönderimde sabit; yıl geçişi ve 999 sonrası doğru.');
} finally {
  assert.equal(mongoose.connection.name, dbName);
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  console.log('OK: İzole test veritabanı temizlendi; gerçek yerel başvuru sayacı kullanılmadı.');
}
