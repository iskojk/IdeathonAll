require('dotenv').config();
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const path = require('path');
const Application = require('../models/Application');

const IDEATHONS = [
  { id: '6994765efd05fe7ea9267e17', name: 'Ideathon İzmir', file: 'Izmir_Basvurular' },
  { id: '69a2e27ebea392d08efbab9a', name: 'Ideathon Ankara', file: 'Ankara_Basvurular' },
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB bağlantısı başarılı\n');

  for (const idt of IDEATHONS) {
    const apps = await Application.find({
      ideathonId: idt.id,
      status: { $ne: 'withdrawn' }
    })
      .select('personalInfo.firstName personalInfo.lastName personalInfo.phone personalInfo.email status')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`${idt.name}: ${apps.length} başvuru`);

    const workbook = new ExcelJS.Workbook();
    const ws = workbook.addWorksheet(idt.name);

    ws.columns = [
      { header: 'Sıra', key: 'sira', width: 8 },
      { header: 'Ad Soyad', key: 'adSoyad', width: 30 },
      { header: 'Telefon', key: 'telefon', width: 20 },
      { header: 'E-posta', key: 'email', width: 35 },
    ];

    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E4D8B' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 28;

    apps.forEach((app, i) => {
      const row = ws.addRow({
        sira: i + 1,
        adSoyad: `${app.personalInfo?.firstName || ''} ${app.personalInfo?.lastName || ''}`.trim(),
        telefon: app.personalInfo?.phone || '',
        email: app.personalInfo?.email || '',
      });
      row.height = 22;
      if (i % 2 === 0) {
        row.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7FA' } };
        });
      }
    });

    const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const fileName = `${idt.file}_${dateStr}.xlsx`;
    const filePath = path.join(__dirname, '../../', fileName);
    await workbook.xlsx.writeFile(filePath);
    console.log(`  -> ${filePath}\n`);
  }

  await mongoose.connection.close();
  console.log('Tamamlandı.');
}

run().catch(err => { console.error(err); process.exit(1); });
