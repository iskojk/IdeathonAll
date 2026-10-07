/**
 * İdeathon bazlı başvuru Excel export
 * 
 * Kullanım:
 *   node src/scripts/exportApplicationsByIdeathon.js
 *   node src/scripts/exportApplicationsByIdeathon.js 69a2e27ebea392d08efbab9a
 *   IDEATHON_ID=699439c0791ff177582e9998 node src/scripts/exportApplicationsByIdeathon.js
 * 
 * Varsayılan: Ideathon Ankara (69a2e27ebea392d08efbab9a)
 */

require('dotenv').config();
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const path = require('path');
const Application = require('../models/Application');
const Ideathon = require('../models/Ideathon');

// İdeathon ID - komut satırı veya env'den al
const IDEATHON_ID = process.argv[2] || process.env.IDEATHON_ID || '6994765efd05fe7ea9267e17';

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
  const d = new Date(date);
  return d.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const formatBirthDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('tr-TR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
};

const getStatusText = (status) => {
  const statusMap = {
    'pending': 'Bekliyor',
    'under_review': 'İnceleniyor',
    'approved': 'Onaylandı',
    'rejected': 'Reddedildi',
    'withdrawn': 'İptal Edildi'
  };
  return statusMap[status] || status;
};

const getParticipantTypeText = (type) => {
  const typeMap = {
    'student': 'Öğrenci',
    'entrepreneur': 'Girişimci',
    'employee': 'Çalışan',
    'recent_graduate': 'Yeni Mezun',
    'other': 'Diğer'
  };
  return typeMap[type] || type;
};

const getEducationLevelText = (level) => {
  const map = {
    'high_school': 'Lise',
    'associate': 'Ön Lisans',
    'bachelor': 'Lisans',
    'master': 'Yüksek Lisans',
    'phd': 'Doktora',
    'other': 'Diğer'
  };
  return map[level] || level || '';
};

// Array veya string array'i virgülle ayrılmış string'e çevir (label veya key olabilir)
const arrayToString = (arr) => {
  if (!arr || !Array.isArray(arr)) return '';
  return arr.join(', ');
};

const createApplicationsExcel = async () => {
  try {
    console.log('📊 İdeathon bazlı başvuru Excel export\n');
    console.log(`📌 İdeathon ID: ${IDEATHON_ID}\n`);

    const ideathon = await Ideathon.findById(IDEATHON_ID).select('name slug').lean();
    const ideathonName = ideathon?.name || 'Ideathon';
    const ideathonSlug = ideathon?.slug || 'ideathon';

    console.log(`📁 İdeathon: ${ideathonName} (${ideathonSlug})\n`);

    const applications = await Application.find({ ideathonId: IDEATHON_ID })
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ ${applications.length} başvuru bulundu\n`);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Emlak Konut';
    workbook.created = new Date();
    workbook.modified = new Date();

    const sheetName = ideathonSlug.replace(/[^\w\s-]/g, '').substring(0, 31) || 'Basvurular';
    const worksheet = workbook.addWorksheet(sheetName, {
      properties: { tabColor: { argb: 'FF2E75B6' } },
      views: [{ state: 'frozen', xSplit: 0, ySplit: 2 }]
    });

    // Başlık satırı - İdeathon bilgisi
    const titleRow = worksheet.addRow([`${ideathonName} - Başvurular`]);
    titleRow.height = 28;
    titleRow.getCell(1).font = {
      name: 'Calibri',
      size: 16,
      bold: true,
      color: { argb: 'FF1E4D8B' }
    };
    titleRow.getCell(1).alignment = { vertical: 'middle', horizontal: 'left' };
    worksheet.mergeCells(1, 1, 1, 38);

    const infoRow = worksheet.addRow({
      A: `Export tarihi: ${formatDate(new Date())} | Toplam: ${applications.length} başvuru`
    });
    infoRow.getCell(1).font = { name: 'Calibri', size: 10, color: { argb: 'FF64748B' } };
    worksheet.mergeCells(2, 1, 2, 38);

    // Kolonlar
    const columns = [
      { header: 'Sıra', key: 'index', width: 6 },
      { header: 'BAŞVURU NO', key: 'applicationNumber', width: 16 },
      { header: 'DURUM', key: 'status', width: 14 },
      { header: 'KATILIMCI DURUMU', key: 'participantStatus', width: 17 },
      { header: 'BAŞVURU TARİHİ', key: 'submittedAt', width: 17 },
      { header: 'AD', key: 'firstName', width: 14 },
      { header: 'SOYAD', key: 'lastName', width: 14 },
      { header: 'TC KİMLİK NO', key: 'tcIdentity', width: 13 },
      { header: 'DOĞUM TARİHİ', key: 'birthDate', width: 14 },
      { header: 'TELEFON', key: 'phone', width: 16 },
      { header: 'E-POSTA', key: 'email', width: 28 },
      { header: 'ŞEHİR', key: 'city', width: 14 },
      { header: 'LINKEDIN', key: 'linkedinProfile', width: 35 },
      { header: 'KATILIMCI TİPİ', key: 'participantType', width: 16 },
      { header: 'OKUL', key: 'school', width: 32 },
      { header: 'BÖLÜM', key: 'department', width: 32 },
      { header: 'SINIF', key: 'grade', width: 10 },
      { header: 'EĞİTİM DURUMU', key: 'educationLevel', width: 18 },
      { header: 'ALAN', key: 'field', width: 28 },
      { header: 'MEZUN YILI', key: 'graduationYear', width: 12 },
      { header: 'TAKIMDA MI?', key: 'isInTeam', width: 12 },
      { header: 'TAKIM ADI', key: 'teamName', width: 24 },
      { header: 'TAKIM BOYUTU', key: 'teamSize', width: 13 },
      { header: 'TAKIM ÜYELERİ', key: 'teamMembers', width: 55 },
      { header: 'GÖZLEM ALANLARI', key: 'observationField', width: 50 },
      { header: 'ÖNCEKİ DENEYİM', key: 'hasPreviousExperience', width: 14 },
      { header: 'DENEYİM AÇIKLAMASI', key: 'previousExperienceDescription', width: 55 },
      { header: 'YETKİNLİKLER', key: 'competencies', width: 50 },
      { header: 'DİĞER YETKİNLİK', key: 'otherCompetency', width: 28 },
      { header: 'KENDİNİ TANIMLAMA', key: 'selfDescription', width: 45 },
      { header: 'MOTİVASYON', key: 'motivation', width: 65 },
      { header: 'PROJE LİNKİ', key: 'projectLink', width: 40 },
      { header: 'VİDEO LİNKİ', key: 'videoLink', width: 40 },
      { header: 'KİŞİSEL WEB', key: 'personalWebsite', width: 40 },
      { header: 'SAĞLIK BEYANI', key: 'healthDeclaration', width: 45 },
      { header: 'ACİL DURUM KİŞİSİ', key: 'emergencyContactName', width: 22 },
      { header: 'ACİL DURUM TEL', key: 'emergencyContactPhone', width: 17 },
      { header: 'BİLGİ DOĞRULUĞU', key: 'informationAccuracy', width: 14 },
      { header: 'KURALLAR', key: 'rulesCompliance', width: 11 },
      { header: 'KVKK', key: 'kvkkConsent', width: 10 },
    ];

    worksheet.columns = columns;

    // Başlık satırı (3. satır - kolonlar)
    const headerRow = worksheet.getRow(3);
    headerRow.height = 30;
    headerRow.font = {
      name: 'Calibri',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' }
    };
    headerRow.fill = {
      type: 'gradient',
      gradient: 'angle',
      degree: 90,
      stops: [
        { position: 0, color: { argb: 'FF1E4D8B' } },
        { position: 1, color: { argb: 'FF2E75B6' } }
      ]
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.border = {
      top: { style: 'medium', color: { argb: 'FF1E4D8B' } },
      left: { style: 'thin', color: { argb: 'FF1E4D8B' } },
      bottom: { style: 'medium', color: { argb: 'FF1E4D8B' } },
      right: { style: 'thin', color: { argb: 'FF1E4D8B' } }
    };

    applications.forEach((app, index) => {
      const row = worksheet.addRow({
        index: index + 1,
        applicationNumber: app.applicationNumber || '',
        status: getStatusText(app.status),
        participantStatus: app.participantStatus === 'not_participant' ? 'Katılımcı Değil' :
          app.participantStatus === 'participant' ? 'Katılımcı' :
            app.participantStatus === 'grouped' ? 'Gruplandırıldı' : app.participantStatus,
        submittedAt: formatDate(app.submittedAt),
        firstName: app.personalInfo?.firstName || '',
        lastName: app.personalInfo?.lastName || '',
        tcIdentity: app.personalInfo?.tcIdentity || '',
        birthDate: formatBirthDate(app.personalInfo?.birthDate),
        phone: app.personalInfo?.phone || '',
        email: app.personalInfo?.email || '',
        city: app.personalInfo?.city || '',
        linkedinProfile: app.socialInfo?.linkedinProfile || '',
        participantType: getParticipantTypeText(app.profileInfo?.participantType),
        school: app.profileInfo?.studentInfo?.school || '',
        department: app.profileInfo?.studentInfo?.department || '',
        grade: app.profileInfo?.studentInfo?.grade || '',
        educationLevel: getEducationLevelText(app.profileInfo?.professionalInfo?.educationLevel),
        field: app.profileInfo?.professionalInfo?.field || '',
        graduationYear: app.profileInfo?.professionalInfo?.graduationYear || '',
        isInTeam: app.teamInfo?.isInTeam ? 'Evet' : 'Hayır',
        teamName: app.teamInfo?.teamName || '',
        teamSize: app.teamInfo?.teamSize || '',
        teamMembers: app.teamInfo?.teamMembers?.map(m =>
          `${m.name} (${m.tcIdentity}) - ${m.role}`
        ).join('; ') || '',
        observationField: arrayToString(app.interestsInfo?.observationField),
        hasPreviousExperience: app.interestsInfo?.hasPreviousExperience ? 'Evet' : 'Hayır',
        previousExperienceDescription: app.interestsInfo?.previousExperienceDescription || '',
        competencies: arrayToString(app.competenciesInfo?.competencies),
        otherCompetency: app.competenciesInfo?.otherCompetency || '',
        selfDescription: app.competenciesInfo?.selfDescription || '',
        motivation: app.competenciesInfo?.motivation || '',
        projectLink: app.additionalInfo?.projectLink || '',
        videoLink: app.additionalInfo?.videoLink || '',
        personalWebsite: app.socialInfo?.personalWebsite || '',
        healthDeclaration: app.healthInfo?.healthDeclaration || '',
        emergencyContactName: app.healthInfo?.emergencyContact?.name || '',
        emergencyContactPhone: app.healthInfo?.emergencyContact?.phone || '',
        informationAccuracy: app.consents?.informationAccuracy ? '✓' : '✗',
        rulesCompliance: app.consents?.rulesCompliance ? '✓' : '✗',
        kvkkConsent: app.consents?.kvkkConsent ? '✓' : '✗',
      });

      const rowNum = row.number;
      row.height = 22;
      row.font = { name: 'Calibri', size: 10 };
      row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'hair', color: { argb: 'FFE0E0E0' } },
          left: { style: 'hair', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'hair', color: { argb: 'FFE0E0E0' } },
          right: { style: 'hair', color: { argb: 'FFE0E0E0' } }
        };
        if (index % 2 === 0) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F7FA' } };
        }
      });

      row.getCell('index').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('status').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('participantStatus').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('isInTeam').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('informationAccuracy').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('rulesCompliance').alignment = { vertical: 'middle', horizontal: 'center' };
      row.getCell('kvkkConsent').alignment = { vertical: 'middle', horizontal: 'center' };

      const statusCell = row.getCell('status');
      const statusColors = {
        approved: 'FF10B981',
        rejected: 'FFEF4444',
        under_review: 'FFF59E0B',
        pending: 'FF94A3B8',
        withdrawn: 'FF475569'
      };
      if (statusColors[app.status]) {
        statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: statusColors[app.status] } };
        statusCell.font = { color: { argb: 'FFFFFFFF' }, bold: true, name: 'Calibri', size: 10 };
      }

      [row.getCell('informationAccuracy'), row.getCell('rulesCompliance'), row.getCell('kvkkConsent')].forEach(cell => {
        cell.font = { size: 12, bold: true, name: 'Calibri' };
        if (cell.value === '✓') cell.font.color = { argb: 'FF10B981' };
        else if (cell.value === '✗') cell.font.color = { argb: 'FFEF4444' };
      });

      row.getCell('applicationNumber').font = { bold: true, color: { argb: 'FF2E75B6' } };

      const linkFields = ['linkedinProfile', 'projectLink', 'videoLink', 'personalWebsite'];
      linkFields.forEach(key => {
        const cell = row.getCell(key);
        const val = cell.value?.toString?.();
        if (val && val.startsWith('http')) {
          cell.value = { text: val, hyperlink: val };
          cell.font = { color: { argb: 'FF0066CC' }, underline: true };
        }
      });
    });

    worksheet.autoFilter = {
      from: { row: 3, column: 1 },
      to: { row: 3, column: columns.length }
    };

    const safeName = ideathonSlug.replace(/[^a-zA-Z0-9-_]/g, '_');
    const fileName = `Basvurular_${safeName}_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.xlsx`;
    const filePath = path.join(process.cwd(), fileName);

    await workbook.xlsx.writeFile(filePath);

    console.log('✅ Excel dosyası oluşturuldu!');
    console.log(`📁 Dosya: ${filePath}`);
    console.log(`📊 Toplam: ${applications.length} başvuru`);
    console.log('\n📊 Durum:');
    console.log(`   - Bekliyor: ${applications.filter(a => a.status === 'pending').length}`);
    console.log(`   - İnceleniyor: ${applications.filter(a => a.status === 'under_review').length}`);
    console.log(`   - Onaylandı: ${applications.filter(a => a.status === 'approved').length}`);
    console.log(`   - Reddedildi: ${applications.filter(a => a.status === 'rejected').length}`);
    console.log(`   - İptal: ${applications.filter(a => a.status === 'withdrawn').length}`);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
};

const main = async () => {
  await connectDB();
  await createApplicationsExcel();
};

main();
