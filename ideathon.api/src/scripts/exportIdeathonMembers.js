/**
 * İdeathon Üye Listesi Excel Export
 * 
 * İzmir ve Ankara ideathon üyelerinin ad, soyad, telefon, email bilgilerini
 * ayrı ayrı Excel dosyalarına export eder.
 * 
 * Kullanım:
 *   node src/scripts/exportIdeathonMembers.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const path = require('path');
const User = require('../models/User');
const Application = require('../models/Application');
const Ideathon = require('../models/Ideathon');

const IDEATHONS = [
  { id: '6994765efd05fe7ea9267e17', label: 'İzmir' },
  { id: '69a2e27ebea392d08efbab9a', label: 'Ankara' },
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı');
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:', error.message);
    process.exit(1);
  }
};

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('tr-TR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
};

const COLORS = {
  primary: 'FF1A56DB',
  primaryDark: 'FF12408A',
  primaryLight: 'FF3B82F6',
  accent: 'FF0EA5E9',
  success: 'FF10B981',
  warning: 'FFF59E0B',
  danger: 'FFEF4444',
  muted: 'FF94A3B8',
  dark: 'FF1E293B',
  white: 'FFFFFFFF',
  grayBg: 'FFF8FAFC',
  grayBgAlt: 'FFF1F5F9',
  grayBorder: 'FFE2E8F0',
  grayText: 'FF64748B',
};

const buildExcel = async (ideathonId, ideathonLabel) => {
  const ideathon = await Ideathon.findById(ideathonId).select('name slug startDate endDate').lean();
  const ideathonName = ideathon?.name || `Ideathon ${ideathonLabel}`;

  // User tablosundan ideathonId'ye bağlı tüm kullanıcıları çek
  const users = await User.find({ ideathonId, isActive: true })
    .sort({ name: 1 })
    .lean();

  // Bu ideathon'a ait tüm başvuruları çek (withdrawn hariç)
  const applications = await Application.find({
    ideathonId,
    status: { $ne: 'withdrawn' },
  }).lean();

  // userId → application map
  const appByUserId = {};
  for (const app of applications) {
    appByUserId[app.userId.toString()] = app;
  }

  console.log(`\n📌 ${ideathonName}: ${users.length} üye bulundu (${applications.length} başvuru)`);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Emlak Konut İdeathon';
  workbook.created = new Date();

  const colCount = 7;

  const ws = workbook.addWorksheet(ideathonLabel, {
    properties: { tabColor: { argb: COLORS.primary } },
    views: [{ state: 'frozen', xSplit: 0, ySplit: 4 }],
  });

  // ── Row 1: Title ──
  const titleRow = ws.addRow([`${ideathonName} — Üye Listesi`]);
  titleRow.height = 36;
  ws.mergeCells(1, 1, 1, colCount);
  const titleCell = titleRow.getCell(1);
  titleCell.font = { name: 'Calibri', size: 18, bold: true, color: { argb: COLORS.white } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell.fill = {
    type: 'gradient', gradient: 'angle', degree: 90,
    stops: [
      { position: 0, color: { argb: COLORS.primaryDark } },
      { position: 1, color: { argb: COLORS.primaryLight } },
    ],
  };

  // ── Row 2: Sub-info ──
  const dateRange = ideathon
    ? `${new Date(ideathon.startDate).toLocaleDateString('tr-TR')} – ${new Date(ideathon.endDate).toLocaleDateString('tr-TR')}`
    : '';
  const appliedCount = users.filter(u => appByUserId[u._id.toString()]).length;
  const notAppliedCount = users.length - appliedCount;
  const infoText = `Export: ${formatDate(new Date())}  |  Toplam: ${users.length} üye  |  Başvuran: ${appliedCount}  |  Başvurmayan: ${notAppliedCount}  |  Tarih: ${dateRange}`;
  const infoRow = ws.addRow([infoText]);
  infoRow.height = 22;
  ws.mergeCells(2, 1, 2, colCount);
  const infoCell = infoRow.getCell(1);
  infoCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: COLORS.grayText } };
  infoCell.alignment = { vertical: 'middle', horizontal: 'center' };
  infoCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.grayBg } };

  // ── Row 3: Spacer ──
  ws.addRow([]);
  ws.getRow(3).height = 6;

  // ── Row 4: Column Headers ──
  const columns = [
    { header: '#',              key: 'index',       width: 7  },
    { header: 'AD',             key: 'firstName',   width: 18 },
    { header: 'SOYAD',          key: 'lastName',    width: 18 },
    { header: 'TELEFON',        key: 'phone',       width: 20 },
    { header: 'E-POSTA',        key: 'email',       width: 32 },
    { header: 'ROL',            key: 'role',        width: 14 },
    { header: 'BAŞVURU DURUMU', key: 'appStatus',   width: 20 },
  ];

  ws.columns = columns;

  const headerRow = ws.getRow(4);
  headerRow.height = 30;
  headerRow.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.white } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  headerRow.fill = {
    type: 'gradient', gradient: 'angle', degree: 90,
    stops: [
      { position: 0, color: { argb: COLORS.primaryDark } },
      { position: 1, color: { argb: COLORS.primary } },
    ],
  };
  headerRow.eachCell((cell) => {
    cell.border = {
      top: { style: 'medium', color: { argb: COLORS.primaryDark } },
      bottom: { style: 'medium', color: { argb: COLORS.primaryDark } },
      left: { style: 'thin', color: { argb: COLORS.primaryDark } },
      right: { style: 'thin', color: { argb: COLORS.primaryDark } },
    };
  });

  // ── Data Rows ──
  const roleMap = {
    superadmin: 'Süper Admin',
    admin: 'Admin',
    support: 'Destek',
    juri: 'Jüri',
    mentor: 'Mentor',
    user: 'Kullanıcı',
  };

  users.forEach((user, i) => {
    const app = appByUserId[user._id.toString()];
    const hasApp = !!app;

    // User.name tek alan, ama başvuru varsa oradan firstName/lastName al
    let firstName = '';
    let lastName = '';
    if (app) {
      firstName = app.personalInfo?.firstName || '';
      lastName = app.personalInfo?.lastName || '';
    } else {
      const parts = (user.name || '').trim().split(/\s+/);
      lastName = parts.pop() || '';
      firstName = parts.join(' ') || '';
    }

    const phone = app ? (app.personalInfo?.phone || user.phone || '') : (user.phone || '');
    const email = app ? (app.personalInfo?.email || user.email || '') : (user.email || '');

    const row = ws.addRow({
      index: i + 1,
      firstName,
      lastName,
      phone,
      email,
      role: roleMap[user.role] || user.role || '',
      appStatus: hasApp ? 'Başvuru Yapmış ✓' : 'Başvuru Yapmamış ✗',
    });

    row.height = 24;
    row.font = { name: 'Calibri', size: 10.5, color: { argb: COLORS.dark } };
    row.alignment = { vertical: 'middle', horizontal: 'left' };

    const isEven = i % 2 === 0;
    row.eachCell((cell) => {
      cell.fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: isEven ? COLORS.grayBg : COLORS.white },
      };
      cell.border = {
        bottom: { style: 'hair', color: { argb: COLORS.grayBorder } },
        left: { style: 'hair', color: { argb: COLORS.grayBorder } },
        right: { style: 'hair', color: { argb: COLORS.grayBorder } },
      };
    });

    row.getCell('index').alignment = { vertical: 'middle', horizontal: 'center' };
    row.getCell('index').font = { name: 'Calibri', size: 10, color: { argb: COLORS.grayText } };

    row.getCell('firstName').font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: COLORS.dark } };
    row.getCell('lastName').font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: COLORS.dark } };

    const emailCell = row.getCell('email');
    const emailVal = emailCell.value?.toString?.() || '';
    if (emailVal) {
      emailCell.value = { text: emailVal, hyperlink: `mailto:${emailVal}` };
      emailCell.font = { name: 'Calibri', size: 10.5, color: { argb: COLORS.primaryLight }, underline: true };
    }

    row.getCell('role').alignment = { vertical: 'middle', horizontal: 'center' };

    const appCell = row.getCell('appStatus');
    appCell.alignment = { vertical: 'middle', horizontal: 'center' };
    if (hasApp) {
      appCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.success } };
      appCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.white } };
    } else {
      appCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.danger } };
      appCell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: COLORS.white } };
    }
  });

  // ── Footer / Summary Row ──
  ws.addRow([]);
  const summaryRow = ws.addRow([
    '',
    `Toplam: ${users.length} üye`,
    '',
    '',
    '',
    '',
    '',
  ]);
  summaryRow.height = 26;
  summaryRow.getCell(2).font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.primary } };
  summaryRow.getCell(2).alignment = { vertical: 'middle', horizontal: 'left' };
  ws.mergeCells(summaryRow.number, 2, summaryRow.number, 4);

  const breakdownRow = ws.addRow([
    '',
    `Başvuru Yapmış: ${appliedCount}  |  Başvuru Yapmamış: ${notAppliedCount}`,
  ]);
  breakdownRow.getCell(2).font = { name: 'Calibri', size: 9.5, color: { argb: COLORS.grayText } };
  ws.mergeCells(breakdownRow.number, 2, breakdownRow.number, 5);

  // Auto-filter on header row
  ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: columns.length } };

  // Print setup
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

  // Write file
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const fileName = `Ideathon_${ideathonLabel}_Uyeler_${dateStr}.xlsx`;
  const filePath = path.join(process.cwd(), fileName);
  await workbook.xlsx.writeFile(filePath);

  console.log(`✅ ${fileName} oluşturuldu → ${filePath}`);
  console.log(`   Başvuru Yapmış: ${appliedCount} | Başvuru Yapmamış: ${notAppliedCount}`);

  return filePath;
};

const main = async () => {
  await connectDB();
  console.log('\n🚀 İdeathon üye listesi export başlıyor...\n');

  for (const { id, label } of IDEATHONS) {
    await buildExcel(id, label);
  }

  console.log('\n✅ Tüm exportlar tamamlandı!');
  await mongoose.connection.close();
  process.exit(0);
};

main().catch((err) => {
  console.error('❌ Hata:', err);
  process.exit(1);
});
