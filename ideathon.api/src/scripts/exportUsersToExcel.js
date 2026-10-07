require('dotenv').config();
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const path = require('path');
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
    month: '2-digit', 
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Role Türkçe dönüşüm
const getRoleText = (role) => {
  const roleMap = {
    'user': 'Kullanıcı',
    'admin': 'Yönetici',
    'juri': 'Jüri',
    'superadmin': 'Süper Admin'
  };
  return roleMap[role] || role;
};

// Excel'i oluştur
const createUsersExcel = async () => {
  try {
    console.log('👥 Kullanıcılar Excel dosyası oluşturuluyor...\n');

    // Sadece role='user' olan kullanıcıları çek
    const users = await User.find({ role: 'user' })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ ${users.length} kullanıcı bulundu\n`);

    // Excel workbook oluştur
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Emlak Konut';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Worksheet oluştur
    const worksheet = workbook.addWorksheet('Kullanıcılar', {
      properties: { tabColor: { argb: 'FF10B981' } },
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }] // İlk satırı dondur
    });

    // Kolonlar - Kullanıcılar için optimize edilmiş
    const columns = [
      { header: '#', key: 'index', width: 8 },
      { header: 'KULLANICI ADI', key: 'name', width: 25 },
      { header: 'E-POSTA', key: 'email', width: 32 },
      { header: 'TELEFON', key: 'phone', width: 16 },
      { header: 'ROL', key: 'role', width: 14 },
      { header: 'DURUM', key: 'isActive', width: 12 },
      { header: 'KAYIT TARİHİ', key: 'createdAt', width: 18 },
      { header: 'SON GÜNCELLEME', key: 'updatedAt', width: 18 },
    ];

    worksheet.columns = columns;

    // Başlık satırı stili - Modern ve Profesyonel
    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    headerRow.font = { 
      name: 'Calibri', 
      size: 12, 
      bold: true, 
      color: { argb: 'FFFFFFFF' } 
    };
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
    headerRow.border = {
      top: { style: 'medium', color: { argb: 'FF059669' } },
      left: { style: 'thin', color: { argb: 'FF059669' } },
      bottom: { style: 'medium', color: { argb: 'FF059669' } },
      right: { style: 'thin', color: { argb: 'FF059669' } }
    };

    // Data satırları ekle
    users.forEach((user, index) => {
      const row = worksheet.addRow({
        index: index + 1,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: getRoleText(user.role),
        isActive: user.isActive ? 'Aktif' : 'Pasif',
        createdAt: formatDate(user.createdAt),
        updatedAt: formatDate(user.updatedAt),
      });

      // Satır stili - Modern ve okunabilir
      row.height = 22;
      row.font = { 
        name: 'Calibri', 
        size: 11
      };
      row.alignment = { 
        vertical: 'middle', 
        horizontal: 'left',
        wrapText: true
      };

      // Alternatif satır rengi (geliştirilmiş zebra striping)
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

      // Border ekle - modern ve ince
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'hair', color: { argb: 'FFE0E0E0' } },
          left: { style: 'hair', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'hair', color: { argb: 'FFE0E0E0' } },
          right: { style: 'hair', color: { argb: 'FFE0E0E0' } }
        };
      });

      // Index hücresine özel stil
      const indexCell = row.getCell('index');
      indexCell.font = { 
        bold: true, 
        color: { argb: 'FF6B7280' },
        name: 'Calibri',
        size: 11
      };
      indexCell.alignment = { vertical: 'middle', horizontal: 'center' };

      // İsim hücresine özel stil
      const nameCell = row.getCell('name');
      nameCell.font = { 
        bold: true, 
        color: { argb: 'FF1F2937' },
        name: 'Calibri',
        size: 11
      };

      // Email hücresini özel stil
      const emailCell = row.getCell('email');
      if (emailCell.value) {
        emailCell.font = { 
          color: { argb: 'FF2563EB' },
          name: 'Calibri',
          size: 10
        };
      }

      // Durum hücresine renk
      const statusCell = row.getCell('isActive');
      statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
      if (user.isActive) {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF10B981' } // Yeşil
        };
        statusCell.font = { 
          color: { argb: 'FFFFFFFF' }, 
          bold: true,
          name: 'Calibri',
          size: 11
        };
      } else {
        statusCell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFEF4444' } // Kırmızı
        };
        statusCell.font = { 
          color: { argb: 'FFFFFFFF' }, 
          bold: true,
          name: 'Calibri',
          size: 11
        };
      }

      // Role hücresine stil
      const roleCell = row.getCell('role');
      roleCell.alignment = { vertical: 'middle', horizontal: 'center' };
      roleCell.font = { 
        bold: true,
        color: { argb: 'FF6366F1' },
        name: 'Calibri',
        size: 11
      };
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
    const fileName = `Kullanicilar_${dateStr}_${timeStr}.xlsx`;
    const filePath = path.join(__dirname, '../../', fileName);

    // Excel dosyasını kaydet
    await workbook.xlsx.writeFile(filePath);

    console.log('✅ Excel dosyası başarıyla oluşturuldu!');
    console.log(`📁 Dosya konumu: ${filePath}`);
    console.log(`👥 Toplam kullanıcı: ${users.length}`);
    console.log(`📋 Toplam kolon: ${columns.length}`);
    
    // İstatistikler
    const stats = {
      active: users.filter(u => u.isActive).length,
      inactive: users.filter(u => !u.isActive).length
    };
    
    console.log('\n📊 Kullanıcı Durumları:');
    console.log(`   - Aktif: ${stats.active}`);
    console.log(`   - Pasif: ${stats.inactive}`);

    // MongoDB bağlantısını kapat
    await mongoose.connection.close();
    console.log('\n✅ İşlem tamamlandı, bağlantı kapatıldı.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
};

// Ana fonksiyon
const main = async () => {
  await connectDB();
  await createUsersExcel();
};

// Çalıştır
main();

