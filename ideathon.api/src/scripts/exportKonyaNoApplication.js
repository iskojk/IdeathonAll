require('dotenv').config();
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const path = require('path');
const User = require('../models/User');
const Application = require('../models/Application');

const IDEATHON_ID = '69b7ee332a6f741e193fabee';

const COLORS = {
  headerBg: 'FF6C3483',
  headerFont: 'FFFFFFFF',
  altRowBg: 'FFF5EEF8',
  border: 'FFD5D8DC',
  accent: 'FF8E44AD',
  statBg: 'FFEAF2F8',
};

const thinBorder = {
  top: { style: 'thin', color: { argb: COLORS.border } },
  bottom: { style: 'thin', color: { argb: COLORS.border } },
  left: { style: 'thin', color: { argb: COLORS.border } },
  right: { style: 'thin', color: { argb: COLORS.border } },
};

function styleHeaderRow(row, colCount) {
  row.height = 32;
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.headerFont } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = thinBorder;
  }
}

function styleDataRow(row, colCount, isAlt) {
  row.height = 24;
  for (let c = 1; c <= colCount; c++) {
    const cell = row.getCell(c);
    cell.font = { name: 'Calibri', size: 10.5 };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = thinBorder;
    if (isAlt) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.altRowBg } };
    }
  }
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB bağlantısı başarılı');

  const allUsers = await User.find({
    ideathonId: IDEATHON_ID,
    role: 'user',
    isActive: true
  }).select('name email phone createdAt').lean();

  console.log(`Konya ideathonuna kayıtlı toplam ${allUsers.length} kullanıcı`);

  const applicantDocs = await Application.find({
    ideathonId: IDEATHON_ID
  }).select('userId').lean();

  const applicantIds = new Set(applicantDocs.map(a => a.userId?.toString()).filter(Boolean));
  console.log(`Başvuru yapan: ${applicantIds.size} kullanıcı`);

  const noAppUsers = allUsers
    .filter(u => !applicantIds.has(u._id.toString()))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  console.log(`Başvuru YAPMAYAN: ${noAppUsers.length} kullanıcı`);

  if (noAppUsers.length === 0) {
    console.log('Başvuru yapmayan kullanıcı bulunamadı.');
    await mongoose.connection.close();
    process.exit(0);
  }

  // Ad Soyad ayırma
  const splitName = (fullName) => {
    const parts = (fullName || '').trim().split(/\s+/);
    if (parts.length <= 1) return { firstName: parts[0] || '', lastName: '' };
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
  };

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Emlak Konut İdeathon';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Başvuru Yapmayanlar', {
    properties: { tabColor: { argb: 'FF8E44AD' } },
  });

  // Başlık satırı
  const titleRow = ws.addRow(['', 'Ideathon Konya — Üye Olup Başvuru Yapmayanlar', '', '', '', '']);
  titleRow.height = 40;
  ws.mergeCells(titleRow.number, 2, titleRow.number, 5);
  const titleCell = titleRow.getCell(2);
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: COLORS.accent } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

  // İstatistik satırı
  const statRow = ws.addRow([
    '', `Toplam Kayıtlı: ${allUsers.length}`, '',
    `Başvuru Yapan: ${applicantIds.size}`, '',
    `Başvuru Yapmayan: ${noAppUsers.length}`
  ]);
  statRow.height = 26;
  for (let c = 1; c <= 6; c++) {
    const cell = statRow.getCell(c);
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF555555' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.statBg } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder;
  }

  // Boş satır
  ws.addRow([]);

  // Kolon tanımları
  ws.getColumn(1).width = 6;
  ws.getColumn(2).width = 20;
  ws.getColumn(3).width = 22;
  ws.getColumn(4).width = 20;
  ws.getColumn(5).width = 34;
  ws.getColumn(6).width = 22;

  const headerRow = ws.addRow(['#', 'Ad', 'Soyad', 'Telefon', 'E-posta', 'Kayıt Tarihi']);
  styleHeaderRow(headerRow, 6);

  noAppUsers.forEach((user, idx) => {
    const { firstName, lastName } = splitName(user.name);
    const regDate = user.createdAt
      ? new Date(user.createdAt).toLocaleDateString('tr-TR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          timeZone: 'Europe/Istanbul'
        })
      : '';

    const row = ws.addRow([
      idx + 1,
      firstName,
      lastName,
      user.phone || '',
      user.email || '',
      regDate
    ]);
    styleDataRow(row, 6, idx % 2 === 1);
  });

  const dataEnd = headerRow.number + noAppUsers.length;
  ws.autoFilter = { from: `A${headerRow.number}`, to: `F${dataEnd}` };
  ws.views = [{ state: 'frozen', ySplit: headerRow.number }];

  // Kaydet
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const fileName = `Ideathon_Konya_Basvuru_Yapmayanlar_${dateStr}.xlsx`;
  const filePath = path.join(process.cwd(), fileName);
  await workbook.xlsx.writeFile(filePath);

  console.log(`\n✅ ${fileName} oluşturuldu`);
  console.log(`📁 ${filePath}`);
  console.log(`📊 ${noAppUsers.length} kişi listelendi`);

  await mongoose.connection.close();
  process.exit(0);
}

main().catch(err => {
  console.error('Hata:', err);
  process.exit(1);
});
