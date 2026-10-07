require('dotenv').config();
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const path = require('path');
const User = require('../models/User');
const Application = require('../models/Application');
const Team = require('../models/Team');

const IDEATHON_ID = '69a2e27ebea392d08efbab9a';

const COLORS = {
  teamHeader: 'FFED7D31',
  teamHeaderFont: 'FF000000',
  memberBg: 'FFFFFFFF',
  memberFont: 'FF000000',
  border: 'FFD9D9D9',
};

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB bağlantısı başarılı');
};

const main = async () => {
  await connectDB();

  const applications = await Application.find({
    ideathonId: IDEATHON_ID,
    status: 'approved',
  })
    .populate('userId', 'name email phone')
    .sort({ 'personalInfo.firstName': 1 })
    .lean();

  console.log(`${applications.length} onaylanmış başvuru bulundu`);

  const teamIds = applications.map(a => a.teamInfo?.teamId).filter(Boolean);
  const teamsMap = new Map();
  if (teamIds.length > 0) {
    const teams = await Team.find({ _id: { $in: teamIds } }).lean();
    teams.forEach(t => teamsMap.set(t._id.toString(), t));
  }

  // Group by team
  const teamGroups = new Map();

  for (const app of applications) {
    const teamId = app.teamInfo?.teamId?.toString();
    const teamName = teamId
      ? (teamsMap.get(teamId)?.teamName || app.teamInfo?.teamName || 'Bilinmeyen Takım')
      : (app.teamInfo?.teamName || null);

    const key = teamId || (teamName ? `appteam_${teamName}` : `solo_${app._id}`);

    if (!teamGroups.has(key)) {
      teamGroups.set(key, {
        teamName: teamName || `${app.personalInfo?.firstName || ''} ${app.personalInfo?.lastName || ''} (Bireysel)`,
        team: teamId ? teamsMap.get(teamId) : null,
        applicants: [],
      });
    }
    teamGroups.get(key).applicants.push(app);
  }

  // Build Excel
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Emlak Konut İdeathon';
  workbook.created = new Date();

  const ws = workbook.addWorksheet('Ankara Onaylı Takımlar', {
    properties: { tabColor: { argb: 'FFED7D31' } },
  });

  ws.getColumn(1).width = 45;

  const thinBorder = {
    top: { style: 'thin', color: { argb: COLORS.border } },
    bottom: { style: 'thin', color: { argb: COLORS.border } },
    left: { style: 'thin', color: { argb: COLORS.border } },
    right: { style: 'thin', color: { argb: COLORS.border } },
  };

  const sortedTeams = [...teamGroups.values()].sort((a, b) =>
    (a.teamName || '').localeCompare(b.teamName || '', 'tr')
  );

  for (const group of sortedTeams) {
    // Team header row
    const headerRow = ws.addRow([`Takım: ${group.teamName}`]);
    headerRow.height = 26;
    const hCell = headerRow.getCell(1);
    hCell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: COLORS.teamHeaderFont } };
    hCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.teamHeader } };
    hCell.alignment = { vertical: 'middle', horizontal: 'left' };
    hCell.border = thinBorder;

    // Applicant (team leader / başvuru sahibi)
    for (const app of group.applicants) {
      const firstName = app.personalInfo?.firstName || '';
      const lastName = app.personalInfo?.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim();

      const leaderRow = ws.addRow([`${fullName} (Başvuru Sahibi)`]);
      leaderRow.height = 22;
      const lCell = leaderRow.getCell(1);
      lCell.font = { name: 'Calibri', size: 10.5, bold: true, color: { argb: COLORS.memberFont } };
      lCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.memberBg } };
      lCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      lCell.border = thinBorder;

      // Team members from Application.teamInfo.teamMembers
      const appMembers = app.teamInfo?.teamMembers || [];
      // Team members from Team model
      const teamDoc = group.team;
      const teamDocMembers = teamDoc?.members?.filter(
        m => m.applicationId?.toString() !== app._id.toString()
      ) || [];

      // Prefer Team model members if available, fallback to application teamMembers
      const membersToShow = teamDocMembers.length > 0
        ? teamDocMembers.map(m => m.name || '')
        : appMembers.map(m => m.name || '');

      for (const memberName of membersToShow) {
        if (!memberName) continue;
        const memberRow = ws.addRow([memberName]);
        memberRow.height = 22;
        const mCell = memberRow.getCell(1);
        mCell.font = { name: 'Calibri', size: 10.5, color: { argb: COLORS.memberFont } };
        mCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.memberBg } };
        mCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
        mCell.border = thinBorder;
      }
    }

    // Empty separator row
    const sepRow = ws.addRow(['']);
    sepRow.height = 10;
  }

  ws.pageSetup = { orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0 };

  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const fileName = `Ideathon_Ankara_Onaylanmis_Takimlar_${dateStr}.xlsx`;
  const filePath = path.join(process.cwd(), fileName);
  await workbook.xlsx.writeFile(filePath);

  console.log(`${fileName} oluşturuldu -> ${filePath}`);
  console.log(`Takım: ${sortedTeams.length} | Toplam başvuru: ${applications.length}`);

  await mongoose.connection.close();
  process.exit(0);
};

main().catch(err => {
  console.error('Hata:', err);
  process.exit(1);
});
