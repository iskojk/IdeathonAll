require('dotenv').config();
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const path = require('path');
const Application = require('../models/Application');

const IDEATHON_ID = '69b7ee332a6f741e193fabee';

const COLORS = {
  headerBg: 'FF1A5276',
  headerFont: 'FFFFFFFF',
  altRowBg: 'FFF0F4F8',
  border: 'FFD5D8DC',
  accent: 'FF2E86C1',
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

  const applications = await Application.find({
    ideathonId: IDEATHON_ID,
    status: { $ne: 'withdrawn' }
  })
    .select('personalInfo status createdAt')
    .sort({ 'personalInfo.firstName': 1, 'personalInfo.lastName': 1 })
    .lean();

  console.log(`${applications.length} başvuru bulundu`);

  if (applications.length === 0) {
    console.log('Başvuru bulunamadı.');
    await mongoose.connection.close();
    process.exit(0);
  }

  const statusMap = {
    pending: 'Beklemede',
    under_review: 'İnceleniyor',
    approved: 'Onaylandı',
    rejected: 'Reddedildi',
  };

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Emlak Konut İdeathon';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Başvuru Yapanlar', {
    properties: { tabColor: { argb: 'FF2E86C1' } },
  });

  const titleRow = ws.addRow(['', 'Ideathon Konya — Başvuru Yapanlar', '', '', '', '', '']);
  titleRow.height = 40;
  ws.mergeCells(titleRow.number, 2, titleRow.number, 6);
  const titleCell = titleRow.getCell(2);
  titleCell.font = { name: 'Calibri', size: 14, bold: true, color: { argb: COLORS.accent } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

  const approved = applications.filter(a => a.status === 'approved').length;
  const pending = applications.filter(a => a.status === 'pending' || a.status === 'under_review').length;
  const rejected = applications.filter(a => a.status === 'rejected').length;

  const statRow = ws.addRow([
    '', `Toplam: ${applications.length}`, '',
    `Onaylı: ${approved}`, `Bekleyen: ${pending}`, `Red: ${rejected}`, ''
  ]);
  statRow.height = 26;
  for (let c = 1; c <= 7; c++) {
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
  ws.getColumn(6).width = 16;
  ws.getColumn(7).width = 18;

  const headerRow = ws.addRow(['#', 'Ad', 'Soyad', 'Telefon', 'E-posta', 'Durum', 'Başvuru Tarihi']);
  styleHeaderRow(headerRow, 7);

  applications.forEach((app, idx) => {
    const p = app.personalInfo || {};
    const regDate = app.createdAt
      ? new Date(app.createdAt).toLocaleDateString('tr-TR', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          timeZone: 'Europe/Istanbul'
        })
      : '';

    const row = ws.addRow([
      idx + 1,
      p.firstName || '',
      p.lastName || '',
      p.phone || '',
      p.email || '',
      statusMap[app.status] || app.status || '',
      regDate
    ]);
    styleDataRow(row, 7, idx % 2 === 1);

    if (app.status === 'approved') {
      row.getCell(6).font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FF27AE60' } };
    } else if (app.status === 'rejected') {
      row.getCell(6).font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: 'FFE74C3C' } };
    }
  });

  const dataEnd = headerRow.number + applications.length;
  ws.autoFilter = { from: `A${headerRow.number}`, to: `G${dataEnd}` };
  ws.views = [{ state: 'frozen', ySplit: headerRow.number }];

  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const fileName = `Ideathon_Konya_Basvuru_Yapanlar_${dateStr}.xlsx`;
  const filePath = path.join(process.cwd(), fileName);
  await workbook.xlsx.writeFile(filePath);

  console.log(`\n✅ ${fileName} oluşturuldu`);
  console.log(`📁 ${filePath}`);
  console.log(`📊 ${applications.length} başvuru listelendi`);

  await mongoose.connection.close();
  process.exit(0);
}

main().catch(err => {
  console.error('Hata:', err);
  process.exit(1);
});
