require('dotenv').config();
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const path = require('path');
const Application = require('../models/Application');
const User = require('../models/User');

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı');
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:', error.message);
    process.exit(1);
  }
};

// Tarih formatı
const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('tr-TR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric'
  });
};

// Excel'i oluştur - SADECE ONAYLANMIŞ BAŞVURULAR
const createApprovedApplicantsExcel = async () => {
  try {
    console.log('📊 Onaylanmış Başvurular Excel dosyası oluşturuluyor...\n');

    // Sadece onaylanmış (approved) başvuruları çek
    const applications = await Application.find({ status: 'approved' })
      .populate('userId', 'name email')
      .sort({ 'personalInfo.firstName': 1, 'personalInfo.lastName': 1 }) // Ad soyada göre sırala
      .lean();

    console.log(`✅ ${applications.length} onaylanmış başvuru bulundu\n`);

    if (applications.length === 0) {
      console.log('⚠️  Henüz onaylanmış başvuru bulunmamaktadır.');
      await mongoose.connection.close();
      process.exit(0);
    }

    // Excel workbook oluştur
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Emlak Konut - Ideathon';
    workbook.created = new Date();
    workbook.modified = new Date();
    workbook.company = 'Emlak Konut';
    
    // Worksheet oluştur - Şık ve profesyonel isim
    const worksheet = workbook.addWorksheet('Onaylı Katılımcılar', {
      properties: { 
        tabColor: { argb: 'FF10B981' } // Yeşil tab (onaylı anlamında)
      },
      views: [{ 
        state: 'frozen', 
        xSplit: 0, 
        ySplit: 1, // İlk satırı dondur
        showGridLines: true 
      }]
    });

    // Kolonlar - Sadece önemli bilgiler, sade ve temiz
    const columns = [
      { header: 'NO', key: 'rowNumber', width: 8 },
      { header: 'AD', key: 'firstName', width: 20 },
      { header: 'SOYAD', key: 'lastName', width: 20 },
      { header: 'TELEFON', key: 'phone', width: 20 },
      { header: 'E-POSTA', key: 'email', width: 35 }
    ];

    worksheet.columns = columns;

    // Başlık satırı - Çok şık ve profesyonel tasarım
    const headerRow = worksheet.getRow(1);
    headerRow.height = 35;
    headerRow.font = { 
      name: 'Arial', 
      size: 13, 
      bold: true, 
      color: { argb: 'FFFFFFFF' } // Beyaz yazı
    };
    
    // Gradient yeşil arka plan (onaylı teması)
    headerRow.fill = {
      type: 'gradient',
      gradient: 'angle',
      degree: 90,
      stops: [
        { position: 0, color: { argb: 'FF059669' } },  // Koyu yeşil
        { position: 1, color: { argb: 'FF10B981' } }   // Açık yeşil
      ]
    };
    
    headerRow.alignment = { 
      vertical: 'middle', 
      horizontal: 'center',
      wrapText: true
    };
    
    // Başlık kenarlığı
    headerRow.border = {
      top: { style: 'medium', color: { argb: 'FF059669' } },
      left: { style: 'thin', color: { argb: 'FF059669' } },
      bottom: { style: 'medium', color: { argb: 'FF059669' } },
      right: { style: 'thin', color: { argb: 'FF059669' } }
    };

    // Data satırları ekle
    applications.forEach((app, index) => {
      const row = worksheet.addRow({
        rowNumber: index + 1,
        firstName: app.personalInfo?.firstName || '',
        lastName: app.personalInfo?.lastName || '',
        phone: app.personalInfo?.phone || '',
        email: app.personalInfo?.email || ''
      });

      // Satır stili - Modern ve okunabilir
      row.height = 28;
      row.font = { 
        name: 'Arial', 
        size: 11
      };
      row.alignment = { 
        vertical: 'middle', 
        horizontal: 'left'
      };

      // Alternatif satır renkleri - Çok şık zebra striping
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0FDF4' } // Çok açık yeşil
        };
      } else {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFFF' } // Beyaz
        };
      }

      // Zarif kenarlıklar
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFD1FAE5' } },
          left: { style: 'thin', color: { argb: 'FFD1FAE5' } },
          bottom: { style: 'thin', color: { argb: 'FFD1FAE5' } },
          right: { style: 'thin', color: { argb: 'FFD1FAE5' } }
        };
      });

      // NO (Sıra numarası) hücresi - Ortalanmış ve bold
      const rowNumberCell = row.getCell('rowNumber');
      rowNumberCell.alignment = { vertical: 'middle', horizontal: 'center' };
      rowNumberCell.font = { 
        bold: true, 
        color: { argb: 'FF059669' },
        name: 'Arial',
        size: 12
      };

      // Ad ve Soyad - Bold ve koyu renk
      const firstNameCell = row.getCell('firstName');
      const lastNameCell = row.getCell('lastName');
      [firstNameCell, lastNameCell].forEach(cell => {
        cell.font = { 
          bold: true, 
          color: { argb: 'FF1F2937' },
          name: 'Arial',
          size: 11
        };
      });

      // Telefon - Ortalanmış
      const phoneCell = row.getCell('phone');
      phoneCell.alignment = { vertical: 'middle', horizontal: 'center' };
      phoneCell.font = { 
        name: 'Arial',
        size: 11,
        color: { argb: 'FF374151' }
      };

      // Email - Mavi ve hyperlink stili
      const emailCell = row.getCell('email');
      if (emailCell.value) {
        emailCell.value = {
          text: emailCell.value,
          hyperlink: `mailto:${emailCell.value}`
        };
        emailCell.font = { 
          color: { argb: 'FF2563EB' },
          underline: true,
          name: 'Arial',
          size: 10
        };
      }
    });

    // Otomatik filtre ekle
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length }
    };

    // Dosya adı (tarih ile)
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
    const fileName = `Onaylanmis_Basvurular_${dateStr}_${timeStr}.xlsx`;
    const filePath = path.join(__dirname, '../../', fileName);

    // Excel dosyasını kaydet
    await workbook.xlsx.writeFile(filePath);

    console.log('✅ Excel dosyası başarıyla oluşturuldu!');
    console.log(`📁 Dosya konumu: ${filePath}`);
    console.log(`📊 Toplam onaylı başvuru: ${applications.length}`);
    console.log(`📋 Kolonlar: ${columns.map(c => c.header).join(', ')}`);
    
    // Şehir bazında istatistik
    const citiesCount = {};
    applications.forEach(app => {
      const city = app.personalInfo?.city || 'Bilinmiyor';
      citiesCount[city] = (citiesCount[city] || 0) + 1;
    });
    
    console.log('\n📊 Şehir Bazında Dağılım:');
    Object.entries(citiesCount)
      .sort((a, b) => b[1] - a[1]) // En çoktan aza sırala
      .forEach(([city, count]) => {
        console.log(`   - ${city}: ${count} kişi`);
      });

    // MongoDB bağlantısını kapat
    await mongoose.connection.close();
    console.log('\n✅ İşlem tamamlandı, bağlantı kapatıldı.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Ana fonksiyon
const main = async () => {
  await connectDB();
  await createApprovedApplicantsExcel();
};

// Çalıştır
main();

