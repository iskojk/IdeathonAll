const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const path = require('path');
require('dotenv').config();

const Application = require('../models/Application');

async function exportApplicantsSimple() {
  try {
    console.log('MongoDB\'ye bağlanılıyor...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı\n');

    // İptal edilenler hariç tüm başvuruları getir
    console.log('Başvurular getiriliyor...');
    const applications = await Application.find({
      status: { $ne: 'withdrawn' } // withdrawn (iptal edilmiş) olanlar hariç
    })
      .select('personalInfo.firstName personalInfo.lastName personalInfo.email status')
      .sort({ createdAt: -1 });

    console.log(`✅ ${applications.length} başvuru bulundu\n`);

    if (applications.length === 0) {
      console.log('⚠️  Dışa aktarılacak başvuru bulunamadı.');
      await mongoose.connection.close();
      return;
    }

    // Workbook ve worksheet oluştur
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Başvuranlar');

    // Başlıkları ayarla
    worksheet.columns = [
      { header: 'Sıra', key: 'sira', width: 8 },
      { header: 'Ad', key: 'ad', width: 20 },
      { header: 'Soyad', key: 'soyad', width: 20 },
      { header: 'E-posta', key: 'email', width: 35 }
    ];

    // Başlık satırını stillendir
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };

    // Verileri ekle
    applications.forEach((app, index) => {
      worksheet.addRow({
        sira: index + 1,
        ad: app.personalInfo?.firstName || '',
        soyad: app.personalInfo?.lastName || '',
        email: app.personalInfo?.email || ''
      });
    });

    // Dosya adı (tarih ile)
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    const fileName = `Basvuranlar_${dateStr}.xlsx`;
    const filePath = path.join(__dirname, '../../', fileName);

    // Excel dosyasını kaydet
    await workbook.xlsx.writeFile(filePath);

    console.log('✅ Excel dosyası başarıyla oluşturuldu!');
    console.log(`📄 Dosya: ${fileName}`);
    console.log(`📁 Konum: ${filePath}`);
    console.log(`👥 Toplam: ${applications.length} başvuran\n`);

    // İstatistik
    const stats = {
      pending: applications.filter(a => a.status === 'pending').length,
      under_review: applications.filter(a => a.status === 'under_review').length,
      approved: applications.filter(a => a.status === 'approved').length,
      rejected: applications.filter(a => a.status === 'rejected').length
    };

    console.log('📊 Durum İstatistikleri:');
    console.log(`   Bekliyor: ${stats.pending}`);
    console.log(`   İnceleniyor: ${stats.under_review}`);
    console.log(`   Onaylandı: ${stats.approved}`);
    console.log(`   Reddedildi: ${stats.rejected}\n`);

    await mongoose.connection.close();
    console.log('✅ MongoDB bağlantısı kapatıldı');

  } catch (error) {
    console.error('❌ Hata:', error.message);
    console.error(error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Script'i çalıştır
exportApplicantsSimple();

