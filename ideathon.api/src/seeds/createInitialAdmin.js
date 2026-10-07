const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const createInitialAdmin = async () => {
  try {
    const email = process.env.INITIAL_ADMIN_EMAIL?.trim();
    const password = process.env.INITIAL_ADMIN_PASSWORD;
    if (!email || !password || password.length < 12) {
      throw new Error('INITIAL_ADMIN_EMAIL ve en az 12 karakterli INITIAL_ADMIN_PASSWORD ortam değişkenlerini tanımlayın.');
    }
    // MongoDB bağlantısı
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı');

    // Zaten superadmin var mı kontrol et
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });

    if (existingSuperAdmin) {
      console.log('⚠️  Superadmin zaten mevcut:', existingSuperAdmin.email);
      process.exit(0);
    }

    // İlk superadmin oluştur
    const initialAdmin = new User({
      name: 'Super Administrator',
      email,
      password,
      role: 'superadmin',
      isActive: true,
      createdBy: null // Sistem tarafından oluşturuldu
    });

    await initialAdmin.save();

    console.log('🎉 İlk superadmin başarıyla oluşturuldu!');
    console.log('📧 Email:', email);
    console.log('⚠️  LÜTFEN İLK GİRİŞ SONRASINDA ŞİFREYİ DEĞIŞTIRIN!');

  } catch (error) {
    console.error('❌ Hata oluştu:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB bağlantısı kapatıldı');
  }
};

// Script çalıştır
if (require.main === module) {
  createInitialAdmin();
}

module.exports = createInitialAdmin;












