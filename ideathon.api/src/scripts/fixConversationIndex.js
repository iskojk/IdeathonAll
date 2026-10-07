/**
 * Script: Conversation model için yanlış index'i düzelt ve participantsKey oluştur
 * 
 * Sorun: MongoDB multikey index, participants array'inin her elemanı için ayrı index oluşturuyor
 * Çözüm: participantsKey field'ı ekleyip, ona unique index koyuyoruz
 * 
 * Bu script:
 * 1. Eski yanlış index'i drop eder (participants_1_type_1)
 * 2. Mevcut tüm conversation'lar için participantsKey generate eder
 * 3. Yeni index'in oluşmasını bekler (model'de tanımlı)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');

async function fixConversationIndex() {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/emlak';
    console.log('🔌 MongoDB\'ye bağlanılıyor...');
    console.log('   URI:', MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // hide credentials
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Bağlantı başarılı\n');

    // 1. Mevcut index'leri listele
    console.log('📋 Mevcut index\'ler:');
    const indexes = await Conversation.collection.getIndexes();
    console.log(JSON.stringify(indexes, null, 2));
    console.log('');

    // 2. Eski yanlış index'i drop et
    console.log('🗑️  Eski index\'i drop ediliyor: participants_1_type_1');
    try {
      await Conversation.collection.dropIndex('participants_1_type_1');
      console.log('✅ Eski index drop edildi\n');
    } catch (error) {
      if (error.code === 27 || error.message.includes('index not found')) {
        console.log('ℹ️  Index zaten yok (normal)\n');
      } else {
        throw error;
      }
    }

    // 3. Tüm conversation'lar için participantsKey oluştur
    console.log('🔄 Mevcut conversation\'lar için participantsKey oluşturuluyor...');
    const conversations = await Conversation.find({ type: 'mentor_participant' });
    console.log(`📊 Toplam ${conversations.length} mentor_participant konuşma bulundu\n`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const conv of conversations) {
      // participantsKey zaten varsa skip et
      if (conv.participantsKey) {
        console.log(`⏭️  ${conv._id}: participantsKey zaten var (${conv.participantsKey})`);
        skippedCount++;
        continue;
      }

      // participants'ları sırala ve birleştir
      const sorted = [...conv.participants].sort((a, b) => 
        a.toString().localeCompare(b.toString())
      );
      const participantsKey = sorted.join('_');

      // Güncelle
      conv.participantsKey = participantsKey;
      await conv.save();

      console.log(`✅ ${conv._id}: participantsKey oluşturuldu (${participantsKey})`);
      updatedCount++;
    }

    console.log('\n📊 İşlem Özeti:');
    console.log(`   Güncellenen: ${updatedCount}`);
    console.log(`   Atlanan: ${skippedCount}`);
    console.log(`   Toplam: ${conversations.length}`);

    // 4. Yeni index'leri listele
    console.log('\n📋 Yeni index\'ler:');
    const newIndexes = await Conversation.collection.getIndexes();
    console.log(JSON.stringify(newIndexes, null, 2));

    console.log('\n✅ Tüm işlemler tamamlandı!');
    console.log('ℹ️  Sunucuyu yeniden başlatın ki yeni index\'ler aktif olsun.');

  } catch (error) {
    console.error('\n❌ Hata:', error);
    throw error;
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB bağlantısı kapatıldı');
  }
}

// Script'i çalıştır
if (require.main === module) {
  fixConversationIndex()
    .then(() => {
      console.log('\n✅ Script başarıyla tamamlandı');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script hatası:', error);
      process.exit(1);
    });
}

module.exports = fixConversationIndex;

