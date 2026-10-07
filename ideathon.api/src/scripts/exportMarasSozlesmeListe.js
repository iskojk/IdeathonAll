require('dotenv').config();
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const path = require('path');
const Application = require('../models/Application');

const IDEATHON_ID = '69b7f1202a6f741e193fad23';

const C = {
  navy: 'FF0B2447',
  blue: 'FF19376D',
  white: 'FFFFFFFF',
  altRow: 'FFEFF6FF',
  gray: 'FF64748B',
  border: 'FFCBD5E1',
};

const thin = {
  top: { style: 'thin', color: { argb: C.border } },
  bottom: { style: 'thin', color: { argb: C.border } },
  left: { style: 'thin', color: { argb: C.border } },
  right: { style: 'thin', color: { argb: C.border } },
};

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB baglantisi basarili');

  const apps = await Application.find({
    ideathonId: IDEATHON_ID,
    status: 'approved',
  })
    .select('personalInfo teamInfo')
    .lean();

  console.log(`${apps.length} onaylanmis basvuru`);

  if (apps.length === 0) {
    console.log('Onaylanmis basvuru yok.');
    await mongoose.connection.close();
    process.exit(0);
  }

  const rows = [];

  for (const a of apps) {
    const teamName = (a.teamInfo?.isInTeam && a.teamInfo?.teamName) ? a.teamInfo.teamName.trim() : '(Bireysel)';

    rows.push({
      teamName,
      firstName: a.personalInfo?.firstName || '',
      lastName: a.personalInfo?.lastName || '',
    });

    if (a.teamInfo?.teamMembers?.length > 0) {
      const ownerFullName = `${a.personalInfo?.firstName || ''} ${a.personalInfo?.lastName || ''}`.trim().toLowerCase();
      const ownerTC = a.personalInfo?.tcIdentity || '';

      for (const m of a.teamInfo.teamMembers) {
        const mName = (m.name || '').trim();
        const mTC = m.tcIdentity || '';
        if ((mTC && mTC === ownerTC) || (mName.toLowerCase() === ownerFullName)) continue;

        const parts = mName.split(' ');
        rows.push({
          teamName,
          firstName: parts[0] || '',
          lastName: parts.slice(1).join(' ') || '',
        });
      }
    }
  }

  rows.sort((a, b) => {
    if (a.teamName !== b.teamName) return a.teamName.localeCompare(b.teamName, 'tr');
    return a.firstName.localeCompare(b.firstName, 'tr');
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Emlak Konut Ideathon';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Sozlesme Listesi', { properties: { tabColor: { argb: '0B2447' } } });

  ws.getColumn(1).width = 6;
  ws.getColumn(2).width = 32;
  ws.getColumn(3).width = 20;
  ws.getColumn(4).width = 22;
  ws.getColumn(5).width = 18;

  const COLS = 5;

  const t1 = ws.addRow(['', 'Ideathon Kahramanmaras — Sozlesme Teyit Listesi', '', '', '']);
  t1.height = 40;
  ws.mergeCells(t1.number, 2, t1.number, COLS);
  t1.getCell(2).font = { name: 'Calibri', size: 14, bold: true, color: { argb: C.navy } };
  t1.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

  const t2 = ws.addRow(['', `${rows.length} Katilimci  |  ${new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' })}`, '', '', '']);
  t2.height = 24;
  ws.mergeCells(t2.number, 2, t2.number, COLS);
  t2.getCell(2).font = { name: 'Calibri', size: 10, color: { argb: C.gray } };
  t2.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

  ws.addRow([]);

  const hdr = ws.addRow(['#', 'Takim Adi', 'Ad', 'Soyad', 'Teyit']);
  hdr.height = 28;
  for (let i = 1; i <= COLS; i++) {
    const cell = hdr.getCell(i);
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: C.white } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.navy } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thin;
  }

  rows.forEach((r, idx) => {
    const row = ws.addRow([idx + 1, r.teamName, r.firstName, r.lastName, '']);
    row.height = 22;
    for (let i = 1; i <= COLS; i++) {
      const cell = row.getCell(i);
      cell.font = { name: 'Calibri', size: 10 };
      cell.alignment = { vertical: 'middle', horizontal: i === 1 ? 'center' : 'left' };
      cell.border = thin;
      if (idx % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.altRow } };
    }
  });

  const dataEnd = hdr.number + rows.length;
  ws.autoFilter = { from: `A${hdr.number}`, to: `E${dataEnd}` };
  ws.views = [{ state: 'frozen', ySplit: hdr.number }];

  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const fileName = `Ideathon_Kahramanmaras_Sozlesme_Listesi_${dateStr}.xlsx`;
  const filePath = path.join(process.cwd(), fileName);
  await workbook.xlsx.writeFile(filePath);

  console.log(`\n${fileName} olusturuldu`);
  console.log(`${filePath}`);
  console.log(`${rows.length} katilimci listelendi`);

  await mongoose.connection.close();
  process.exit(0);
}

main().catch(err => {
  console.error('Hata:', err);
  process.exit(1);
});
