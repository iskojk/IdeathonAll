require('dotenv').config();
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const path = require('path');
const User = require('../models/User');
const Application = require('../models/Application');

const IDEATHON_ID = '69b7f1202a6f741e193fad23';

const COLORS = {
  headerBg: 'FF1B4332',
  headerFont: 'FFFFFFFF',
  altRowBg: 'FFF0FFF4',
  border: 'FFD5D8DC',
  accent: 'FF2D6A4F',
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
  console.log('MongoDB baglantisi basarili');

  const allUsers = await User.find({
    ideathonId: IDEATHON_ID,
    role: 'user',
    isActive: true
  }).select('name email phone createdAt').lean();

  console.log(`Kahramanmaras ideathonuna kayitli toplam ${allUsers.length} kullanici`);

  const applicantDocs = await Application.find({
    ideathonId: IDEATHON_ID
  }).select('userId').lean();

  const applicantIds = new Set(applicantDocs.map(a => a.userId?.toString()).filter(Boolean));
  console.log(`Basvuru yapan: ${applicantIds.size} kullanici`);

  const noAppUsers = allUsers
    .filter(u => !applicantIds.has(u._id.toString()))
    .sort((a, b) => a.name.localeCompare(b.name, 'tr'));

  console.log(`Basvuru YAPMAYAN: ${noAppUsers.length} kullanici`);

  if (noAppUsers.length === 0) {
    console.log('Basvuru yapmayan kullanici bulunamadi.');
    await mongoose.connection.close();
    process.exit(0);
  }

  const splitName = (fullName) => {
    const parts = (fullName || '').trim().split(/\s+/);
    if (parts.length <= 1) return { firstName: parts[0] || '', lastName: '' };
    return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
  };

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Emlak Konut Ideathon';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Basvuru Yapmayanlar', {
    properties: { tabColor: { argb: '1B4332' } },
  });

  const titleRow = ws.addRow(['', 'Emlak Konut Ideathon Kahramanmaras — Uye Olup Basvuru Yapmayanlar', '', '', '', '']);
  titleRow.height = 40;
  ws.mergeCells(titleRow.number, 2, titleRow.number, 5);
  const titleCell = titleRow.getCell(2);
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: COLORS.accent } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

  const statRow = ws.addRow([
    '', `Toplam Kayitli: ${allUsers.length}`, '',
    `Basvuru Yapan: ${applicantIds.size}`, '',
    `Basvuru Yapmayan: ${noAppUsers.length}`
  ]);
  statRow.height = 26;
  for (let c = 1; c <= 6; c++) {
    const cell = statRow.getCell(c);
    cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF555555' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.statBg } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder;
  }

  ws.addRow([]);

  ws.getColumn(1).width = 6;
  ws.getColumn(2).width = 20;
  ws.getColumn(3).width = 22;
  ws.getColumn(4).width = 20;
  ws.getColumn(5).width = 34;
  ws.getColumn(6).width = 22;

  const headerRow = ws.addRow(['#', 'Ad', 'Soyad', 'Telefon', 'E-posta', 'Kayit Tarihi']);
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

  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const fileName = `Ideathon_Kahramanmaras_Basvuru_Yapmayanlar_${dateStr}.xlsx`;
  const filePath = path.join(process.cwd(), fileName);
  await workbook.xlsx.writeFile(filePath);

  console.log(`\n${fileName} olusturuldu`);
  console.log(`${filePath}`);
  console.log(`${noAppUsers.length} kisi listelendi`);

  await mongoose.connection.close();
  process.exit(0);
}

main().catch(err => {
  console.error('Hata:', err);
  process.exit(1);
});
