const applicationService = require('../services/applicationService');
const Application = require('../models/Application');
const Team = require('../models/Team');

class ApplicationController {
  // === USER ENDPOINTS (Auth Required) ===

  // Yeni başvuru oluştur (auth gerekli - sadece user rolü)
  async createApplication(req, res) {
    try {
      const applicationData = req.body;

      // Basic validation - personalInfo ve profileInfo zorunlu
      if (!applicationData.personalInfo || !applicationData.profileInfo) {
        return res.status(400).json({
          success: false,
          message: 'Kişisel bilgiler ve profil bilgileri zorunludur'
        });
      }

      // User ID'yi ekle
      applicationData.userId = req.user._id;

      // Multi-Tenant: ideathonId — body'den, query'den veya middleware'den
      if (req.ideathonId) {
        applicationData.ideathonId = req.ideathonId;
      } else if (applicationData.ideathonId) {
        // body'den geliyorsa kabul et
      } else {
        return res.status(400).json({
          success: false,
          message: 'İdeathon bilgisi zorunludur (ideathonId)'
        });
      }

      // Client bilgileri
      const clientInfo = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      };

      const result = await applicationService.createApplication(applicationData, clientInfo);

      // Prevent caching
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      res.status(201).json({
        success: true,
        message: result.message,
        data: {
          applicationNumber: result.application.applicationNumber,
          status: result.application.status,
          submittedAt: result.application.submittedAt
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Başvuru durumunu kontrol et (public - application number ile)
  async checkApplicationStatus(req, res) {
    try {
      const { applicationNumber } = req.params;

      if (!applicationNumber) {
        return res.status(400).json({
          success: false,
          message: 'Başvuru numarası zorunludur'
        });
      }

      const application = await applicationService.getApplicationByNumber(applicationNumber);

      res.status(200).json({
        success: true,
        data: {
          applicationNumber: application.applicationNumber,
          status: application.status,
          displayStatus: application.displayStatus,
          submittedAt: application.submittedAt,
          finalEvaluation: application.finalEvaluation,
          hasEvaluations: application.evaluations.length > 0
        }
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // === ADMIN ENDPOINTS ===

  // Tüm başvuruları listele (admin)
  async getAllApplications(req, res) {
    try {
      const filters = {
        status: req.query.status,
        participantType: req.query.participantType,
        interestField: req.query.interestField,
        city: req.query.city,
        search: req.query.search && req.query.search !== 'undefined' ? req.query.search : undefined,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || '-createdAt'
      };

      // Multi-Tenant: Admin panelde ideathonId filtresi (header/query'den)
      if (req.ideathonId) {
        filters.ideathonId = req.ideathonId;
      }

      const result = await applicationService.getAllApplications(filters, options);

      const participantTypeMap = {
        'student': 'Öğrenci',
        'entrepreneur': 'Girişimci',
        'employee': 'Çalışan',
        'recent_graduate': 'Yeni Mezun',
        'other': 'Diğer'
      };

      const statusMap = {
        'pending': 'Bekliyor',
        'under_review': 'İnceleniyor',
        'approved': 'Onaylandı',
        'rejected': 'Reddedildi',
        'withdrawn': 'İptal Edildi'
      };

      const transformedApplications = result.applications.map(app => {
        const raw = app.toObject ? app.toObject() : app;

        return {
          _id: raw._id,
          ideathonId: raw.ideathonId,
          userId: raw.userId,
          applicationNumber: raw.applicationNumber,
          status: raw.status,
          participantStatus: raw.participantStatus,
          createdAt: raw.createdAt,
          updatedAt: raw.updatedAt,
          submittedAt: raw.submittedAt,
          displayStatus: statusMap[raw.status] || raw.status,
          displayParticipantType: participantTypeMap[raw.profileInfo?.participantType] || raw.profileInfo?.participantType || '',
          fullName: `${raw.personalInfo?.firstName || ''} ${raw.personalInfo?.lastName || ''}`.trim(),
          formData: applicationService.transformToFrontendFormat(raw),
          personalInfo: raw.personalInfo,
          profileInfo: raw.profileInfo,
          socialInfo: raw.socialInfo,
          healthInfo: raw.healthInfo,
          teamInfo: raw.teamInfo,
          interestsInfo: raw.interestsInfo,
          competenciesInfo: raw.competenciesInfo,
          additionalInfo: raw.additionalInfo,
          presentationInfo: raw.presentationInfo,
          consents: raw.consents,
          preEvaluations: raw.preEvaluations,
          evaluations: raw.evaluations,
          finalEvaluation: raw.finalEvaluation,
          ipAddress: raw.ipAddress,
          userAgent: raw.userAgent
        };
      });

      res.status(200).json({
        success: true,
        data: transformedApplications,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Başvuru detayını getir (admin)
  async getApplication(req, res) {
    try {
      const application = await applicationService.getApplicationById(req.params.id);
      const raw = application.toObject ? application.toObject() : application;

      const participantTypeMap = {
        'student': 'Öğrenci',
        'entrepreneur': 'Girişimci',
        'employee': 'Çalışan',
        'recent_graduate': 'Yeni Mezun',
        'other': 'Diğer'
      };

      const statusMap = {
        'pending': 'Bekliyor',
        'under_review': 'İnceleniyor',
        'approved': 'Onaylandı',
        'rejected': 'Reddedildi',
        'withdrawn': 'İptal Edildi'
      };

      const transformed = {
        _id: raw._id,
        ideathonId: raw.ideathonId,
        userId: raw.userId,
        applicationNumber: raw.applicationNumber,
        status: raw.status,
        participantStatus: raw.participantStatus,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        submittedAt: raw.submittedAt,
        displayStatus: statusMap[raw.status] || raw.status,
        displayParticipantType: participantTypeMap[raw.profileInfo?.participantType] || raw.profileInfo?.participantType || '',
        fullName: `${raw.personalInfo?.firstName || ''} ${raw.personalInfo?.lastName || ''}`.trim(),
        formData: applicationService.transformToFrontendFormat(raw),
        personalInfo: raw.personalInfo,
        profileInfo: raw.profileInfo,
        socialInfo: raw.socialInfo,
        healthInfo: raw.healthInfo,
        teamInfo: raw.teamInfo,
        interestsInfo: raw.interestsInfo,
        competenciesInfo: raw.competenciesInfo,
        additionalInfo: raw.additionalInfo,
        consents: raw.consents,
        preEvaluations: raw.preEvaluations,
        evaluations: raw.evaluations,
        finalEvaluation: raw.finalEvaluation,
        ipAddress: raw.ipAddress,
        userAgent: raw.userAgent
      };

      res.status(200).json({
        success: true,
        data: transformed
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ||
                        error.message.includes('Geçersiz') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Başvuru güncelle (admin)
  async updateApplication(req, res) {
    try {
      const updateData = req.body;
      const application = await applicationService.updateApplication(req.params.id, updateData, req.user?._id);

      res.status(200).json({
        success: true,
        message: 'Başvuru başarıyla güncellendi',
        data: application
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Başvuru sil (admin)
  async deleteApplication(req, res) {
    try {
      const result = await applicationService.deleteApplication(req.params.id, req.user?._id);

      res.status(200).json({
        success: true,
        message: result.message
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Kullanıcının önceki başvurusundan kişisel bilgilerini döndür (ön doldurma)
  async getPrefillData(req, res) {
    try {
      const userId = req.user._id;

      const lastApplication = await Application.findOne({
        userId,
        status: { $ne: 'withdrawn' }
      })
        .sort({ createdAt: -1 })
        .select('personalInfo socialInfo')
        .lean();

      if (!lastApplication) {
        return res.status(200).json({
          success: true,
          hasPreviousApplication: false,
          data: null
        });
      }

      res.status(200).json({
        success: true,
        hasPreviousApplication: true,
        data: {
          personalInfo: {
            firstName: lastApplication.personalInfo?.firstName || '',
            lastName: lastApplication.personalInfo?.lastName || '',
            tcIdentity: lastApplication.personalInfo?.tcIdentity || '',
            phone: lastApplication.personalInfo?.phone || '',
            email: lastApplication.personalInfo?.email || '',
            city: lastApplication.personalInfo?.city || '',
            birthDate: lastApplication.personalInfo?.birthDate || null
          },
          socialInfo: {
            linkedinProfile: lastApplication.socialInfo?.linkedinProfile || '',
            personalWebsite: lastApplication.socialInfo?.personalWebsite || ''
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Kullanıcının kendi başvurularını listele
  // Multi-Tenant: ideathonId filtrelemesi eklendi
  async getMyApplications(req, res) {
    try {
      const userId = req.user._id;

      // Multi-Tenant: ideathonId çözümle
      // Sadece açıkça belirtildiğinde filtrele, yoksa tüm başvuruları getir
      // (kullanıcı birden fazla ideathon'a başvuru yapabilir)
      let ideathonId = null;

      // 1. Slug'dan çözümle (?event=slug)
      if (req.query.event) {
        const Ideathon = require('../models/Ideathon');
        const ideathon = await Ideathon.findOne({ slug: req.query.event, status: 'active' })
          .select('_id').lean();
        if (ideathon) ideathonId = ideathon._id;
      }

      // 2. Query param ideathonId
      if (!ideathonId && req.query.ideathonId) {
        ideathonId = req.query.ideathonId;
      }

      // JWT/User model fallback KULLANILMAZ — filtre yoksa tüm ideathon başvuruları gelir

      const filters = {
        status: req.query.status,
        participantStatus: req.query.participantStatus,
        ideathonId: ideathonId || undefined
      };

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || '-createdAt'
      };

      const result = await applicationService.getUserApplications(userId, filters, options);

      // Prevent caching
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      res.status(200).json({
        success: true,
        data: result.applications,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Kullanıcının kendi başvurusunu güncelle
  async updateMyApplication(req, res) {
    try {
      const applicationId = req.params.id;
      const userId = req.user._id;
      const applicationData = req.body;

      // Basic validation - personalInfo ve profileInfo zorunlu
      if (!applicationData.personalInfo || !applicationData.profileInfo) {
        return res.status(400).json({
          success: false,
          message: 'Kişisel bilgiler ve profil bilgileri zorunludur'
        });
      }

      // Client bilgileri
      const clientInfo = {
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent')
      };

      const result = await applicationService.updateUserApplication(applicationId, userId, applicationData, clientInfo);

      // Prevent caching
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.application
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 :
                         error.message.includes('düzenlenemez') ? 403 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Kullanıcının kendi başvurusunu iptal et
  async withdrawMyApplication(req, res) {
    try {
      const applicationId = req.params.id;
      const userId = req.user._id;
      const { reason } = req.body;

      const result = await applicationService.withdrawUserApplication(applicationId, userId, reason);

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.application
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 :
                         error.message.includes('iptal edilemez') ? 403 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Başvuru durumunu değiştir (admin)
  async changeApplicationStatus(req, res) {
    try {
      const { status, reason } = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Durum alanı zorunludur'
        });
      }

      const application = await applicationService.changeApplicationStatus(
        req.params.id,
        status,
        reason,
        req.user?._id
      );

      res.status(200).json({
        success: true,
        message: 'Başvuru durumu başarıyla güncellendi',
        data: application
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // === JURI ENDPOINTS ===

  // Juri değerlendirmesi ekle/güncelle
  async addJuriEvaluation(req, res) {
    try {
      const { score, comment } = req.body;

      if (score === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Puan alanı zorunludur'
        });
      }

      const application = await applicationService.addJuriEvaluation(
        req.params.id,
        req.user._id,
        { score, comment },
        req.ideathonId
      );

      res.status(200).json({
        success: true,
        message: 'Değerlendirmeniz başarıyla kaydedildi',
        data: application
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Juri için başvuru detayını getir
  async getApplicationDetailForJuri(req, res) {
    try {
      const applicationId = req.params.id;
      const juriId = req.user._id;

      const result = await applicationService.getApplicationDetailForJuri(applicationId, juriId, req.ideathonId);

      // Türkçe çeviriler
      const transformed = result.application.toObject ? result.application.toObject() : result.application;

      // Competencies'leri Türkçe'ye çevir
      if (transformed.competenciesInfo?.competencies) {
        const competenciesMap = {
          'problem_analysis': 'Problem analizi ve araştırma',
          'creative_solutions': 'Yenilikçi çözüm üretme',
          'user_experience': 'Kullanıcı deneyimi ve tasarım',
          'presentation': 'Sunum ve hikâyeleştirme',
          'technical_development': 'Teknik geliştirme (yazılım / donanım)',
          'social_impact': 'Sosyal etki ve topluluk çalışmaları'
        };
        transformed.competenciesInfo.competencies = transformed.competenciesInfo.competencies
          .map(c => competenciesMap[c])
          .filter(Boolean);
      }

      // İlgi alanlarını Türkçe'ye çevir
      if (transformed.interestsInfo?.observationField) {
        const observationFieldMap = {
          'site_management': 'Site yönetiminin dijitalleşmesi',
          'mobile_living': 'Mobil yaşam ve topluluk yönetimi',
          'predictive_maintenance': 'Prediktif bakım ve saha operasyonları',
          'energy_efficiency': 'Enerji verimliliği ve sürdürülebilirlik',
          'security_access': 'Güvenlik ve erişim yönetimi',
          'data_platform': 'Veri platformu ve entegrasyonlar'
        };
        transformed.interestsInfo.observationField = transformed.interestsInfo.observationField
          .map(field => observationFieldMap[field])
          .filter(Boolean);
      }

      // Participant type'ı Türkçe'ye çevir
      if (transformed.profileInfo?.participantType) {
        const participantTypeMap = {
          'student': 'Öğrenci',
          'entrepreneur': 'Girişimci',
          'employee': 'Çalışan',
          'recent_graduate': 'Yeni Mezun',
          'other': 'Diğer'
        };
        transformed.displayParticipantType = participantTypeMap[transformed.profileInfo.participantType] || transformed.profileInfo.participantType;
      }

      // Status'u Türkçe'ye çevir
      if (transformed.status) {
        const statusMap = {
          'pending': 'Bekliyor',
          'under_review': 'İnceleniyor',
          'approved': 'Onaylandı',
          'rejected': 'Reddedildi',
          'withdrawn': 'İptal Edildi'
        };
        transformed.displayStatus = statusMap[transformed.status] || transformed.status;
      }

      // Full name ekle
      if (transformed.personalInfo) {
        transformed.fullName = `${transformed.personalInfo.firstName || ''} ${transformed.personalInfo.lastName || ''}`.trim();
      }

      // Takım bilgisi
      transformed.applicationType = transformed.teamInfo?.isInTeam ? 'team' : 'individual';
      transformed.displayApplicationType = transformed.teamInfo?.isInTeam ? 'Takım' : 'Bireysel';

      // Juri'nin kendi ön değerlendirmesi (sadece kendi değerlendirmesini görebilir)
      transformed.myPreEvaluation = result.myPreEvaluation;

      res.status(200).json({
        success: true,
        data: transformed
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 :
                         error.message.includes('yetki') ? 403 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Juri için başvuruları listele (değerlendirme için)
  async getApplicationsForJuri(req, res) {
    try {
      const filters = {
        status: req.query.status,
        participantType: req.query.participantType,
        city: req.query.city,
        search: req.query.search && req.query.search !== 'undefined' ? req.query.search : undefined,
        startDate: req.query.startDate,
        endDate: req.query.endDate,
        hasMyEvaluation: req.query.hasMyEvaluation // juri'nin değerlendirip değerlendirmediği
      };

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || '-createdAt'
      };

      const result = await applicationService.getApplicationsForJuri(req.user._id, filters, options, req.ideathonId);

      // Juri paneli için competencies'leri ve diğer alanları Türkçe'ye çevir
      const transformedApplications = result.applications.map(app => {
        const transformed = app.toObject ? app.toObject() : app;

        // Competencies'leri Türkçe'ye çevir
        if (transformed.competenciesInfo?.competencies) {
          const competenciesMap = {
            'problem_analysis': 'Problem analizi ve araştırma',
            'creative_solutions': 'Yenilikçi çözüm üretme',
            'user_experience': 'Kullanıcı deneyimi ve tasarım',
            'presentation': 'Sunum ve hikâyeleştirme',
            'technical_development': 'Teknik geliştirme (yazılım / donanım)',
            'social_impact': 'Sosyal etki ve topluluk çalışmaları'
          };
          transformed.competenciesInfo.competencies = transformed.competenciesInfo.competencies
            .map(c => competenciesMap[c])
            .filter(Boolean);
        }

        // İlgi alanlarını Türkçe'ye çevir
        if (transformed.interestsInfo?.observationField) {
          const observationFieldMap = {
            'site_management': 'Site yönetiminin dijitalleşmesi',
            'mobile_living': 'Mobil yaşam ve topluluk yönetimi',
            'predictive_maintenance': 'Prediktif bakım ve saha operasyonları',
            'energy_efficiency': 'Enerji verimliliği ve sürdürülebilirlik',
            'security_access': 'Güvenlik ve erişim yönetimi',
            'data_platform': 'Veri platformu ve entegrasyonlar'
          };
          transformed.interestsInfo.observationField = transformed.interestsInfo.observationField
            .map(field => observationFieldMap[field])
            .filter(Boolean);
        }

        // Participant type'ı Türkçe'ye çevir
        if (transformed.profileInfo?.participantType) {
          const participantTypeMap = {
            'student': 'Öğrenci',
            'entrepreneur': 'Girişimci',
            'employee': 'Çalışan',
            'recent_graduate': 'Yeni Mezun',
            'other': 'Diğer'
          };
          transformed.displayParticipantType = participantTypeMap[transformed.profileInfo.participantType] || transformed.profileInfo.participantType;
        }

        // Status'u Türkçe'ye çevir
        if (transformed.status) {
          const statusMap = {
            'pending': 'Bekliyor',
            'under_review': 'İnceleniyor',
            'approved': 'Onaylandı',
            'rejected': 'Reddedildi',
            'withdrawn': 'İptal Edildi'
          };
          transformed.displayStatus = statusMap[transformed.status] || transformed.status;
        }

        // Full name ekle
        if (transformed.personalInfo) {
          transformed.fullName = `${transformed.personalInfo.firstName || ''} ${transformed.personalInfo.lastName || ''}`.trim();
        }

        // Takım bilgisi özeti
        transformed.applicationType = transformed.teamInfo?.isInTeam ? 'team' : 'individual';
        transformed.displayApplicationType = transformed.teamInfo?.isInTeam ? 'Takım' : 'Bireysel';
        if (transformed.teamInfo?.isInTeam && transformed.teamInfo?.teamName) {
          transformed.teamSummary = {
            teamName: transformed.teamInfo.teamName,
            teamSize: transformed.teamInfo.teamSize || transformed.teamInfo.teamMembers?.length || 1
          };
        }

        // Juri'nin bu başvuruyu değerlendirip değerlendirmediğini kontrol et
        const myEvaluation = transformed.evaluations?.find(
          evaluation => evaluation.juriId.toString() === req.user._id.toString()
        );
        transformed.hasMyEvaluation = !!myEvaluation;
        transformed.myEvaluation = myEvaluation || null;

        // Juri'nin bu başvuruya yaptığı ön değerlendirmeyi kontrol et
        const myPreEvaluation = transformed.preEvaluations?.find(
          preEval => preEval.juriId.toString() === req.user._id.toString()
        );
        transformed.hasMyPreEvaluation = !!myPreEvaluation;
        transformed.myPreEvaluation = myPreEvaluation || null;

        return transformed;
      });

      res.status(200).json({
        success: true,
        data: transformedApplications,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Juri'nin değerlendirdiği başvuruları getir
  async getJuriEvaluations(req, res) {
    try {
      const filters = {
        status: req.query.status
      };

      const evaluations = await applicationService.getJuriEvaluations(req.user._id, filters, req.ideathonId);

      res.status(200).json({
        success: true,
        data: evaluations,
        count: evaluations.length
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // === STATISTICS ENDPOINTS ===

  // Başvuru istatistikleri
  async getApplicationStats(req, res) {
    try {
      const filters = {};
      if (req.ideathonId) filters.ideathonId = req.ideathonId;

      const stats = await applicationService.getApplicationStats(filters);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Dashboard istatistikleri
  async getDashboardStats(req, res) {
    try {
      const filters = {};
      if (req.ideathonId) filters.ideathonId = req.ideathonId;

      const stats = await applicationService.getDashboardStats(filters);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // === PARTICIPANT MANAGEMENT ===

  // Katılımcı onayla
  async approveParticipant(req, res) {
    try {
      const application = await applicationService.approveParticipant(req.params.id, req.user?._id, req.ideathonId);

      res.status(200).json({
        success: true,
        message: 'Katılımcı başarıyla onaylandı',
        data: application
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Katılımcıyı reddet
  async rejectParticipant(req, res) {
    try {
      const application = await applicationService.rejectParticipant(req.params.id, req.user?._id, req.ideathonId);

      res.status(200).json({
        success: true,
        message: 'Katılımcı başarıyla reddedildi',
        data: application
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Katılımcıları listele
  async getParticipants(req, res) {
    try {
      const filters = {
        participantStatus: req.query.participantStatus,
        city: req.query.city,
        search: req.query.search && req.query.search !== 'undefined' ? req.query.search : undefined
      };

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || '-createdAt'
      };

      // Multi-Tenant: ideathonId filtresi
      if (req.ideathonId) filters.ideathonId = req.ideathonId;

      const result = await applicationService.getParticipants(filters, options);

      res.status(200).json({
        success: true,
        data: result.participants,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Katılımcı istatistikleri
  async getParticipantStats(req, res) {
    try {
      const filters = {};
      if (req.ideathonId) filters.ideathonId = req.ideathonId;

      const stats = await applicationService.getParticipantStats(filters);

      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // === TEAM MANAGEMENT ===

  // Manuel takım oluştur
  async createTeam(req, res) {
    try {
      const teamData = req.body;

      // Validation
      if (!teamData.teamName || !teamData.members || teamData.members.length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Takım adı ve en az 2 üye zorunludur'
        });
      }

      const team = await applicationService.createTeam(teamData, req.user._id, req.ideathonId);

      res.status(201).json({
        success: true,
        message: 'Takım başarıyla oluşturuldu',
        data: team
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Rastgele takımlar oluştur
  async createRandomTeams(req, res) {
    try {
      const { teamSize } = req.body;

      if (!teamSize || teamSize < 2 || teamSize > 10) {
        return res.status(400).json({
          success: false,
          message: 'Takım boyutu 2-10 arası olmalıdır'
        });
      }

      // Multi-Tenant: ideathonId filtresi
      const partFilters = {};
      if (req.ideathonId) partFilters.ideathonId = req.ideathonId;

      // Tüm participant'ları al
      const { participants } = await applicationService.getParticipants(partFilters, { limit: 1000 });
      const teams = await applicationService.createRandomTeams(participants, teamSize, req.user._id, req.ideathonId);

      res.status(201).json({
        success: true,
        message: `${teams.length} takım başarıyla oluşturuldu`,
        data: teams
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Takımları listele
  async getTeams(req, res) {
    try {
      const filters = {
        creationMethod: req.query.creationMethod
      };

      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        sort: req.query.sort || '-createdAt'
      };

      // Multi-Tenant: ideathonId filtresi
      if (req.ideathonId) filters.ideathonId = req.ideathonId;

      const result = await applicationService.getTeams(filters, options);

      res.status(200).json({
        success: true,
        data: result.teams,
        pagination: result.pagination
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // === PRESENTATION AND PROJECT DESCRIPTION (V2) ===

  // Sunum dosyası yükle veya güncelle
  async uploadPresentation(req, res) {
    try {
      const applicationId = req.params.id;
      const userId = req.user._id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Sunum dosyası zorunludur'
        });
      }

      const fileData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        path: req.file.path,
        size: req.file.size,
        mimetype: req.file.mimetype,
        uploadedAt: new Date()
      };

      const result = await applicationService.uploadPresentation(applicationId, userId, fileData);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          presentationInfo: result.application.presentationInfo
        }
      });
    } catch (error) {
      // Hata durumunda upload edilen dosyayı sil
      if (req.file && req.file.path) {
        const fs = require('fs');
        try {
          fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
          console.error('Dosya silinirken hata:', unlinkError);
        }
      }

      const statusCode = error.message.includes('bulunamadı') ? 404 :
                         error.message.includes('yetkiniz') ? 403 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Proje açıklaması ekle veya güncelle
  async updateProjectDescription(req, res) {
    try {
      const applicationId = req.params.id;
      const userId = req.user._id;
      const { projectDescription } = req.body;

      if (!projectDescription) {
        return res.status(400).json({
          success: false,
          message: 'Proje açıklaması zorunludur'
        });
      }

      if (projectDescription.length > 5000) {
        return res.status(400).json({
          success: false,
          message: 'Proje açıklaması en fazla 5000 karakter olabilir'
        });
      }

      const result = await applicationService.updateProjectDescription(applicationId, userId, projectDescription);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          presentationInfo: result.application.presentationInfo
        }
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 :
                         error.message.includes('yetkiniz') ? 403 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Sunum dosyasını sil
  async deletePresentation(req, res) {
    try {
      const applicationId = req.params.id;
      const userId = req.user._id;

      const result = await applicationService.deletePresentation(applicationId, userId);

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          presentationInfo: result.application.presentationInfo
        }
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 :
                         error.message.includes('yetkiniz') ? 403 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Sunum bilgilerini getir (sadece kendi başvurusu)
  async getPresentationInfo(req, res) {
    try {
      const applicationId = req.params.id;
      const userId = req.user._id;

      const result = await applicationService.getPresentationInfo(applicationId, userId);

      res.status(200).json({
        success: true,
        data: result.presentationInfo
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 :
                         error.message.includes('yetkiniz') ? 403 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // === PRE-EVALUATION ROUTES (Juri V2) ===

  // Juri ön değerlendirme ekle veya güncelle
  async addPreEvaluation(req, res) {
    try {
      const applicationId = req.params.id;
      const juriId = req.user._id;
      const { decision, comment } = req.body;

      // Validation
      if (!decision) {
        return res.status(400).json({
          success: false,
          message: 'Karar alanı zorunludur'
        });
      }

      const validDecisions = ['approve', 'reject', 'undecided'];
      if (!validDecisions.includes(decision)) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz karar. Geçerli değerler: approve, reject, undecided'
        });
      }

      const result = await applicationService.addPreEvaluation(
        applicationId,
        juriId,
        { decision, comment },
        req.ideathonId
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: {
          preEvaluation: result.preEvaluation,
          hasMyPreEvaluation: true,
          applicationId: applicationId,
          applicationNumber: result.applicationNumber
        }
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 :
                         error.message.includes('yetki') ? 403 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Juri'nin kendi yaptığı ön değerlendirmeyi getir
  async getMyPreEvaluation(req, res) {
    try {
      const applicationId = req.params.id;
      const juriId = req.user._id;

      const result = await applicationService.getMyPreEvaluation(applicationId, juriId, req.ideathonId);

      res.status(200).json({
        success: true,
        data: {
          preEvaluation: result.preEvaluation
        }
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // Tüm ön değerlendirmeleri getir (belirli bir başvuru için)
  async getAllPreEvaluations(req, res) {
    try {
      const applicationId = req.params.id;

      const result = await applicationService.getAllPreEvaluations(applicationId);

      res.status(200).json({
        success: true,
        data: {
          preEvaluations: result.preEvaluations,
          summary: result.summary
        }
      });
    } catch (error) {
      const statusCode = error.message.includes('bulunamadı') ? 404 : 500;

      res.status(statusCode).json({
        success: false,
        message: error.message
      });
    }
  }

  // === APPROVED APPLICATIONS TEAM MANAGEMENT (V3) ===

  // Onaylı başvuruların takım ve bireysel listesi
  async getApprovedTeamsAndIndividuals(req, res) {
    try {
      // Multi-Tenant: ideathonId filtresi
      const appQuery = { status: 'approved' };
      if (req.ideathonId) appQuery.ideathonId = req.ideathonId;

      // Sadece onaylanmış başvuruları getir
      const approvedApplications = await Application.find(appQuery)
        .select('personalInfo teamInfo applicationNumber submittedAt')
        .sort({ 'teamInfo.isInTeam': -1, 'teamInfo.teamName': 1, 'personalInfo.firstName': 1 })
        .lean();

      // Takımları ve bireyselleri ayır
      const teams = [];
      const individuals = [];
      const teamMap = new Map(); // Takım adına göre gruplama için

      approvedApplications.forEach(app => {
        const isInTeam = app.teamInfo?.isInTeam;
        const teamName = app.teamInfo?.teamName?.trim();

        if (isInTeam && teamName) {
          // Takımlı başvuru (hem orijinal takımlar hem de takıma eklenen bireysel)
          if (!teamMap.has(teamName)) {
            teamMap.set(teamName, {
              teamName: teamName,
              members: [],
              applicationIds: [],
              addedMembers: [] // Takıma sonradan eklenen üyeler için
            });
          }

          const team = teamMap.get(teamName);
          
          // Başvuruyu yapan kişiyi ekle (proje sahibi veya takıma eklenen bireysel)
          const ownerFirstName = app.personalInfo?.firstName || '';
          const ownerLastName = app.personalInfo?.lastName || '';
          const ownerFullName = `${ownerFirstName} ${ownerLastName}`.trim().toLowerCase();
          const ownerTC = app.personalInfo?.tcIdentity || '';
          
          // Bu başvurunun orijinal teamMembers'ı var mı? (yoksa takıma sonradan eklenmiş bireysel)
          const hasOriginalTeamMembers = app.teamInfo?.teamMembers && 
                                        Array.isArray(app.teamInfo.teamMembers) && 
                                        app.teamInfo.teamMembers.length > 0;

          const projectOwner = {
            applicationId: app._id.toString(),
            firstName: ownerFirstName,
            lastName: ownerLastName,
            tcIdentity: ownerTC,
            phone: app.personalInfo?.phone || '',
            email: app.personalInfo?.email || '',
            role: hasOriginalTeamMembers ? 'Proje Sahibi' : 'Takıma Eklenen Üye (Bireysel)',
            isProjectOwner: hasOriginalTeamMembers,
            isAddedIndividual: !hasOriginalTeamMembers
          };

          team.members.push(projectOwner);
          team.applicationIds.push(app._id.toString());

          // Takıma sonradan eklenen bireysel ise not et
          if (!hasOriginalTeamMembers) {
            team.addedMembers.push(app._id.toString());
          }

          // Orijinal takım üyelerini ekle (varsa)
          if (hasOriginalTeamMembers) {
            app.teamInfo.teamMembers.forEach((member, idx) => {
              const memberFullName = (member.name || '').trim().toLowerCase();
              const memberTC = member.tcIdentity || '';
              
              // Çift kayıt kontrolü - hem TC hem ad-soyad ile kontrol et
              const isDuplicateByTC = memberTC && memberTC === ownerTC;
              const isDuplicateByName = memberFullName && memberFullName === ownerFullName;
              
              if (!isDuplicateByTC && !isDuplicateByName) {
                // Parse ad-soyad
                const nameParts = (member.name || '').trim().split(' ');
                const firstName = nameParts[0] || '';
                const lastName = nameParts.slice(1).join(' ') || '';
                
                team.members.push({
                  firstName: firstName,
                  lastName: lastName,
                  tcIdentity: memberTC,
                  role: member.role || 'Takım Üyesi',
                  isProjectOwner: false,
                  isAddedIndividual: false,
                  memberIndex: idx,
                  ownerApplicationId: app._id.toString()
                });
              }
            });
          }

        } else {
          // Bireysel başvuru (hiçbir takımda değil)
          individuals.push({
            applicationId: app._id.toString(),
            applicationNumber: app.applicationNumber,
            firstName: app.personalInfo?.firstName || '',
            lastName: app.personalInfo?.lastName || '',
            fullName: `${app.personalInfo?.firstName || ''} ${app.personalInfo?.lastName || ''}`.trim(),
            tcIdentity: app.personalInfo?.tcIdentity || '',
            phone: app.personalInfo?.phone || '',
            email: app.personalInfo?.email || '',
            submittedAt: app.submittedAt
          });
        }
      });

      // Map'i array'e çevir
      teamMap.forEach(team => teams.push(team));

      // Superadmin/admin tarafından oluşturulan harici takımları (başvurusuz) merge et
      if (req.ideathonId) {
        const applicationTeamNames = Array.from(teamMap.keys());
        const candidateTeams = await Team.find({
          ideathonId: req.ideathonId,
          isActive: true,
          teamName: { $nin: applicationTeamNames },
          'members.0': { $exists: true }
        }).populate('createdBy', 'role').lean();

        const adHocTeams = candidateTeams.filter(t =>
          t.createdBy && ['superadmin', 'admin'].includes(t.createdBy.role)
        );

        adHocTeams.forEach(t => {
          teams.push({
            teamName: t.teamName,
            teamId: t._id.toString(),
            members: (t.members || []).map((m) => ({
              firstName: (m.name || '').split(' ')[0] || '',
              lastName: (m.name || '').split(' ').slice(1).join(' ') || '',
              tcIdentity: m.tcIdentity || '',
              email: m.email || '',
              role: m.role || 'Üye',
              isProjectOwner: false,
              isAddedIndividual: false,
              memberId: m._id ? m._id.toString() : null
            })),
            applicationIds: [],
            addedMembers: [],
            isAdHoc: true
          });
        });
      }

      // Takıma eklenen bireysel üye sayısı
      const totalAddedIndividuals = teams.reduce((sum, team) => sum + (team.addedMembers?.length || 0), 0);

      res.status(200).json({
        success: true,
        data: {
          teams: teams,
          individuals: individuals,
          stats: {
            totalApproved: approvedApplications.length,
            totalTeams: teams.length,
            totalIndividuals: individuals.length,
            totalTeamMembers: teams.reduce((sum, team) => sum + team.members.length, 0),
            totalAddedToTeams: totalAddedIndividuals
          }
        }
      });

    } catch (error) {
      console.error('Onaylı takımlar/bireyler getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Onaylı başvurular getirilirken hata oluştu'
      });
    }
  }

  // Bireysel başvuruyu takıma ekle
  async addIndividualToTeam(req, res) {
    try {
      const { individualApplicationId, targetTeamName } = req.body;

      // Validasyon
      if (!individualApplicationId || !targetTeamName) {
        return res.status(400).json({
          success: false,
          message: 'Başvuru ID ve hedef takım adı zorunludur'
        });
      }

      // Multi-Tenant: ideathonId filtresi
      const appQuery = { _id: individualApplicationId };
      if (req.ideathonId) appQuery.ideathonId = req.ideathonId;

      // Bireysel başvuruyu bul
      const individualApp = await Application.findOne(appQuery);
      
      if (!individualApp) {
        return res.status(404).json({
          success: false,
          message: 'Başvuru bulunamadı'
        });
      }

      // Onaylı mı kontrol et
      if (individualApp.status !== 'approved') {
        return res.status(400).json({
          success: false,
          message: 'Sadece onaylı başvurular takıma eklenebilir'
        });
      }

      // Zaten takımda mı kontrol et
      if (individualApp.teamInfo?.isInTeam) {
        return res.status(400).json({
          success: false,
          message: 'Bu başvuru zaten bir takımda'
        });
      }

      // Hedef takımın var olup olmadığını kontrol et
      const teamQuery = {
        status: 'approved',
        'teamInfo.isInTeam': true,
        'teamInfo.teamName': targetTeamName.trim()
      };
      if (req.ideathonId) teamQuery.ideathonId = req.ideathonId;
      const targetTeamApp = await Application.findOne(teamQuery);

      if (!targetTeamApp) {
        return res.status(404).json({
          success: false,
          message: 'Hedef takım bulunamadı'
        });
      }

      // Bireysel başvuruyu takıma ekle
      individualApp.teamInfo = {
        ...individualApp.teamInfo,
        isInTeam: true,
        teamName: targetTeamName.trim(),
        teamMembers: [] // Bireysel olduğu için boş
      };

      await individualApp.save();

      res.status(200).json({
        success: true,
        message: `${individualApp.personalInfo.firstName} ${individualApp.personalInfo.lastName} başarıyla ${targetTeamName} takımına eklendi`,
        data: {
          application: {
            _id: individualApp._id,
            personalInfo: individualApp.personalInfo,
            teamInfo: individualApp.teamInfo
          }
        }
      });

    } catch (error) {
      console.error('Takıma üye ekleme hatası:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Takıma üye eklenirken hata oluştu'
      });
    }
  }

  // Takımdan üye çıkar (opsiyonel - ilerde lazım olabilir)
  async removeIndividualFromTeam(req, res) {
    try {
      const { applicationId } = req.params;

      // Multi-Tenant: ideathonId filtresi
      const query = { _id: applicationId };
      if (req.ideathonId) query.ideathonId = req.ideathonId;
      const application = await Application.findOne(query);
      
      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Başvuru bulunamadı'
        });
      }

      if (!application.teamInfo?.isInTeam) {
        return res.status(400).json({
          success: false,
          message: 'Bu başvuru zaten takımda değil'
        });
      }

      // Takım bilgilerini sıfırla
      application.teamInfo.isInTeam = false;
      application.teamInfo.teamName = '';

      await application.save();

      res.status(200).json({
        success: true,
        message: 'Üye takımdan başarıyla çıkarıldı',
        data: {
          application: {
            _id: application._id,
            personalInfo: application.personalInfo,
            teamInfo: application.teamInfo
          }
        }
      });

    } catch (error) {
      console.error('Takımdan üye çıkarma hatası:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Takımdan üye çıkarılırken hata oluştu'
      });
    }
  }

  // === FRONTEND TEAM MANAGEMENT ENDPOINTS ===

  // Kullanıcının kendi takım bilgilerini getir
  async getMyTeamInfo(req, res) {
    try {
      const userId = req.user._id;

      // Kullanıcının approved başvurusunu bul
      const application = await Application.findOne({ 
        userId, 
        status: 'approved' 
      }).select('teamInfo personalInfo applicationNumber');

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Onaylanmış başvuru bulunamadı'
        });
      }

      res.json({
        success: true,
        data: {
          applicationId: application._id,
          applicationNumber: application.applicationNumber,
          personalInfo: {
            firstName: application.personalInfo?.firstName,
            lastName: application.personalInfo?.lastName,
            email: application.personalInfo?.email
          },
          teamInfo: application.teamInfo || {
            isInTeam: false,
            teamName: '',
            teamSize: 0,
            teamMembers: []
          }
        }
      });
    } catch (error) {
      console.error('getMyTeamInfo error:', error);
      res.status(500).json({
        success: false,
        message: 'Takım bilgileri getirilirken hata oluştu',
        error: error.message
      });
    }
  }

  // Takım bilgilerini güncelle (takım adı ve açıklama)
  async updateMyTeamInfo(req, res) {
    try {
      const userId = req.user._id;
      const { isInTeam, teamName } = req.body;

      // Kullanıcının approved başvurusunu bul
      const application = await Application.findOne({ 
        userId, 
        status: 'approved' 
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Onaylanmış başvuru bulunamadı'
        });
      }

      // Validation
      if (isInTeam && !teamName) {
        return res.status(400).json({
          success: false,
          message: 'Takım adı zorunludur'
        });
      }

      if (teamName && teamName.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Takım adı en fazla 100 karakter olabilir'
        });
      }

      // Takım bilgilerini güncelle
      application.teamInfo = application.teamInfo || {};
      application.teamInfo.isInTeam = isInTeam !== undefined ? isInTeam : application.teamInfo.isInTeam;
      application.teamInfo.teamName = teamName !== undefined ? teamName : application.teamInfo.teamName;
      
      // Takım üye sayısını güncelle
      if (application.teamInfo.teamMembers) {
        application.teamInfo.teamSize = application.teamInfo.teamMembers.length + 1; // +1 for team leader
      }

      await application.save();

      res.json({
        success: true,
        message: 'Takım bilgileri güncellendi',
        data: {
          teamInfo: application.teamInfo
        }
      });
    } catch (error) {
      console.error('updateMyTeamInfo error:', error);
      res.status(500).json({
        success: false,
        message: 'Takım bilgileri güncellenirken hata oluştu',
        error: error.message
      });
    }
  }

  // Takıma üye ekle
  async addTeamMember(req, res) {
    try {
      const userId = req.user._id;
      const { name, tcIdentity, role } = req.body;

      // Validation
      if (!name || !tcIdentity) {
        return res.status(400).json({
          success: false,
          message: 'Üye adı ve TC Kimlik No zorunludur'
        });
      }

      // TC Kimlik No validation
      if (!/^[0-9]{11}$/.test(tcIdentity)) {
        return res.status(400).json({
          success: false,
          message: 'TC Kimlik No 11 haneli sayı olmalıdır'
        });
      }

      // Kullanıcının approved başvurusunu bul
      const application = await Application.findOne({ 
        userId, 
        status: 'approved' 
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Onaylanmış başvuru bulunamadı'
        });
      }

      // Takım bilgisi kontrolü
      if (!application.teamInfo?.isInTeam) {
        return res.status(400).json({
          success: false,
          message: 'Önce takım bilgilerini oluşturmalısınız'
        });
      }

      // Maksimum üye kontrolü (takım lideri + 9 üye = 10 kişi)
      if (application.teamInfo.teamMembers && application.teamInfo.teamMembers.length >= 9) {
        return res.status(400).json({
          success: false,
          message: 'Takım en fazla 10 kişi olabilir (siz dahil)'
        });
      }

      // Aynı TC ile üye var mı kontrol et
      const existingMember = application.teamInfo.teamMembers?.find(
        member => member.tcIdentity === tcIdentity
      );

      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: 'Bu TC Kimlik No ile bir üye zaten ekli'
        });
      }

      // Yeni üye ekle
      if (!application.teamInfo.teamMembers) {
        application.teamInfo.teamMembers = [];
      }

      application.teamInfo.teamMembers.push({
        name: name.trim(),
        tcIdentity: tcIdentity.trim(),
        role: role ? role.trim() : 'Takım Üyesi'
      });

      // Takım boyutunu güncelle
      application.teamInfo.teamSize = application.teamInfo.teamMembers.length + 1;

      await application.save();

      res.status(201).json({
        success: true,
        message: 'Takım üyesi başarıyla eklendi',
        data: {
          teamInfo: application.teamInfo
        }
      });
    } catch (error) {
      console.error('addTeamMember error:', error);
      res.status(500).json({
        success: false,
        message: 'Takım üyesi eklenirken hata oluştu',
        error: error.message
      });
    }
  }

  // Takım üyesini güncelle
  async updateTeamMember(req, res) {
    try {
      const userId = req.user._id;
      const { memberIndex } = req.params;
      const { name, tcIdentity, role } = req.body;

      // Validation
      if (!name && !tcIdentity && !role) {
        return res.status(400).json({
          success: false,
          message: 'Güncellenecek en az bir alan belirtmelisiniz'
        });
      }

      // TC Kimlik No validation (eğer gönderildiyse)
      if (tcIdentity && !/^[0-9]{11}$/.test(tcIdentity)) {
        return res.status(400).json({
          success: false,
          message: 'TC Kimlik No 11 haneli sayı olmalıdır'
        });
      }

      // Kullanıcının approved başvurusunu bul
      const application = await Application.findOne({ 
        userId, 
        status: 'approved' 
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Onaylanmış başvuru bulunamadı'
        });
      }

      // Takım üyesi kontrolü
      const index = parseInt(memberIndex);
      if (isNaN(index) || index < 0 || index >= application.teamInfo.teamMembers.length) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz üye index'
        });
      }

      // Aynı TC ile başka üye var mı kontrol et (kendisi hariç)
      if (tcIdentity) {
        const existingMember = application.teamInfo.teamMembers.findIndex(
          (member, idx) => member.tcIdentity === tcIdentity && idx !== index
        );

        if (existingMember !== -1) {
          return res.status(400).json({
            success: false,
            message: 'Bu TC Kimlik No ile başka bir üye zaten ekli'
          });
        }
      }

      // Üye bilgilerini güncelle
      if (name) application.teamInfo.teamMembers[index].name = name.trim();
      if (tcIdentity) application.teamInfo.teamMembers[index].tcIdentity = tcIdentity.trim();
      if (role) application.teamInfo.teamMembers[index].role = role.trim();

      await application.save();

      res.json({
        success: true,
        message: 'Takım üyesi güncellendi',
        data: {
          teamInfo: application.teamInfo
        }
      });
    } catch (error) {
      console.error('updateTeamMember error:', error);
      res.status(500).json({
        success: false,
        message: 'Takım üyesi güncellenirken hata oluştu',
        error: error.message
      });
    }
  }

  // Takım üyesini sil
  async deleteTeamMember(req, res) {
    try {
      const userId = req.user._id;
      const { memberIndex } = req.params;

      // Kullanıcının approved başvurusunu bul
      const application = await Application.findOne({ 
        userId, 
        status: 'approved' 
      });

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Onaylanmış başvuru bulunamadı'
        });
      }

      // Takım üyesi kontrolü
      const index = parseInt(memberIndex);
      if (isNaN(index) || index < 0 || index >= application.teamInfo.teamMembers.length) {
        return res.status(400).json({
          success: false,
          message: 'Geçersiz üye index'
        });
      }

      // Üyeyi sil
      application.teamInfo.teamMembers.splice(index, 1);

      // Takım boyutunu güncelle
      application.teamInfo.teamSize = application.teamInfo.teamMembers.length + 1;

      await application.save();

      res.json({
        success: true,
        message: 'Takım üyesi silindi',
        data: {
          teamInfo: application.teamInfo
        }
      });
    } catch (error) {
      console.error('deleteTeamMember error:', error);
      res.status(500).json({
        success: false,
        message: 'Takım üyesi silinirken hata oluştu',
        error: error.message
      });
    }
  }
  /**
   * Takım adını güncelle - tüm ilgili Application'lar + Team
   * PUT /api/applications/approved/team-name
   * Body: { oldTeamName, newTeamName }
   */
  async updateApprovedTeamName(req, res) {
    try {
      const { oldTeamName, newTeamName } = req.body;

      if (!oldTeamName || !newTeamName || !newTeamName.trim()) {
        return res.status(400).json({ success: false, message: 'Eski ve yeni takım adı zorunludur' });
      }

      const appQuery = { status: 'approved', 'teamInfo.isInTeam': true, 'teamInfo.teamName': oldTeamName.trim() };
      if (req.ideathonId) appQuery.ideathonId = req.ideathonId;

      const result = await Application.updateMany(appQuery, {
        $set: { 'teamInfo.teamName': newTeamName.trim() }
      });

      // Team modelini de güncelle
      const teamQuery = { teamName: oldTeamName.trim(), isActive: true };
      if (req.ideathonId) teamQuery.ideathonId = req.ideathonId;
      await Team.updateMany(teamQuery, { $set: { teamName: newTeamName.trim() } });

      res.json({
        success: true,
        message: `Takım adı güncellendi (${result.modifiedCount} başvuru)`,
      });
    } catch (error) {
      console.error('updateApprovedTeamName error:', error);
      res.status(500).json({ success: false, message: error.message || 'Takım adı güncellenirken hata oluştu' });
    }
  }

  /**
   * Takım liderinin (proje sahibi) bilgilerini güncelle - sadece Application.personalInfo
   * PUT /api/applications/approved/:applicationId/leader-info
   */
  async updateApprovedLeaderInfo(req, res) {
    try {
      const { applicationId } = req.params;
      const { firstName, lastName, email, phone } = req.body;

      const appQuery = { _id: applicationId, status: 'approved' };
      if (req.ideathonId) appQuery.ideathonId = req.ideathonId;

      const application = await Application.findOne(appQuery);
      if (!application) {
        return res.status(404).json({ success: false, message: 'Başvuru bulunamadı' });
      }

      if (firstName !== undefined) application.personalInfo.firstName = firstName.trim();
      if (lastName !== undefined) application.personalInfo.lastName = lastName.trim();
      if (email !== undefined) application.personalInfo.email = email.trim().toLowerCase();
      if (phone !== undefined) application.personalInfo.phone = phone.trim();

      await application.save();

      res.json({
        success: true,
        message: 'Lider bilgileri güncellendi',
        data: { personalInfo: application.personalInfo }
      });
    } catch (error) {
      console.error('updateApprovedLeaderInfo error:', error);
      res.status(500).json({ success: false, message: error.message || 'Lider bilgileri güncellenirken hata oluştu' });
    }
  }

  /**
   * Takım üyesini güncelle - hem Application.teamInfo.teamMembers hem de Team.members
   * PUT /api/applications/approved/:applicationId/team-member/:memberIndex
   */
  async updateApprovedTeamMember(req, res) {
    try {
      const { applicationId, memberIndex } = req.params;
      const idx = parseInt(memberIndex);
      const { name, tcIdentity, role } = req.body;

      const appQuery = { _id: applicationId, status: 'approved' };
      if (req.ideathonId) appQuery.ideathonId = req.ideathonId;

      const application = await Application.findOne(appQuery);
      if (!application) {
        return res.status(404).json({ success: false, message: 'Başvuru bulunamadı' });
      }

      if (!application.teamInfo?.teamMembers || idx < 0 || idx >= application.teamInfo.teamMembers.length) {
        return res.status(404).json({ success: false, message: 'Üye bulunamadı' });
      }

      const member = application.teamInfo.teamMembers[idx];
      if (name !== undefined) member.name = name.trim();
      if (tcIdentity !== undefined) member.tcIdentity = tcIdentity.trim();
      if (role !== undefined) member.role = role.trim();

      application.markModified('teamInfo');
      await application.save();

      // Team modeline de senkronize et
      try {
        const applicationService = require('../services/applicationService');
        await applicationService._syncApplicationTeamToTeamModel(application);
      } catch (syncErr) {
        console.error('Team sync hatası:', syncErr.message);
      }

      res.json({
        success: true,
        message: 'Üye bilgileri güncellendi',
        data: { member: application.teamInfo.teamMembers[idx] }
      });
    } catch (error) {
      console.error('updateApprovedTeamMember error:', error);
      res.status(500).json({ success: false, message: error.message || 'Üye güncellenirken hata oluştu' });
    }
  }

  /**
   * Takıma yeni üye ekle - hem Application.teamInfo.teamMembers hem de Team.members
   * POST /api/applications/approved/:applicationId/team-member
   */
  async addApprovedTeamMember(req, res) {
    try {
      const { applicationId } = req.params;
      const { name, tcIdentity, role } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Ad Soyad zorunludur' });
      }

      const appQuery = { _id: applicationId, status: 'approved' };
      if (req.ideathonId) appQuery.ideathonId = req.ideathonId;

      const application = await Application.findOne(appQuery);
      if (!application) {
        return res.status(404).json({ success: false, message: 'Başvuru bulunamadı' });
      }

      if (!application.teamInfo) {
        application.teamInfo = { isInTeam: true, teamMembers: [] };
      }
      if (!application.teamInfo.teamMembers) {
        application.teamInfo.teamMembers = [];
      }

      application.teamInfo.teamMembers.push({
        name: name.trim(),
        tcIdentity: (tcIdentity || '').trim(),
        role: (role || 'Üye').trim()
      });
      application.teamInfo.teamSize = application.teamInfo.teamMembers.length;

      application.markModified('teamInfo');
      await application.save();

      try {
        const applicationService = require('../services/applicationService');
        await applicationService._syncApplicationTeamToTeamModel(application);
      } catch (syncErr) {
        console.error('Team sync hatası:', syncErr.message);
      }

      res.status(201).json({
        success: true,
        message: 'Üye eklendi',
        data: { member: application.teamInfo.teamMembers[application.teamInfo.teamMembers.length - 1] }
      });
    } catch (error) {
      console.error('addApprovedTeamMember error:', error);
      res.status(500).json({ success: false, message: error.message || 'Üye eklenirken hata oluştu' });
    }
  }

  /**
   * Takımdan üye sil - hem Application.teamInfo.teamMembers hem de Team.members
   * DELETE /api/applications/approved/:applicationId/team-member/:memberIndex
   */
  async deleteApprovedTeamMember(req, res) {
    try {
      const { applicationId, memberIndex } = req.params;
      const idx = parseInt(memberIndex);

      const appQuery = { _id: applicationId, status: 'approved' };
      if (req.ideathonId) appQuery.ideathonId = req.ideathonId;

      const application = await Application.findOne(appQuery);
      if (!application) {
        return res.status(404).json({ success: false, message: 'Başvuru bulunamadı' });
      }

      if (!application.teamInfo?.teamMembers || idx < 0 || idx >= application.teamInfo.teamMembers.length) {
        return res.status(404).json({ success: false, message: 'Üye bulunamadı' });
      }

      application.teamInfo.teamMembers.splice(idx, 1);
      application.teamInfo.teamSize = application.teamInfo.teamMembers.length;

      application.markModified('teamInfo');
      await application.save();

      try {
        const applicationService = require('../services/applicationService');
        await applicationService._syncApplicationTeamToTeamModel(application);
      } catch (syncErr) {
        console.error('Team sync hatası:', syncErr.message);
      }

      res.json({
        success: true,
        message: 'Üye silindi'
      });
    } catch (error) {
      console.error('deleteApprovedTeamMember error:', error);
      res.status(500).json({ success: false, message: error.message || 'Üye silinirken hata oluştu' });
    }
  }
}

module.exports = new ApplicationController();
