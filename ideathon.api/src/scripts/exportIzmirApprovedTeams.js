require('dotenv').config();
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const path = require('path');
const Application = require('../models/Application');

const IDEATHON_ID = '6994765efd05fe7ea9267e17';

const C = {
  navy: 'FF0B2447',
  blue: 'FF19376D',
  sky: 'FF576CBC',
  light: 'FFA5D7E8',
  white: 'FFFFFFFF',
  offWhite: 'FFF8FAFC',
  altRow: 'FFEFF6FF',
  goldBg: 'FFFFFBEB',
  green: 'FF059669',
  gray: 'FF64748B',
  border: 'FFCBD5E1',
  teamBg: 'FF1E3A5F',
  subBg: 'FFEDF2F7',
};

const thinBorder = {
  top: { style: 'thin', color: { argb: C.border } },
  bottom: { style: 'thin', color: { argb: C.border } },
  left: { style: 'thin', color: { argb: C.border } },
  right: { style: 'thin', color: { argb: C.border } },
};

const thickBorder = {
  top: { style: 'medium', color: { argb: C.navy } },
  bottom: { style: 'medium', color: { argb: C.navy } },
  left: { style: 'medium', color: { argb: C.navy } },
  right: { style: 'medium', color: { argb: C.navy } },
};

async function main() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB bağlantısı başarılı');

  const applications = await Application.find({
    ideathonId: IDEATHON_ID,
    status: 'approved',
  })
    .select('personalInfo teamInfo')
    .sort({ 'teamInfo.teamName': 1, 'personalInfo.firstName': 1 })
    .lean();

  console.log(`${applications.length} onaylanmış başvuru bulundu`);

  const teamMap = new Map();
  const individuals = [];

  for (const app of applications) {
    const isInTeam = app.teamInfo?.isInTeam;
    const teamName = app.teamInfo?.teamName?.trim();

    if (isInTeam && teamName) {
      if (!teamMap.has(teamName)) {
        teamMap.set(teamName, { teamName, leader: null, members: [] });
      }
      const team = teamMap.get(teamName);

      const hasOriginalMembers = app.teamInfo?.teamMembers?.length > 0;
      const person = {
        firstName: app.personalInfo?.firstName || '',
        lastName: app.personalInfo?.lastName || '',
        phone: app.personalInfo?.phone || '',
        email: app.personalInfo?.email || '',
        teamName,
      };

      if (hasOriginalMembers && !team.leader) {
        team.leader = person;

        const ownerFullName = `${person.firstName} ${person.lastName}`.trim().toLowerCase();
        const ownerTC = app.personalInfo?.tcIdentity || '';

        for (const m of app.teamInfo.teamMembers) {
          const mName = (m.name || '').trim();
          const mTC = m.tcIdentity || '';
          if ((mTC && mTC === ownerTC) || (mName.toLowerCase() === ownerFullName)) continue;

          const parts = mName.split(' ');
          team.members.push({
            firstName: parts[0] || '',
            lastName: parts.slice(1).join(' ') || '',
            phone: '',
            email: '',
            role: m.role || 'Uye',
            teamName,
          });
        }
      } else {
        team.members.push({ ...person, role: 'Uye' });
      }
    } else {
      individuals.push({
        firstName: app.personalInfo?.firstName || '',
        lastName: app.personalInfo?.lastName || '',
        phone: app.personalInfo?.phone || '',
        email: app.personalInfo?.email || '',
      });
    }
  }

  const sortedTeams = [...teamMap.values()].sort((a, b) =>
    a.teamName.localeCompare(b.teamName, 'tr')
  );

  const totalParticipants = sortedTeams.reduce((s, t) => s + (t.leader ? 1 : 0) + t.members.length, 0) + individuals.length;

  // Rol kolonunu en uzun metne göre hesapla
  let maxRoleLen = 10; // minimum "Takim Lideri".length
  for (const team of sortedTeams) {
    for (const m of team.members) {
      if (m.role && m.role.length > maxRoleLen) maxRoleLen = m.role.length;
    }
  }
  const rolColWidth = Math.min(Math.max(maxRoleLen * 1.3 + 4, 16), 55);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Emlak Konut Ideathon';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Takim Detay', {
    properties: { tabColor: { argb: '0B2447' } },
  });

  ws.getColumn(1).width = 5;
  ws.getColumn(2).width = 22;
  ws.getColumn(3).width = 22;
  ws.getColumn(4).width = 22;
  ws.getColumn(5).width = 36;
  ws.getColumn(6).width = rolColWidth;

  // ── BASLIK ──
  const r1 = ws.addRow(['EMLAK KONUT IDEATHON IZMIR', '', '', '', '', '']);
  r1.height = 50;
  ws.mergeCells(r1.number, 1, r1.number, 6);
  r1.getCell(1).font = { name: 'Calibri', size: 20, bold: true, color: { argb: C.white } };
  r1.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.navy } };
  r1.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

  const r2 = ws.addRow(['Basvurusu Onaylanan Takimlar - Iletisim Bilgileri', '', '', '', '', '']);
  r2.height = 30;
  ws.mergeCells(r2.number, 1, r2.number, 6);
  r2.getCell(1).font = { name: 'Calibri', size: 12, italic: true, color: { argb: C.white } };
  r2.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.blue } };
  r2.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };

  const r3 = ws.addRow([`${sortedTeams.length} Takim  |  ${totalParticipants} Katilimci`, '', '', '', '', '']);
  r3.height = 28;
  ws.mergeCells(r3.number, 1, r3.number, 6);
  r3.getCell(1).font = { name: 'Calibri', size: 11, bold: true, color: { argb: C.sky } };
  r3.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.offWhite } };
  r3.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' };
  r3.getCell(1).border = thinBorder;

  ws.addRow([]).height = 6;

  // ── TAKIMLAR ──
  let teamNo = 0;
  for (const team of sortedTeams) {
    teamNo++;
    const memberCount = (team.leader ? 1 : 0) + team.members.length;

    // Takim basligi
    const hRow = ws.addRow([`${teamNo}.  ${team.teamName}`, '', '', '', '', `${memberCount} kisi`]);
    hRow.height = 34;
    ws.mergeCells(hRow.number, 1, hRow.number, 5);
    for (let c = 1; c <= 6; c++) {
      const cell = hRow.getCell(c);
      cell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: C.white } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.teamBg } };
      cell.alignment = { vertical: 'middle', horizontal: c <= 5 ? 'left' : 'center' };
      cell.border = thickBorder;
    }
    hRow.getCell(6).font = { name: 'Calibri', size: 10, italic: true, color: { argb: C.light } };

    // Kolon basliklari
    const subH = ws.addRow(['', 'Ad', 'Soyad', 'Telefon', 'E-posta', 'Rol']);
    subH.height = 22;
    for (let c = 1; c <= 6; c++) {
      const cell = subH.getCell(c);
      cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: C.gray } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.subBg } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = thinBorder;
    }

    // Lider
    if (team.leader) {
      const l = team.leader;
      const lRow = ws.addRow(['*', l.firstName, l.lastName, l.phone, l.email, 'Takim Lideri']);
      lRow.height = 26;
      for (let c = 1; c <= 6; c++) {
        const cell = lRow.getCell(c);
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.goldBg } };
        cell.alignment = { vertical: 'middle', horizontal: c === 1 ? 'center' : 'left' };
        cell.border = thinBorder;
        if (c === 1) {
          cell.font = { name: 'Calibri', size: 11, bold: true };
        } else if (c === 6) {
          cell.font = { name: 'Calibri', size: 10, bold: true, color: { argb: C.green } };
        } else {
          cell.font = { name: 'Calibri', size: 10.5, bold: true };
        }
      }
    }

    // Uyeler
    team.members.forEach((m, mIdx) => {
      const mRow = ws.addRow(['', m.firstName, m.lastName, m.phone || '-', m.email || '-', m.role || 'Uye']);
      mRow.height = 22;
      const isAlt = mIdx % 2 === 0;
      for (let c = 1; c <= 6; c++) {
        const cell = mRow.getCell(c);
        cell.font = { name: 'Calibri', size: 10.5, color: c === 6 ? { argb: C.gray } : undefined };
        cell.alignment = { vertical: 'middle', horizontal: c === 1 ? 'center' : 'left' };
        cell.border = thinBorder;
        if (isAlt) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.altRow } };
      }
    });

    // Ayirici
    ws.addRow([]).height = 10;
  }

  // Bireysel basvurular
  if (individuals.length > 0) {
    const indH = ws.addRow([`BIREYSEL BASVURULAR`, '', '', '', '', `${individuals.length} kisi`]);
    indH.height = 34;
    ws.mergeCells(indH.number, 1, indH.number, 5);
    for (let c = 1; c <= 6; c++) {
      const cell = indH.getCell(c);
      cell.font = { name: 'Calibri', size: 13, bold: true, color: { argb: C.white } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.gray } };
      cell.alignment = { vertical: 'middle', horizontal: c <= 5 ? 'left' : 'center' };
      cell.border = thickBorder;
    }
    indH.getCell(6).font = { name: 'Calibri', size: 10, italic: true, color: { argb: C.white } };

    const indSub = ws.addRow(['', 'Ad', 'Soyad', 'Telefon', 'E-posta', '']);
    indSub.height = 22;
    for (let c = 1; c <= 6; c++) {
      const cell = indSub.getCell(c);
      cell.font = { name: 'Calibri', size: 9.5, bold: true, color: { argb: C.gray } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.subBg } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = thinBorder;
    }

    individuals.forEach((ind, idx) => {
      const iRow = ws.addRow(['', ind.firstName, ind.lastName, ind.phone, ind.email, '']);
      iRow.height = 22;
      for (let c = 1; c <= 6; c++) {
        const cell = iRow.getCell(c);
        cell.font = { name: 'Calibri', size: 10.5 };
        cell.alignment = { vertical: 'middle', horizontal: 'left' };
        cell.border = thinBorder;
        if (idx % 2 === 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.altRow } };
      }
    });
  }

  ws.views = [{ state: 'frozen', ySplit: 4 }];

  // ── Kaydet ──
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const fileName = `Emlak_Konut_Ideathon_Izmir_Takimlar_${dateStr}.xlsx`;
  const filePath = path.join(process.cwd(), fileName);
  await workbook.xlsx.writeFile(filePath);

  console.log(`\n${fileName} olusturuldu`);
  console.log(`${filePath}`);
  console.log(`${sortedTeams.length} takim | ${totalParticipants} katilimci`);

  await mongoose.connection.close();
  process.exit(0);
}

main().catch(err => {
  console.error('Hata:', err);
  process.exit(1);
});
