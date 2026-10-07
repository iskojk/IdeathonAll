require('dotenv').config();
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const path = require('path');
const Application = require('../models/Application');
const User = require('../models/User');
const TeamEvaluation = require('../models/TeamEvaluation');

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
  offWhite: 'FFF8FAFC',
  altRow: 'FFEFF6FF',
  gold: 'FFB7791F',
  goldBg: 'FFFFFBEB',
  silver: 'FF64748B',
  silverBg: 'FFF1F5F9',
  bronze: 'FF92400E',
  bronzeBg: 'FFFEF3C7',
  green: 'FF059669',
  greenBg: 'FFECFDF5',
  gray: 'FF64748B',
  border: 'FFCBD5E1',
  teamBg: 'FF1E3A5F',
  subBg: 'FFEDF2F7',
};

const thin = {
  top: { style: 'thin', color: { argb: C.border } },
  bottom: { style: 'thin', color: { argb: C.border } },
  left: { style: 'thin', color: { argb: C.border } },
  right: { style: 'thin', color: { argb: C.border } },
};

const thick = {
  top: { style: 'medium', color: { argb: C.navy } },
  bottom: { style: 'medium', color: { argb: C.navy } },
  left: { style: 'medium', color: { argb: C.navy } },
  right: { style: 'medium', color: { argb: C.navy } },
};

function hdrStyle(row, cols, bg = C.navy) {
  row.height = 30;
  for (let i = 1; i <= cols; i++) {
    const c = row.getCell(i);
    c.font = { name: 'Calibri', size: 11, bold: true, color: { argb: C.white } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    c.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    c.border = thin;
  }
}

function dataStyle(row, cols, isAlt) {
  row.height = 22;
  for (let i = 1; i <= cols; i++) {
    const c = row.getCell(i);
    c.font = { name: 'Calibri', size: 10 };
    c.alignment = { vertical: 'middle', horizontal: 'left' };
    c.border = thin;
    if (isAlt) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.altRow } };
  }
}

function totalStyle(row, cols, bg) {
  row.height = 28;
  for (let i = 1; i <= cols; i++) {
    const c = row.getCell(i);
    c.font = { name: 'Calibri', size: 11, bold: true, color: { argb: C.white } };
    c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
    c.alignment = { vertical: 'middle', horizontal: 'center' };
    c.border = thin;
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

    const registeredUsers = await User.countDocuments({
      ideathonId: idt.id,
      role: { $nin: ['juri', 'mentor', 'superadmin', 'admin'] }
    });

    const apps = await Application.find({
      ideathonId: idt.id
    }).select('personalInfo teamInfo status').lean();

    const totalApps = apps.length;

    const approvedApps = apps.filter(a => a.status === 'approved');
    const approvedTeamApps = approvedApps.filter(a => a.teamInfo?.isInTeam && a.teamInfo?.teamName);

    const approvedTeamNames = new Set();
    for (const a of approvedTeamApps) approvedTeamNames.add(a.teamInfo.teamName.trim());

    const allTeamApps = apps.filter(a => a.teamInfo?.isInTeam && a.teamInfo?.teamName);
    const allTeamNames = new Set();
    for (const a of allTeamApps) allTeamNames.add(a.teamInfo.teamName.trim());

    // Takim uye toplami: basvuru sahibi + teamMembers (basvuru sahibi haric)
    let totalTeamMemberCount = 0;
    for (const a of allTeamApps) {
      totalTeamMemberCount += 1; // basvuru sahibi
      if (a.teamInfo?.teamMembers?.length > 0) {
        const ownerName = `${a.personalInfo?.firstName || ''} ${a.personalInfo?.lastName || ''}`.trim().toLowerCase();
        const ownerTC = a.personalInfo?.tcIdentity || '';
        for (const m of a.teamInfo.teamMembers) {
          const mName = (m.name || '').trim();
          const mTC = m.tcIdentity || '';
          if ((mTC && mTC === ownerTC) || (mName.toLowerCase() === ownerName)) continue;
          totalTeamMemberCount++;
        }
      }
    }

    const platformTotal = registeredUsers;

    // Top 3 from TeamEvaluation rankings
    const rankings = await TeamEvaluation.getTeamRankings(idt.id);
    const top3 = rankings.slice(0, 3);

    // Get member details for top 3 from Application
    const top3WithMembers = [];
    for (const ranked of top3) {
      const teamApps = await Application.find({
        ideathonId: idt.id,
        status: 'approved',
        'teamInfo.isInTeam': true,
        'teamInfo.teamName': ranked.teamName
      }).select('personalInfo teamInfo').lean();

      const members = [];
      for (const a of teamApps) {
        members.push({
          name: `${a.personalInfo?.firstName || ''} ${a.personalInfo?.lastName || ''}`.trim(),
          phone: a.personalInfo?.phone || '',
        });
        if (a.teamInfo?.teamMembers?.length > 0) {
          const ownerName = `${a.personalInfo?.firstName || ''} ${a.personalInfo?.lastName || ''}`.trim().toLowerCase();
          const ownerTC = a.personalInfo?.tcIdentity || '';
          for (const m of a.teamInfo.teamMembers) {
            const mName = (m.name || '').trim();
            const mTC = m.tcIdentity || '';
            if ((mTC && mTC === ownerTC) || (mName.toLowerCase() === ownerName)) continue;
            members.push({ name: mName, phone: '' });
          }
        }
      }

      top3WithMembers.push({
        teamName: ranked.teamName,
        avgScore: ranked.averageScore,
        evalCount: ranked.evaluationCount,
        members,
      });
    }

    const d = {
      idt, platformTotal, totalApps,
      totalTeamCount: allTeamNames.size,
      totalTeamMemberCount,
      finaleTeamCount: approvedTeamNames.size,
      top3: top3WithMembers,
    };
    allData.push(d);

    console.log(`Platform uye: ${platformTotal} | Basvuru: ${totalApps} | Takim: ${allTeamNames.size} (${totalTeamMemberCount} uye) | Finale: ${approvedTeamNames.size}`);
    if (top3.length > 0) console.log(`Top 3: ${top3.map(t => t.teamName).join(', ')}`);
  }

  // ── SHEET: GENEL OZET ──
  const ws = workbook.addWorksheet('Ideathon 2025', { properties: { tabColor: { argb: '0B2447' } } });
  const COLS = 7;

  ws.getColumn(1).width = 4;
  ws.getColumn(2).width = 32;
  ws.getColumn(3).width = 22;
  ws.getColumn(4).width = 22;
  ws.getColumn(5).width = 22;
  ws.getColumn(6).width = 20;
  ws.getColumn(7).width = 20;

  const t1 = ws.addRow(['', 'Emlak Konut Ideathon 2025', '', '', '', '', '']);
  t1.height = 44;
  ws.mergeCells(t1.number, 2, t1.number, COLS);
  t1.getCell(2).font = { name: 'Calibri', size: 18, bold: true, color: { argb: C.navy } };
  t1.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

  const t2 = ws.addRow(['', `Rapor Tarihi: ${new Date().toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric', timeZone: 'Europe/Istanbul' })}`, '', '', '', '', '']);
  t2.height = 24;
  ws.mergeCells(t2.number, 2, t2.number, COLS);
  t2.getCell(2).font = { name: 'Calibri', size: 10, color: { argb: C.gray } };
  t2.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

  ws.addRow([]);

  const h1 = ws.addRow(['', 'Ideathon', 'Platforma Uye\nOlan Toplam Sayi', 'Toplam Katilimci\nBasvurusu', 'Toplam Takim\nBasvurusu', 'Toplam Takim\nUye Sayisi', 'Finale Kalan\nTakim']);
  hdrStyle(h1, COLS);
  h1.height = 36;

  let gPlatform = 0, gApps = 0, gTeams = 0, gMembers = 0, gFinale = 0;

  allData.forEach((d, i) => {
    const row = ws.addRow(['', d.idt.short, d.platformTotal, d.totalApps, d.totalTeamCount, d.totalTeamMemberCount, d.finaleTeamCount]);
    dataStyle(row, COLS, i % 2 === 1);
    for (let c = 3; c <= COLS; c++) row.getCell(c).alignment = { vertical: 'middle', horizontal: 'center' };
    gPlatform += d.platformTotal;
    gApps += d.totalApps;
    gTeams += d.totalTeamCount;
    gMembers += d.totalTeamMemberCount;
    gFinale += d.finaleTeamCount;
  });

  const totRow = ws.addRow(['', 'TOPLAM', gPlatform, gApps, gTeams, gMembers, gFinale]);
  totalStyle(totRow, COLS, C.blue);

  ws.views = [{ state: 'frozen', ySplit: 4 }];

  // ── SHEET: ILK 3 TAKIM ──
  const ws2 = workbook.addWorksheet('Ilk 3 Takim', { properties: { tabColor: { argb: '19376D' } } });
  const COLS2 = 5;

  ws2.getColumn(1).width = 6;
  ws2.getColumn(2).width = 30;
  ws2.getColumn(3).width = 28;
  ws2.getColumn(4).width = 22;
  ws2.getColumn(5).width = 26;

  const tt1 = ws2.addRow(['', 'Emlak Konut Ideathon 2025 — Ilk 3 Takim', '', '', '']);
  tt1.height = 44;
  ws2.mergeCells(tt1.number, 2, tt1.number, COLS2);
  tt1.getCell(2).font = { name: 'Calibri', size: 16, bold: true, color: { argb: C.navy } };
  tt1.getCell(2).alignment = { vertical: 'middle', horizontal: 'center' };

  ws2.addRow([]);

  const h2 = ws2.addRow(['#', 'Takim', 'Ad Soyad', 'Telefon', 'Katildigi Ideathon']);
  hdrStyle(h2, COLS2);

  let rowNum = 0;
  for (const data of allData) {
    if (data.top3.length === 0) continue;

    for (const team of data.top3) {
      for (const m of team.members) {
        rowNum++;
        const row = ws2.addRow([rowNum, team.teamName, m.name, m.phone || '-', data.idt.short]);
        dataStyle(row, COLS2, rowNum % 2 === 0);
        row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
        row.getCell(5).alignment = { vertical: 'middle', horizontal: 'center' };
      }
    }
  }

  const dataEnd2 = h2.number + rowNum;
  ws2.autoFilter = { from: `A${h2.number}`, to: `E${dataEnd2}` };
  ws2.views = [{ state: 'frozen', ySplit: h2.number }];

  // ── SAVE ──
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const fileName = `Emlak_Konut_Ideathon_2025_Ozet_${dateStr}.xlsx`;
  const filePath = path.join(process.cwd(), fileName);
  await workbook.xlsx.writeFile(filePath);

  console.log(`\n${fileName} olusturuldu`);
  console.log(`${filePath}`);

  await mongoose.connection.close();
  process.exit(0);
}

main().catch(err => {
  console.error('Hata:', err);
  process.exit(1);
});
