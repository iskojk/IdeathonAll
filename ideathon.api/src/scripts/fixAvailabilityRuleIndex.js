/**
 * Migration Script: Fix AvailabilityRule Unique Index
 * 
 * SORUN: Eski unique index tüm kayıtlar için (isActive:true ve false) unique constraint uyguluyor
 * ÇÖZÜM: Partial unique index - sadece isActive:true olanlar için unique
 * 
 * KULLANIM:
 * node src/scripts/fixAvailabilityRuleIndex.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const fixIndex = async () => {
  try {
    console.log('🔧 Index düzeltme işlemi başlatılıyor...\n');

    // MongoDB'ye bağlan
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı\n');

    const db = mongoose.connection.db;
    const collection = db.collection('availabilityrules');

    // Mevcut index'leri listele
    console.log('📋 Mevcut index\'ler:');
    const existingIndexes = await collection.indexes();
    existingIndexes.forEach(idx => {
      console.log(`  - ${idx.name}`, idx.key);
      if (idx.unique) console.log('    ⚠️  UNIQUE');
      if (idx.partialFilterExpression) console.log('    ✅ PARTIAL:', idx.partialFilterExpression);
    });
    console.log('');

    // Eski unique index'i bul
    const oldIndexName = 'mentorUserId_1_dayOfWeek_1_startTime_1_endTime_1';
    const oldIndexExists = existingIndexes.some(idx => idx.name === oldIndexName);

    if (oldIndexExists) {
      console.log(`🗑️  Eski index (${oldIndexName}) siliniyor...`);
      await collection.dropIndex(oldIndexName);
      console.log('✅ Eski index silindi\n');
    } else {
      console.log('ℹ️  Eski index bulunamadı (zaten silinmiş olabilir)\n');
    }

    // Yeni partial index'i oluştur
    console.log('🔨 Yeni partial unique index oluşturuluyor...');
    await collection.createIndex(
      { mentorUserId: 1, dayOfWeek: 1, startTime: 1, endTime: 1 },
      { 
        unique: true,
        name: 'mentorUserId_1_dayOfWeek_1_startTime_1_endTime_1',
        partialFilterExpression: { isActive: true }
      }
    );
    console.log('✅ Yeni partial index oluşturuldu\n');

    // Güncel index'leri göster
    console.log('📋 Güncel index\'ler:');
    const newIndexes = await collection.indexes();
    newIndexes.forEach(idx => {
      console.log(`  - ${idx.name}`, idx.key);
      if (idx.unique) console.log('    ✅ UNIQUE');
      if (idx.partialFilterExpression) console.log('    ✅ PARTIAL:', idx.partialFilterExpression);
    });
    console.log('');

    // Test: Aynı gün/saatte pasif kural var mı?
    const testData = await collection.find({ isActive: false }).toArray();
    if (testData.length > 0) {
      console.log(`📊 Veritabanında ${testData.length} pasif kural bulundu:`);
      testData.forEach(rule => {
        console.log(`  - ID: ${rule._id}`);
        console.log(`    Gün: ${rule.dayOfWeek}, Saat: ${rule.startTime}-${rule.endTime}`);
        console.log(`    isActive: ${rule.isActive}`);
      });
      console.log('\n✨ Artık bu gün/saatlerde yeni aktif kurallar oluşturabilirsiniz!\n');
    } else {
      console.log('ℹ️  Veritabanında pasif kural bulunamadı\n');
    }

    console.log('✅ Index düzeltme işlemi tamamlandı!');
    console.log('🔄 Backend\'i yeniden başlatın: npm run dev\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Hata oluştu:', error.message);
    console.error(error);
    process.exit(1);
  }
};

fixIndex();












































