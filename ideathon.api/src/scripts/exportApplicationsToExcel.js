require('dotenv').config();
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const path = require('path');
const Application = require('../models/Application');
const User = require('../models/User');

// MongoDB bağlantısı
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB bağlantısı başarılı');
  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:', error.message);
    process.exit(1);
  }
};

// Tarih formatı
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

// Doğum tarihi formatı (sadece tarih)
const formatBirthDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('tr-TR', { 
    year: 'numeric', 
    month: '2-digit', 
    day: '2-digit'
  });
};

// Status Türkçe dönüşüm
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

// Participant Type Türkçe dönüşüm
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

// Yetkinlikleri Türkçe'ye çevir (applicationController'dan alındı)
const translateCompetencies = (competencies) => {
  if (!competencies || !Array.isArray(competencies)) return '';
  
  const competencyMap = {
    'problem_analysis': 'Problem analizi ve araştırma',
    'creative_solutions': 'Yenilikçi çözüm üretme',
    'user_experience': 'Kullanıcı deneyimi ve tasarım',
    'presentation': 'Sunum ve hikâyeleştirme',
    'technical_development': 'Teknik geliştirme (yazılım / donanım)',
    'social_impact': 'Sosyal etki ve topluluk çalışmaları'
  };
  
  return competencies.map(c => competencyMap[c] || c).join(', ');
};

// Gözlem alanlarını Türkçe'ye çevir (applicationController'dan alındı)
const translateObservationFields = (fields) => {
  if (!fields || !Array.isArray(fields)) return '';
  
  const fieldMap = {
    'site_management': 'Site yönetiminin dijitalleşmesi',
    'mobile_living': 'Mobil yaşam ve topluluk yönetimi',
    'predictive_maintenance': 'Prediktif bakım ve saha operasyonları',
    'energy_efficiency': 'Enerji verimliliği ve sürdürülebilirlik',
    'security_access': 'Güvenlik ve erişim yönetimi',
    'data_platform': 'Veri platformu ve entegrasyonlar'
  };
  
  return fields.map(f => fieldMap[f] || f).join(', ');
};

// Array'i virgülle ayrılmış string'e çevir
const arrayToString = (arr) => {
  if (!arr || !Array.isArray(arr)) return '';
  return arr.join(', ');
};

// Excel'i oluştur
const createApplicationsExcel = async () => {
  try {
    console.log('📊 Başvurular Excel dosyası oluşturuluyor...\n');

    // Tüm başvuruları çek
    const applications = await Application.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    console.log(`✅ ${applications.length} başvuru bulundu\n`);

    // Excel workbook oluştur
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Emlak Konut';
    workbook.created = new Date();
    workbook.modified = new Date();
    
    // Worksheet oluştur
    const worksheet = workbook.addWorksheet('Başvurular', {
      properties: { tabColor: { argb: 'FF2E75B6' } },
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }] // İlk satırı dondur
    });

    // Kolonlar - Optimize edilmiş ve düzenli
    const columns = [
      // Başvuru ve Kullanıcı Bilgileri (En Başta)
      { header: 'BAŞVURU NO', key: 'applicationNumber', width: 16 },
      { header: 'KULLANICI ADI', key: 'userName', width: 20 },
      { header: 'KULLANICI E-POSTA', key: 'userEmail', width: 28 },
      { header: 'DURUM', key: 'status', width: 14 },
      { header: 'KATILIMCI DURUMU', key: 'participantStatus', width: 17 },
      { header: 'BAŞVURU TARİHİ', key: 'submittedAt', width: 17 },
      
      // Kişisel Bilgiler
      { header: 'AD', key: 'firstName', width: 14 },
      { header: 'SOYAD', key: 'lastName', width: 14 },
      { header: 'TC KİMLİK NO', key: 'tcIdentity', width: 13 },
      { header: 'DOĞUM TARİHİ', key: 'birthDate', width: 14 },
      { header: 'TELEFON', key: 'phone', width: 16 },
      { header: 'E-POSTA', key: 'email', width: 28 },
      { header: 'ŞEHİR', key: 'city', width: 14 },
      
      // Sosyal Medya
      { header: 'LINKEDIN PROFİLİ', key: 'linkedinProfile', width: 35 },
      
      // Profil Bilgileri
      { header: 'KATILIMCI TİPİ', key: 'participantType', width: 16 },
      { header: 'OKUL', key: 'school', width: 32 },
      { header: 'BÖLÜM', key: 'department', width: 32 },
      { header: 'SINIF', key: 'grade', width: 10 },
      { header: 'EĞİTİM DURUMU', key: 'educationLevel', width: 18 },
      { header: 'ALAN', key: 'field', width: 28 },
      { header: 'MEZUN YILI', key: 'graduationYear', width: 12 },
      
      // Takım Bilgileri
      { header: 'TAKIMDA MI?', key: 'isInTeam', width: 12 },
      { header: 'TAKIM ADI', key: 'teamName', width: 24 },
      { header: 'TAKIM BOYUTU', key: 'teamSize', width: 13 },
      { header: 'TAKIM ÜYELERİ', key: 'teamMembers', width: 55 },
      
      // İlgi Alanları ve Deneyim
      { header: 'GÖZLEM ALANLARI', key: 'observationField', width: 50 },
      { header: 'ÖNCEKİ DENEYİM VAR MI?', key: 'hasPreviousExperience', width: 18 },
      { header: 'DENEYİM AÇIKLAMASI', key: 'previousExperienceDescription', width: 55 },
      
      // Yetkinlikler ve Motivasyon
      { header: 'YETKİNLİKLER', key: 'competencies', width: 50 },
      { header: 'DİĞER YETKİNLİK', key: 'otherCompetency', width: 28 },
      { header: 'KENDİNİ TANIMLAMA', key: 'selfDescription', width: 45 },
      { header: 'MOTİVASYON', key: 'motivation', width: 65 },
      
      // Ek Bilgiler
      { header: 'PROJE LİNKİ', key: 'projectLink', width: 40 },
      { header: 'VİDEO LİNKİ', key: 'videoLink', width: 40 },
      { header: 'KİŞİSEL WEB SİTESİ', key: 'personalWebsite', width: 40 },
      
      // Sağlık Bilgileri
      { header: 'SAĞLIK BEYANI', key: 'healthDeclaration', width: 45 },
      { header: 'ACİL DURUM KİŞİSİ', key: 'emergencyContactName', width: 22 },
      { header: 'ACİL DURUM TELEFONU', key: 'emergencyContactPhone', width: 17 },
      
      // Onaylar
      { header: 'BİLGİ DOĞRULUĞU', key: 'informationAccuracy', width: 14 },
      { header: 'KURALLAR', key: 'rulesCompliance', width: 11 },
      { header: 'KVKK', key: 'kvkkConsent', width: 10 },
      
      // Metadata (Son)
      { header: 'OLUŞTURMA TARİHİ', key: 'createdAt', width: 17 },
      { header: 'GÜNCELLENME TARİHİ', key: 'updatedAt', width: 17 },
    ];

    worksheet.columns = columns;

    // Başlık satırı stili - Modern ve Profesyonel
    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    headerRow.font = { 
      name: 'Calibri', 
      size: 12, 
      bold: true, 
      color: { argb: 'FFFFFFFF' } 
    };
    headerRow.fill = {
      type: 'gradient',
      gradient: 'angle',
      degree: 90,
      stops: [
        { position: 0, color: { argb: 'FF1E4D8B' } },  // Koyu mavi
        { position: 1, color: { argb: 'FF2E75B6' } }   // Açık mavi
      ]
    };
    headerRow.alignment = { 
      vertical: 'middle', 
      horizontal: 'center',
      wrapText: true
    };
    headerRow.border = {
      top: { style: 'medium', color: { argb: 'FF1E4D8B' } },
      left: { style: 'thin', color: { argb: 'FF1E4D8B' } },
      bottom: { style: 'medium', color: { argb: 'FF1E4D8B' } },
      right: { style: 'thin', color: { argb: 'FF1E4D8B' } }
    };

    // Data satırları ekle
    applications.forEach((app, index) => {
      const row = worksheet.addRow({
        // Başvuru ve Kullanıcı (En Başta)
        applicationNumber: app.applicationNumber || '',
        userName: app.userId?.name || '',
        userEmail: app.userId?.email || '',
        status: getStatusText(app.status),
        participantStatus: app.participantStatus === 'not_participant' ? 'Katılımcı Değil' : 
                          app.participantStatus === 'participant' ? 'Katılımcı' : 
                          app.participantStatus === 'grouped' ? 'Gruplandırıldı' : app.participantStatus,
        submittedAt: formatDate(app.submittedAt),
        
        // Kişisel Bilgiler
        firstName: app.personalInfo?.firstName || '',
        lastName: app.personalInfo?.lastName || '',
        tcIdentity: app.personalInfo?.tcIdentity || '',
        birthDate: formatBirthDate(app.personalInfo?.birthDate),
        phone: app.personalInfo?.phone || '',
        email: app.personalInfo?.email || '',
        city: app.personalInfo?.city || '',
        
        // Sosyal Medya
        linkedinProfile: app.socialInfo?.linkedinProfile || '',
        
        // Profil Bilgileri
        participantType: getParticipantTypeText(app.profileInfo?.participantType),
        school: app.profileInfo?.studentInfo?.school || '',
        department: app.profileInfo?.studentInfo?.department || '',
        grade: app.profileInfo?.studentInfo?.grade || '',
        educationLevel: app.profileInfo?.professionalInfo?.educationLevel || '',
        field: app.profileInfo?.professionalInfo?.field || '',
        graduationYear: app.profileInfo?.professionalInfo?.graduationYear || '',
        
        // Takım Bilgileri
        isInTeam: app.teamInfo?.isInTeam ? 'Evet' : 'Hayır',
        teamName: app.teamInfo?.teamName || '',
        teamSize: app.teamInfo?.teamSize || '',
        teamMembers: app.teamInfo?.teamMembers?.map(m => 
          `${m.name} (${m.tcIdentity}) - ${m.role}`
        ).join('; ') || '',
        
        // İlgi Alanları (Türkçe çevrilmiş)
        observationField: translateObservationFields(app.interestsInfo?.observationField),
        hasPreviousExperience: app.interestsInfo?.hasPreviousExperience ? 'Evet' : 'Hayır',
        previousExperienceDescription: app.interestsInfo?.previousExperienceDescription || '',
        
        // Yetkinlikler (Türkçe çevrilmiş)
        competencies: translateCompetencies(app.competenciesInfo?.competencies),
        otherCompetency: app.competenciesInfo?.otherCompetency || '',
        selfDescription: app.competenciesInfo?.selfDescription || '',
        motivation: app.competenciesInfo?.motivation || '',
        
        // Ek Bilgiler
        projectLink: app.additionalInfo?.projectLink || '',
        videoLink: app.additionalInfo?.videoLink || '',
        personalWebsite: app.socialInfo?.personalWebsite || '',
        
        // Sağlık
        healthDeclaration: app.healthInfo?.healthDeclaration || '',
        emergencyContactName: app.healthInfo?.emergencyContact?.name || '',
        emergencyContactPhone: app.healthInfo?.emergencyContact?.phone || '',
        
        // Onaylar
        informationAccuracy: app.consents?.informationAccuracy ? '✓' : '✗',
        rulesCompliance: app.consents?.rulesCompliance ? '✓' : '✗',
        kvkkConsent: app.consents?.kvkkConsent ? '✓' : '✗',
        
        // Metadata (Son)
        createdAt: formatDate(app.createdAt),
        updatedAt: formatDate(app.updatedAt)
      });

      // Satır stili - Modern ve okunabilir
      row.height = 22;
      row.font = { 
        name: 'Calibri', 
        size: 11
      };
      row.alignment = { 
        vertical: 'middle', 
        horizontal: 'left',
        wrapText: true
      };

      // Alternatif satır rengi (geliştirilmiş zebra striping)
      if (index % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF5F7FA' } // Çok açık mavi gri
        };
      } else {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFFFFF' } // Beyaz
        };
      }

      // Border ekle - modern ve ince
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'hair', color: { argb: 'FFE0E0E0' } },
          left: { style: 'hair', color: { argb: 'FFE0E0E0' } },
          bottom: { style: 'hair', color: { argb: 'FFE0E0E0' } },
          right: { style: 'hair', color: { argb: 'FFE0E0E0' } }
        };
      });

      // Status hücresine modern renk ve stil
      const statusCell = row.getCell('status');
      switch (app.status) {
        case 'approved':
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF10B981' } // Modern yeşil
          };
          statusCell.font = { 
            color: { argb: 'FFFFFFFF' }, 
            bold: true,
            name: 'Calibri',
            size: 11
          };
          break;
        case 'rejected':
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFEF4444' } // Modern kırmızı
          };
          statusCell.font = { 
            color: { argb: 'FFFFFFFF' }, 
            bold: true,
            name: 'Calibri',
            size: 11
          };
          break;
        case 'under_review':
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF59E0B' } // Modern turuncu/sarı
          };
          statusCell.font = { 
            color: { argb: 'FFFFFFFF' }, 
            bold: true,
            name: 'Calibri',
            size: 11
          };
          break;
        case 'pending':
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF94A3B8' } // Modern gri
          };
          statusCell.font = { 
            color: { argb: 'FFFFFFFF' }, 
            bold: true,
            name: 'Calibri',
            size: 11
          };
          break;
        case 'withdrawn':
          statusCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF475569' } // Modern koyu gri
          };
          statusCell.font = { 
            color: { argb: 'FFFFFFFF' }, 
            bold: true,
            name: 'Calibri',
            size: 11
          };
          break;
      }
      statusCell.alignment = { vertical: 'middle', horizontal: 'center' };
      
      // Onay hücrelerine özel stil (✓ ve ✗)
      const accuracyCell = row.getCell('informationAccuracy');
      const rulesCell = row.getCell('rulesCompliance');
      const kvkkCell = row.getCell('kvkkConsent');
      
      [accuracyCell, rulesCell, kvkkCell].forEach(cell => {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.font = { 
          size: 14, 
          bold: true,
          name: 'Calibri'
        };
        
        if (cell.value === '✓') {
          cell.font.color = { argb: 'FF10B981' }; // Yeşil
        } else if (cell.value === '✗') {
          cell.font.color = { argb: 'FFEF4444' }; // Kırmızı
        }
      });
      
      // Katılımcı durumu hücresine renk
      const participantStatusCell = row.getCell('participantStatus');
      participantStatusCell.alignment = { vertical: 'middle', horizontal: 'center' };
      if (participantStatusCell.value === 'Katılımcı' || participantStatusCell.value === 'Gruplandırıldı') {
        participantStatusCell.font = { 
          bold: true, 
          color: { argb: 'FF10B981' },
          name: 'Calibri',
          size: 11
        };
      }
      
      // Başvuru numarası hücresine özel stil
      const appNumberCell = row.getCell('applicationNumber');
      appNumberCell.font = { 
        bold: true, 
        color: { argb: 'FF2E75B6' },
        name: 'Calibri',
        size: 11
      };
      appNumberCell.alignment = { vertical: 'middle', horizontal: 'center' };
      
      // Email hücrelerini özel stil
      const emailCell = row.getCell('email');
      const userEmailCell = row.getCell('userEmail');
      [emailCell, userEmailCell].forEach(cell => {
        if (cell.value) {
          cell.font = { 
            color: { argb: 'FF2563EB' },
            name: 'Calibri',
            size: 10
          };
        }
      });
      
      // Link içeren hücrelere hyperlink özelliği
      const linkedinCell = row.getCell('linkedinProfile');
      if (linkedinCell.value && linkedinCell.value.toString().startsWith('http')) {
        linkedinCell.value = {
          text: linkedinCell.value,
          hyperlink: linkedinCell.value
        };
        linkedinCell.font = { 
          color: { argb: 'FF0066CC' },
          underline: true,
          name: 'Calibri',
          size: 10
        };
      }
      
      const projectLinkCell = row.getCell('projectLink');
      if (projectLinkCell.value && projectLinkCell.value.toString().startsWith('http')) {
        projectLinkCell.value = {
          text: projectLinkCell.value,
          hyperlink: projectLinkCell.value
        };
        projectLinkCell.font = { 
          color: { argb: 'FF0066CC' },
          underline: true,
          name: 'Calibri',
          size: 10
        };
      }
      
      const videoLinkCell = row.getCell('videoLink');
      if (videoLinkCell.value && videoLinkCell.value.toString().startsWith('http')) {
        videoLinkCell.value = {
          text: videoLinkCell.value,
          hyperlink: videoLinkCell.value
        };
        videoLinkCell.font = { 
          color: { argb: 'FF0066CC' },
          underline: true,
          name: 'Calibri',
          size: 10
        };
      }
      
      const websiteCell = row.getCell('personalWebsite');
      if (websiteCell.value && websiteCell.value.toString().startsWith('http')) {
        websiteCell.value = {
          text: websiteCell.value,
          hyperlink: websiteCell.value
        };
        websiteCell.font = { 
          color: { argb: 'FF0066CC' },
          underline: true,
          name: 'Calibri',
          size: 10
        };
      }
    });

    // Otomatik filtre ekle
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length }
    };

    // Dosya adı (tarih ile)
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
    const fileName = `Basvurular_${dateStr}_${timeStr}.xlsx`;
    const filePath = path.join(__dirname, '../../', fileName);

    // Excel dosyasını kaydet
    await workbook.xlsx.writeFile(filePath);

    console.log('✅ Excel dosyası başarıyla oluşturuldu!');
    console.log(`📁 Dosya konumu: ${filePath}`);
    console.log(`📊 Toplam başvuru: ${applications.length}`);
    console.log(`📋 Toplam kolon: ${columns.length}`);
    
    // İstatistikler
    const stats = {
      pending: applications.filter(a => a.status === 'pending').length,
      under_review: applications.filter(a => a.status === 'under_review').length,
      approved: applications.filter(a => a.status === 'approved').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
      withdrawn: applications.filter(a => a.status === 'withdrawn').length
    };
    
    console.log('\n📊 Başvuru Durumları:');
    console.log(`   - Bekliyor: ${stats.pending}`);
    console.log(`   - İnceleniyor: ${stats.under_review}`);
    console.log(`   - Onaylandı: ${stats.approved}`);
    console.log(`   - Reddedildi: ${stats.rejected}`);
    console.log(`   - İptal Edildi: ${stats.withdrawn}`);

    // MongoDB bağlantısını kapat
    await mongoose.connection.close();
    console.log('\n✅ İşlem tamamlandı, bağlantı kapatıldı.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error);
    process.exit(1);
  }
};

// Ana fonksiyon
const main = async () => {
  await connectDB();
  await createApplicationsExcel();
};

// Çalıştır
main();

