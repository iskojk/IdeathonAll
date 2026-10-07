require('dotenv').config();
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const path = require('path');
const Application = require('../models/Application');
const User = require('../models/User');

const IDEATHONS = [
  { id: '699439c0791ff177582e9998', name: 'Ideathon Istanbul', short: 'Istanbul' },
  { id: '6994765efd05fe7ea9267e17', name: 'Ideathon Izmir', short: 'Izmir' },
  { id: '69a2e27ebea392d08efbab9a', name: 'Ideathon Ankara', short: 'Ankara' },
  { id: '69b7ee332a6f741e193fabee', name: 'Ideathon Konya', short: 'Konya' },
  { id: '69b7f1202a6f741e193fad23', name: 'Ideathon Kahramanmaras', short: 'Kahramanmaras' },
];

const C = {
  navy: 'FF0B2447',
  blue: 'FF19376D',
  sky: 'FF576CBC',
  white: 'FFFFFFFF',
  altRow: 'FFEFF6FF',
  green: 'FF059669',
  red: 'FFDC2626',
  gray: 'FF64748B',
  border: 'FFCBD5E1',
};

const thin = {
  top: { style: 'thin', color: { argb: C.border } },
  bottom: { style: 'thin', color: { argb: C.border } },
  left: { style: 'thin', color: { argb: C.border } },
  right: { style: 'thin', color: { argb: C.border } },
};

function styleHeader(row, colCount, bg = C.navy) {
  row.height = 30;
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: C.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = thin;
  }
}

function styleData(row, colCount, isAlt) {
  row.height = 22;
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.font = { name: 'Calibri', size: 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
    cell.border = thin;
    if (isAlt) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.altRow } };
  }
}

function styleTotal(row, colCount, bg) {
  row.height = 28;
  for (let i = 1; i <= colCount; i++) {
    const cell = row.getCell(i);
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: C.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thin;
  }
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB baglantisi basarili');

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Emlak Konut Ideathon';
  workbook.created = new Date();

  const allData = [];

  for (const idt of IDEATHONS) {
    console.log(`\n--- ${idt.name} ---`);

    const apps = await Application.find({
      ideathonId: idt.id,
      status: { $ne: 'withdrawn' }
    }).select('teamInfo status').lean();

    const registeredUsers = await User.countDocuments({
      ideathonId: idt.id,
      role: 'user',
      isActive: true
    });

    const total = apps.length;
    const teamApps = apps.filter(a => a.teamInfo?.isInTeam && a.teamInfo?.teamName);
    const individualApps = apps.filter(a => !a.teamInfo?.isInTeam || !a.teamInfo?.teamName);

    const d = { idt, registeredUsers, total, teamApps: teamApps.length, individualApps: individualApps.length };
    allData.push(d);

    console.log(`Kayitli: ${registeredUsers} | Basvuru: ${total} | Takimli: ${teamApps.length} | Bireysel: ${individualApps.length}`);
  }

  const ws = workbook.addWorksheet('Ideathon 2025', { properties: { tabColor: { argb: '0B2447' } } });
  const COLS = 6;

  ws.getColumn(1).width = 4;
  ws.getColumn(2).width = 32;
  ws.getColumn(3).width = 18;
  ws.getColumn(4).width = 18;
  ws.getColumn(5).width = 18;
  ws.getColumn(6).width = 18;

  const titleRow = ws.addRow(['', 'Emlak Konut Ideathon 2025', '', '', '', '']);
  titleRow.height = 44;
  ws.mergeCells(titleRow.number, 2, titleRow.number, COLS);
  titleRow.getCell(2).font = { name: 'Calibri', size: 16, bold: true, color: { argb: C.navy } };
  titleRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

  const subRow = ws.addRow(['', `Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' })}`, '', '', '', '']);
  subRow.height = 24;
  ws.mergeCells(subRow.number, 2, subRow.number, COLS);
  subRow.getCell(2).font = { name: 'Calibri', size: 10, color: { argb: C.gray } };
  subRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

  ws.addRow([]);

  const hdr = ws.addRow(['', 'Ideathon', 'Kayitli Uye', 'Toplam Basvuru', 'Takimli', 'Bireysel']);
  styleHeader(hdr, COLS);

  let gReg = 0, gTotal = 0, gTeam = 0, gIndiv = 0;

  allData.forEach((d, i) => {
    const row = ws.addRow(['', d.idt.short, d.registeredUsers, d.total, d.teamApps, d.individualApps]);
    styleData(row, COLS, i % 2 === 1);
    for (let c = 3; c <= COLS; c++) row.getCell(c).alignment = { vertical: 'middle', horizontal: 'center' };
    gReg += d.registeredUsers;
    gTotal += d.total;
    gTeam += d.teamApps;
    gIndiv += d.individualApps;
  });

  const totRow = ws.addRow(['', 'TOPLAM', gReg, gTotal, gTeam, gIndiv]);
  styleTotal(totRow, COLS, C.blue);

  ws.views = [{ state: 'frozen', ySplit: 4 }];

  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const fileName = `Emlak_Konut_Ideathon_2025_Rapor_${dateStr}.xlsx`;
  const filePath = path.join(process.cwd(), fileName);
  await workbook.xlsx.writeFile(filePath);

  console.log(`\n${fileName} olusturuldu`);
  console.log(`${filePath}`);
  console.log(`\n4 Ideathon | ${gTotal} basvuru | ${gTeam} takimli | ${gIndiv} bireysel`);

  await mongoose.connection.close();
  process.exit(0);
}

main().catch(err => {
  console.error('Hata:', err);
  process.exit(1);
});
