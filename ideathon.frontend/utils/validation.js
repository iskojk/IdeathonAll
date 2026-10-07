/**
 * Validation Utilities
 * Form validasyon fonksiyonları
 */

/**
 * Email validasyonu
 */
export const validateEmail = (email) => {
  const regex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return regex.test(email);
};

/**
 * TC Kimlik No validasyonu
 */
export const validateTCIdentity = (tc) => {
  const regex = /^[0-9]{11}$/;
  return regex.test(tc);
};

/**
 * Telefon validasyonu
 */
export const validatePhone = (phone) => {
  const regex = /^[0-9+\-\s()]+$/;
  const digits = phone.replace(/\D/g, '');
  return regex.test(phone) && digits.length >= 10;
};

/**
 * Şifre validasyonu
 */
export const validatePassword = (password) => {
  return password && password.length >= 6;
};

/**
 * Zorunlu alan validasyonu
 */
export const validateRequired = (value) => {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
};

/**
 * Ad Soyad split fonksiyonu
 * Backend'e göndermek için
 */
export const splitFullName = (fullName) => {
  if (!fullName || typeof fullName !== 'string') {
    return { firstName: '', lastName: '' };
  }
  const parts = fullName.trim().split(' ');
  if (parts.length < 2) {
    return { firstName: fullName, lastName: '' };
  }

  const firstName = parts.slice(0, -1).join(' ');
  const lastName = parts[parts.length - 1];

  return { firstName, lastName };
};

/**
 * Takım üyelerini parse et
 */
export const parseTeamMembers = (textAreaValue) => {
  if (!textAreaValue) return [];
  
  return textAreaValue
    .split('\n')
    .filter(line => line.trim())
    .map(line => {
      const [name, role] = line.split('-').map(s => s.trim());
      return { 
        name: name || '', 
        role: role || 'Üye' 
      };
    });
};

/**
 * Observation Field Mapping
 * Frontend -> Backend
 */
export const observationFieldMapping = {
  // Ideathon 2025
  'siteYonetimi': 'site_management',
  'mobilYasam': 'mobile_living',
  'prediktifBakim': 'predictive_maintenance',
  'enerjiVerimliligi': 'energy_efficiency',
  'guvenlikYonetimi': 'security_access',
  'veriPlatformu': 'data_platform',
  // Ideathon Ankara
  'akilliDegerleme': 'smart_valuation',
  'veriOdakliSatis': 'data_driven_sales',
  'dijitalTapu': 'digital_title_deed',
  'kentselZeka': 'urban_intelligence',
  'esgSurdurulebilirlik': 'esg_sustainability',
  'aiKullaniciDeneyimi': 'ai_user_experience',
  // Ideathon Konya
  'asansorTeknolojileri': 'elevator_technologies',
  'robotikSantiye': 'robotic_construction',
  'akilliBinaMobilite': 'smart_building_mobility',
  'yapisalGuvenlik': 'structural_safety_monitoring',
  'veriOdakliSantiye': 'data_driven_construction',
  'surdurulebilirYapi': 'sustainable_modular_construction',
  // Ideathon İzmir
  'enerjiVerimliBina': 'energy_efficient_buildings',
  'yenilenebilirEnerji': 'renewable_energy_systems',
  'elektrikliArac': 'ev_charging_integration',
  'kaynakYonetimi': 'sustainable_resource_management',
  'dijitalEnerji': 'digital_energy_management',
  'akilliAltyapi': 'smart_energy_infrastructure',
};

/**
 * Competencies Mapping
 * Frontend -> Backend
 */
export const competenciesMapping = {
  'problemAnalizi': 'problem_analysis',
  'yenilikciCozum': 'creative_solutions',
  'kullaniciDeneyimi': 'user_experience',
  'sunumHikaye': 'presentation',
  'teknikGelistirme': 'technical_development',
  'sosyalEtki': 'social_impact',
};

/**
 * Participant Type Mapping
 * Frontend -> Backend
 */
export const participantTypeMapping = {
  'ogrenci': 'student',
  'girişimci': 'entrepreneur',
  'calisan': 'employee',
  'yeniMezun': 'recent_graduate',
  'diger': 'other',
};

/**
 * Education Level Mapping
 * Frontend -> Backend
 */
export const educationLevelMapping = {
  'lisans': 'bachelor',
  'yuksekLisans': 'master',
  'doktora': 'phd',
};

/**
 * Form verisini API formatına çevir
 */
export const transformFormDataToAPI = (formData) => {
  const { firstName, lastName } = splitFullName(formData.adSoyad);
  
  const observationField = Array.isArray(formData.ilgiAlanlari) ? formData.ilgiAlanlari : [formData.ilgiAlanlari];
  
  // Competencies'i map et
  const competencies = formData.yetkinlikAlanlari
    .map(value => competenciesMapping[value])
    .filter(Boolean);
  
  // Participant type'ı map et
  const participantType = participantTypeMapping[formData.katilimciTipi] || 'other';
  
  // Education level'ı map et (varsa)
  const educationLevel = formData.egitimDurumu 
    ? educationLevelMapping[formData.egitimDurumu] 
    : undefined;

  const payload = {
    personalInfo: {
      firstName,
      lastName,
      tcIdentity: formData.tcKimlik,
      birthDate: formData.dogumTarihi,
      phone: formData.telefon.replace(/\s/g, ''),
      email: formData.email,
      city: formData.ikametSehir,
    },
    ...(formData.linkedinProfil && {
      socialInfo: {
        linkedinProfile: formData.linkedinProfil,
        personalWebsite: '',
      },
    }),
    ...(formData.saglikBeyani || formData.acilDurumKisi ? {
      healthInfo: {
        healthDeclaration: formData.saglikBeyani || '',
        emergencyContact: formData.acilDurumKisi ? {
          name: formData.acilDurumKisi,
          phone: formData.acilDurumTelefon || '',
        } : undefined,
      },
    } : {}),
    profileInfo: {
      participantType,
      ...(participantType === 'student' && {
        studentInfo: {
          school: formData.okul,
          department: formData.bolum,
          grade: formData.sinif,
        },
      }),
      ...(participantType !== 'student' && formData.egitimDurumu && {
        professionalInfo: {
          educationLevel,
          field: formData.profesyonelBolum,
          graduationYear: parseInt(formData.mezuniyetYili),
        },
      }),
    },
    ...(formData.takimKatilimi && {
      teamInfo: {
        isInTeam: true,
        teamName: formData.takimAdi,
        teamSize: formData.teamMembers ? formData.teamMembers.length : 0,
        teamMembers: formData.teamMembers || [], // teamMembers artık doğrudan array olarak geliyor
      },
    }),
    interestsInfo: {
      observationField,
      hasPreviousExperience: formData.oncekiCalisma === 'evet',
      previousExperienceDescription: formData.oncekiCalismaAciklama || '',
    },
    competenciesInfo: {
      competencies,
      otherCompetency: formData.digerYetkinlik || '',
      selfDescription: formData.ucKelime || '',
      motivation: formData.katilimMotivasyonu,
    },
    ...(formData.projeLink || formData.tanitimVideo ? {
      additionalInfo: {
        projectLink: formData.projeLink || '',
        videoLink: formData.tanitimVideo || '',
      },
    } : {}),
    consents: {
      informationAccuracy: formData.bilgiDogru,
      rulesCompliance: formData.kurallariKabul,
      kvkkConsent: formData.kvkkOnay,
    },
  };

  return payload;
};



