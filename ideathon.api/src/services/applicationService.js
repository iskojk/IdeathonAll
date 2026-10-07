const Application = require('../models/Application');
const User = require('../models/User');
const Team = require('../models/Team');
const emailService = require('./emailService');

// Frontend mapping constants
const participantTypeMap = {
  'student': 'Öğrenci',
  'entrepreneur': 'Girişimci',
  'employee': 'Çalışan',
  'recent_graduate': 'Yeni Mezun',
  'other': 'Diğer'
};

const educationLevelMap = {
  'high_school': 'Lise',
  'associate': 'Ön Lisans',
  'bachelor': 'Lisans',
  'master': 'Yüksek Lisans',
  'phd': 'Doktora',
  'other': 'Diğer'
};


class ApplicationService {

  // Status display mapping
  getDisplayStatus(status) {
    const statusMap = {
      'pending': 'Bekliyor',
      'under_review': 'İnceleniyor',
      'approved': 'Onaylandı',
      'rejected': 'Reddedildi',
      'withdrawn': 'İptal Edildi'
    };
    return statusMap[status] || status;
  }

  // Transform application to frontend form format
  transformToFrontendFormat(application) {
    const { personalInfo, socialInfo, healthInfo, profileInfo, teamInfo, interestsInfo, competenciesInfo, additionalInfo, consents } = application;

    return {
      // Section 1
      adSoyad: `${personalInfo?.firstName || ''} ${personalInfo?.lastName || ''}`.trim(),
      tcKimlik: personalInfo?.tcIdentity || '',
      dogumTarihi: personalInfo?.birthDate ? new Date(personalInfo.birthDate).toISOString().split('T')[0] : '',
      // Section 2
      telefon: personalInfo?.phone || '',
      email: personalInfo?.email || '',
      ikametSehir: personalInfo?.city || '',
      linkedinProfil: socialInfo?.linkedinProfile || '',
      // Section 3
      saglikBeyani: healthInfo?.healthDeclaration || '',
      acilDurumKisi: healthInfo?.emergencyContact?.name || '',
      acilDurumTelefon: healthInfo?.emergencyContact?.phone || '',
      // Section 4
      katilimciTipi: participantTypeMap[profileInfo?.participantType] || '',
      okul: profileInfo?.studentInfo?.school || '',
      bolum: profileInfo?.studentInfo?.department || '',
      sinif: profileInfo?.studentInfo?.grade || '',
      egitimDurumu: educationLevelMap[profileInfo?.professionalInfo?.educationLevel] || '',
      profesyonelBolum: profileInfo?.professionalInfo?.field || '',
      mezuniyetYili: profileInfo?.professionalInfo?.graduationYear ? profileInfo.professionalInfo.graduationYear.toString() : '',
      takimKatilimi: teamInfo?.isInTeam || false,
      takimAdi: teamInfo?.teamName || '',
      takimUyesiSayisi: teamInfo?.teamSize || '',
      takimUyeleri: teamInfo?.teamMembers || [],
      // Section 5
      ilgiAlanlari: interestsInfo?.observationField || [],
      oncekiCalisma: interestsInfo?.hasPreviousExperience ? 'evet' : 'hayir',
      oncekiCalismaAciklama: interestsInfo?.previousExperienceDescription || '',
      // Section 6
      yetkinlikAlanlari: competenciesInfo?.competencies || [],
      digerYetkinlik: competenciesInfo?.otherCompetency || '',
      ucKelime: competenciesInfo?.selfDescription || '',
      katilimMotivasyonu: competenciesInfo?.motivation || '',
      // Section 7
      projeLink: additionalInfo?.projectLink || '',
      tanitimVideo: additionalInfo?.videoLink || '',
      // Section 8
      bilgiDogru: consents?.informationAccuracy || false,
      kurallariKabul: consents?.rulesCompliance || false,
      kvkkOnay: consents?.kvkkConsent || false
    };
  }
  // Yeni başvuru oluştur (auth gerekli)
  async createApplication(applicationData, clientInfo = {}) {
    try {
      // User kontrolü - aynı user aynı ideathon'a birden fazla başvuru yapamaz
      // Farklı ideathon'lara başvuru yapabilir
      const existingApplication = await Application.findOne({
        userId: applicationData.userId,
        ideathonId: applicationData.ideathonId,
        status: { $ne: 'withdrawn' }
      });

      if (existingApplication) {
        throw new Error('Bu ideathon için zaten bir başvurunuz mevcut. Aynı ideathona birden fazla başvuru yapamazsınız.');
      }

      // ─── TC Kontrolü: Başvuranın TC'si başka bir başvurunun takım üyesi listesinde mi? ───
      const applicantTc = applicationData.personalInfo?.tcIdentity;
      if (applicantTc && applicationData.ideathonId) {
        const alreadyInTeam = await Application.findOne({
          ideathonId: applicationData.ideathonId,
          userId: { $ne: applicationData.userId },
          status: { $ne: 'withdrawn' },
          'teamInfo.isInTeam': true,
          'teamInfo.teamMembers.tcIdentity': applicantTc
        }).select('teamInfo.teamName applicationNumber').lean();

        if (alreadyInTeam) {
          const teamName = alreadyInTeam.teamInfo?.teamName || '';
          throw new Error(
            `TC Kimlik numaranız "${teamName}" takımında zaten kayıtlıdır. ` +
            `Başka bir başvuruda takım üyesi olarak eklendiğiniz için tekrar başvuru yapmanıza gerek yoktur.`
          );
        }
      }

      // ─── Mevcut Team Varsa teamInfo Otomatik Doldur ───
      // Kullanıcı önce takım oluşturup sonra başvuru yaparsa,
      // teamInfo alanı otomatik olarak Team verisiyle doldurulur.
      if (applicationData.ideathonId && applicationData.userId) {
        try {
          const existingTeam = await Team.findOne({
            createdBy: applicationData.userId,
            ideathonId: applicationData.ideathonId,
            isActive: true
          });

          if (existingTeam) {
            // Kullanıcı başvuru formunda teamInfo göndermemişse veya boş göndermişse → Team'den doldur
            if (!applicationData.teamInfo || !applicationData.teamInfo.isInTeam || !applicationData.teamInfo.teamName) {
              applicationData.teamInfo = {
                isInTeam: true,
                teamName: existingTeam.teamName,
                teamSize: existingTeam.members.length,
                teamMembers: existingTeam.members.map(m => ({
                  name: m.name,
                  tcIdentity: m.tcIdentity || '',
                  role: m.role || 'Takım Üyesi'
                }))
              };
              console.log(`✅ Mevcut Team (${existingTeam._id}) verisi başvuruya otomatik dolduruldu.`);
            }
          }
        } catch (teamCheckError) {
          console.error('Team auto-merge hatası:', teamCheckError.message);
          // Hata ana akışı etkilemesin
        }
      }

      const application = new Application({
        ...applicationData,
        ipAddress: clientInfo.ipAddress,
        userAgent: clientInfo.userAgent
      });

      await application.save();

      // ─── Team Senkronizasyonu: Başvuruda takım varsa Team oluştur/güncelle ───
      try {
        if (application.teamInfo?.isInTeam && application.teamInfo.teamName && application.ideathonId) {
          await this._syncApplicationTeamToTeamModel(application);
        }
      } catch (teamSyncError) {
        // Team sync hatası ana işlemi etkilemesin
        console.error('Team sync hatası (application → team):', teamSyncError.message);
      }

      // Email bildirimlerini gönder (arka planda) - Şimdilik pasif
      /*
      try {
        // Başvuruya email gönder
        await emailService.sendApplicationConfirmationEmail(application);

        // Adminlere yeni başvuru bildirimi gönder
        await emailService.sendNewApplicationNotification(application);
      } catch (emailError) {
        // Email hatası ana işlemi etkilemesin
        console.error('Email gönderme hatası:', emailError.message);
      }
      */

      return {
        application,
        message: 'Başvurunuz başarıyla alındı. Başvuru numaranız: ' + application.applicationNumber
      };
    } catch (error) {
      if (error.code === 11000) {
        throw new Error('Bu başvuru numarası zaten kullanılıyor');
      }
      throw new Error(`Başvuru oluşturulurken hata oluştu: ${error.message}`);
    }
  }

  // Tüm başvuruları listele (admin/juri)
  async getAllApplications(filters = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sort = '-createdAt' } = options;
      const skip = (page - 1) * limit;

      let query = {};

      // Multi-Tenant: ideathonId filtresi
      if (filters.ideathonId) {
        query.ideathonId = filters.ideathonId;
      }

      // Durum filtresi
      if (filters.status) {
        query.status = filters.status;
      }

      // Katılımcı profili filtresi
      if (filters.participantType) {
        query['profileInfo.participantType'] = filters.participantType;
      }

      // İlgi alanı filtresi
      if (filters.interestField) {
        query['interestsInfo.observationField'] = filters.interestField;
      }

      // Şehir filtresi
      if (filters.city) {
        query['personalInfo.city'] = { $regex: filters.city, $options: 'i' };
      }

      // Arama (kişi adı, email, TC, başvuru no, takım adı)
      if (filters.search) {
        query.$or = [
          { 'personalInfo.firstName': { $regex: filters.search, $options: 'i' } },
          { 'personalInfo.lastName': { $regex: filters.search, $options: 'i' } },
          { 'personalInfo.email': { $regex: filters.search, $options: 'i' } },
          { 'personalInfo.tcIdentity': { $regex: filters.search, $options: 'i' } },
          { 'teamInfo.teamName': { $regex: filters.search, $options: 'i' } },
          { applicationNumber: { $regex: filters.search, $options: 'i' } }
        ];
      }

      // Tarih aralığı filtresi
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
          query.createdAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.createdAt.$lte = new Date(filters.endDate);
        }
      }

      const applications = await Application.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('evaluations.juriId', 'name email');

      const total = await Application.countDocuments(query);

      return {
        applications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalApplications: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Başvurular getirilirken hata oluştu: ${error.message}`);
    }
  }

  // Başvuru detayını getir
  async getApplicationById(applicationId) {
    try {
      const application = await Application.findById(applicationId)
        .populate('evaluations.juriId', 'name email');

      if (!application) {
        throw new Error('Başvuru bulunamadı');
      }

      return application;
    } catch (error) {
      if (error.name === 'CastError') {
        throw new Error('Geçersiz başvuru ID');
      }
      throw error;
    }
  }

  // Başvuru numarası ile getir
  async getApplicationByNumber(applicationNumber) {
    try {
      const application = await Application.findOne({ applicationNumber })
        .populate('evaluations.juriId', 'name email');

      if (!application) {
        throw new Error('Başvuru bulunamadı');
      }

      return application;
    } catch (error) {
      throw error;
    }
  }

  // Başvuru güncelle (admin)
  async updateApplication(applicationId, updateData, updatedBy = null) {
    try {
      const application = await Application.findById(applicationId);

      if (!application) {
        throw new Error('Başvuru bulunamadı');
      }

      // Sadece belirli alanları güncelle
      const allowedUpdates = [
        'applicantInfo', 'projectInfo', 'status'
      ];

      allowedUpdates.forEach(field => {
        if (updateData[field] !== undefined) {
          application[field] = updateData[field];
        }
      });

      // Status değiştiğinde final evaluation'ı güncelle
      if (updateData.status && updateData.status !== application.status) {
        if (['approved', 'rejected'].includes(updateData.status)) {
          application.finalEvaluation.finalDecision = updateData.status;
          application.finalEvaluation.evaluatedAt = new Date();
        }
      }

      await application.save();

      return await this.getApplicationById(applicationId);
    } catch (error) {
      throw error;
    }
  }

  // Başvuru sil (admin)
  async deleteApplication(applicationId, deletedBy = null) {
    try {
      const application = await Application.findByIdAndDelete(applicationId);

      if (!application) {
        throw new Error('Başvuru bulunamadı');
      }

      return { message: 'Başvuru başarıyla silindi' };
    } catch (error) {
      throw error;
    }
  }

  // Juri değerlendirmesi ekle/güncelle
  async addJuriEvaluation(applicationId, juriId, evaluationData, ideathonId = null) {
    try {
      const query = { _id: applicationId };
      if (ideathonId) query.ideathonId = ideathonId;

      const application = await Application.findOne(query);

      if (!application) {
        throw new Error('Başvuru bulunamadı');
      }

      const juri = await User.findById(juriId);
      if (!juri || juri.role !== 'juri') {
        throw new Error('Geçersiz juri');
      }

      const { score, comment } = evaluationData;

      // Validation
      if (score === undefined || score < 0 || score > 100) {
        throw new Error('Puan 0-100 arası olmalıdır');
      }

      // Mevcut değerlendirmeyi bul veya yeni oluştur
      const existingEvaluationIndex = application.evaluations.findIndex(
        evaluation => evaluation.juriId.toString() === juriId.toString()
      );

      const evaluation = {
        juriId,
        juriName: juri.name,
        score,
        comment: comment || '',
        evaluationDate: new Date(),
        status: 'completed'
      };

      if (existingEvaluationIndex >= 0) {
        // Güncelle
        application.evaluations[existingEvaluationIndex] = evaluation;
      } else {
        // Yeni ekle
        application.evaluations.push(evaluation);
      }

      // Final evaluation'ı güncelle
      await this.updateFinalEvaluation(application);

      // User modelinde juri operation'ı kaydet
      await juri.addJuriOperation({
        applicationId,
        action: existingEvaluationIndex >= 0 ? 'scored' : 'reviewed',
        score,
        comment
      });

      await application.save();

      return await this.getApplicationById(applicationId);
    } catch (error) {
      throw error;
    }
  }

  // Final evaluation hesapla
  async updateFinalEvaluation(application) {
    const completedEvaluations = application.evaluations.filter(
      evaluation => evaluation.status === 'completed'
    );

    if (completedEvaluations.length > 0) {
      const totalScore = completedEvaluations.reduce((sum, evaluation) => sum + evaluation.score, 0);
      const averageScore = Math.round(totalScore / completedEvaluations.length);

      application.finalEvaluation = {
        averageScore,
        totalEvaluations: completedEvaluations.length,
        evaluatedAt: new Date(),
        finalDecision: application.finalEvaluation.finalDecision || 'pending'
      };
    }
  }

  // Başvuru durumunu değiştir (admin)
  async changeApplicationStatus(applicationId, newStatus, reason = '', changedBy = null) {
    try {
      const application = await Application.findById(applicationId);

      if (!application) {
        throw new Error('Başvuru bulunamadı');
      }

      const validStatuses = ['pending', 'under_review', 'approved', 'rejected', 'withdrawn'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error('Geçersiz durum');
      }

      application.status = newStatus;

      if (newStatus === 'withdrawn') {
        application.withdrawnAt = new Date();
        application.withdrawnReason = reason;
      }

      // Final decision'ı güncelle
      if (['approved', 'rejected'].includes(newStatus)) {
        application.finalEvaluation.finalDecision = newStatus;
        application.finalEvaluation.evaluatedAt = new Date();
      }

      await application.save();

      return await this.getApplicationById(applicationId);
    } catch (error) {
      throw error;
    }
  }

  // İstatistikler
  async getApplicationStats(filters = {}) {
    try {
      const matchQuery = {};
      if (filters.ideathonId) matchQuery.ideathonId = filters.ideathonId;

      // ideathonId varsa filtrelenmiş stats, yoksa tüm stats
      if (Object.keys(matchQuery).length > 0) {
        const mongoose = require('mongoose');
        matchQuery.ideathonId = new mongoose.Types.ObjectId(matchQuery.ideathonId);

        const stats = await Application.aggregate([
          { $match: matchQuery },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]);

        const total = stats.reduce((sum, s) => sum + s.count, 0);
        const byStatus = stats.reduce((acc, s) => { acc[s._id] = s.count; return acc; }, {});

        return {
          total,
          byStatus,
          pending: byStatus.pending || 0,
          under_review: byStatus.under_review || 0,
          approved: byStatus.approved || 0,
          rejected: byStatus.rejected || 0,
          withdrawn: byStatus.withdrawn || 0
        };
      }

      return await Application.getStats();
    } catch (error) {
      throw new Error(`İstatistikler alınırken hata oluştu: ${error.message}`);
    }
  }

  // Juri için başvuru detayını getir
  async getApplicationDetailForJuri(applicationId, juriId, ideathonId = null) {
    try {
      const juri = await User.findById(juriId);

      if (!juri || juri.role !== 'juri') {
        throw new Error('Geçersiz juri yetkisi');
      }

      const query = { _id: applicationId };
      if (ideathonId) query.ideathonId = ideathonId;

      const application = await Application.findOne(query)
        .populate('evaluations.juriId', 'name email');

      if (!application) {
        throw new Error('Başvuru bulunamadı');
      }

      // Juri'nin kendi ön değerlendirmesi (sadece kendi değerlendirmesini görebilir)
      const myPreEvaluation = application.preEvaluations.find(
        preEval => preEval.juriId.toString() === juriId.toString()
      ) || null;

      return {
        application,
        myPreEvaluation
      };
    } catch (error) {
      throw error;
    }
  }

  // Juri için başvuruları listele (değerlendirme için)
  async getApplicationsForJuri(juriId, filters = {}, options = {}, ideathonId = null) {
    try {
      const juri = await User.findById(juriId);

      if (!juri || juri.role !== 'juri') {
        throw new Error('Geçersiz juri yetkisi');
      }

      const { page = 1, limit = 10, sort = '-createdAt' } = options;
      const skip = (page - 1) * limit;

      let query = {};

      // ideathon izolasyonu
      if (ideathonId) {
        query.ideathonId = ideathonId;
      }

      // Durum filtresi (varsayılan olarak tüm başvurular)
      if (filters.status) {
        query.status = filters.status;
      }

      // Katılımcı profili filtresi
      if (filters.participantType) {
        query['profileInfo.participantType'] = filters.participantType;
      }

      // Şehir filtresi
      if (filters.city) {
        query['personalInfo.city'] = { $regex: filters.city, $options: 'i' };
      }

      // Arama (kişi adı, email, başvuru no)
      if (filters.search) {
        query.$or = [
          { 'personalInfo.firstName': { $regex: filters.search, $options: 'i' } },
          { 'personalInfo.lastName': { $regex: filters.search, $options: 'i' } },
          { 'personalInfo.email': { $regex: filters.search, $options: 'i' } },
          { applicationNumber: { $regex: filters.search, $options: 'i' } }
        ];
      }

      // Tarih aralığı filtresi
      if (filters.startDate || filters.endDate) {
        query.createdAt = {};
        if (filters.startDate) {
          query.createdAt.$gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          query.createdAt.$lte = new Date(filters.endDate);
        }
      }

      // Kendi değerlendirmesine göre filtreleme
      if (filters.hasMyEvaluation !== undefined) {
        if (filters.hasMyEvaluation === 'true' || filters.hasMyEvaluation === true) {
          query['evaluations.juriId'] = juriId;
        } else if (filters.hasMyEvaluation === 'false' || filters.hasMyEvaluation === false) {
          query['evaluations.juriId'] = { $ne: juriId };
        }
      }

      const applications = await Application.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('evaluations.juriId', 'name email');

      const total = await Application.countDocuments(query);

      return {
        applications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalApplications: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Başvurular getirilirken hata oluştu: ${error.message}`);
    }
  }

  // Juri'nin değerlendirdiği başvuruları getir
  async getJuriEvaluations(juriId, filters = {}, ideathonId = null) {
    try {
      const juri = await User.findById(juriId);

      if (!juri || juri.role !== 'juri') {
        throw new Error('Geçersiz juri');
      }

      let query = {
        'evaluations.juriId': juriId
      };

      // ideathon izolasyonu
      if (ideathonId) {
        query.ideathonId = ideathonId;
      }

      // Filtreler
      if (filters.status) {
        query.status = filters.status;
      }

      const applications = await Application.find(query)
        .select('applicationNumber projectInfo.projectName status evaluations finalEvaluation createdAt')
        .sort({ createdAt: -1 });

      // Sadece bu juri'nin değerlendirmelerini döndür
      const juriEvaluations = applications.map(app => {
        const juriEvaluation = app.evaluations.find(
          evaluation => evaluation.juriId.toString() === juriId.toString()
        );

        return {
          applicationId: app._id,
          applicationNumber: app.applicationNumber,
          projectName: app.projectInfo.projectName,
          status: app.status,
          evaluation: juriEvaluation,
          finalScore: app.finalEvaluation.averageScore,
          createdAt: app.createdAt
        };
      });

      return juriEvaluations;
    } catch (error) {
      throw error;
    }
  }

  // Dashboard istatistikleri
  async getDashboardStats(filters = {}) {
    try {
      const stats = await this.getApplicationStats(filters);

      // Multi-Tenant: ideathonId filtresi
      const baseQuery = {};
      if (filters.ideathonId) baseQuery.ideathonId = filters.ideathonId;

      // Son 30 gündeki başvurular
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentApplications = await Application.countDocuments({
        ...baseQuery,
        createdAt: { $gte: thirtyDaysAgo }
      });

      // Bekleyen değerlendirmeler
      const pendingEvaluations = await Application.countDocuments({
        ...baseQuery,
        status: 'pending'
      });

      return {
        ...stats,
        recentApplications,
        pendingEvaluations,
        // Ortalama değerlendirme süresi (şimdilik basit)
        averageEvaluationTime: '3-5 gün'
      };
    } catch (error) {
      throw new Error(`Dashboard istatistikleri alınırken hata oluştu: ${error.message}`);
    }
  }

  // === USER APPLICATION MANAGEMENT ===

  // Kullanıcının kendi başvurularını getir
  // Multi-Tenant: ideathonId filtresi eklendi
  async getUserApplications(userId, filters = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sort = '-createdAt' } = options;
      const skip = (page - 1) * limit;

      let query = { userId };

      // Filtreler
      if (filters.status) {
        query.status = filters.status;
      }

      if (filters.participantStatus) {
        query.participantStatus = filters.participantStatus;
      }

      // Multi-Tenant: ideathonId filtresi
      if (filters.ideathonId) {
        query.ideathonId = filters.ideathonId;
      }

      const applications = await Application.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await Application.countDocuments(query);

      const formattedApplications = applications.map(app => ({
        _id: app._id,
        ideathonId: app.ideathonId,
        userId: app.userId,
        applicationNumber: app.applicationNumber,
        status: app.status,
        participantStatus: app.participantStatus,
        submittedAt: app.submittedAt,
        createdAt: app.createdAt,
        updatedAt: app.updatedAt,
        displayStatus: this.getDisplayStatus(app.status),
        displayParticipantType: participantTypeMap[app.profileInfo?.participantType] || '',
        fullName: `${app.personalInfo?.firstName || ''} ${app.personalInfo?.lastName || ''}`.trim(),
        formData: this.transformToFrontendFormat(app),
        personalInfo: app.personalInfo,
        profileInfo: app.profileInfo,
        socialInfo: app.socialInfo,
        healthInfo: app.healthInfo,
        teamInfo: app.teamInfo,
        interestsInfo: app.interestsInfo,
        competenciesInfo: app.competenciesInfo,
        additionalInfo: app.additionalInfo,
        consents: app.consents,
        preEvaluations: app.preEvaluations,
        evaluations: app.evaluations,
        finalEvaluation: app.finalEvaluation,
        ipAddress: app.ipAddress,
        userAgent: app.userAgent
      }));

      return {
        applications: formattedApplications,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Kullanıcı başvuruları getirilirken hata oluştu: ${error.message}`);
    }
  }

  // Kullanıcının kendi başvurusunu güncelle
  async updateUserApplication(applicationId, userId, applicationData, clientInfo = {}) {
    try {
      const application = await Application.findOne({
        _id: applicationId,
        userId: userId
      });

      if (!application) {
        throw new Error('Başvuru bulunamadı');
      }

      // İptal edilmiş başvurular düzenlenemez
      if (application.status === 'withdrawn') {
        throw new Error('İptal edilmiş başvurular düzenlenemez');
      }

      // Güncellemeleri uygula
      Object.keys(applicationData).forEach(key => {
        if (key !== 'userId' && key !== '_id' && key !== 'status' && key !== 'participantStatus') {
          // userId, _id, status ve participantStatus değiştirilemez
          application[key] = applicationData[key];
        }
      });

      // Client bilgileri
      if (clientInfo.ipAddress) application.ipAddress = clientInfo.ipAddress;
      if (clientInfo.userAgent) application.userAgent = clientInfo.userAgent;

      await application.save();

      // ─── Team Senkronizasyonu: Başvuruda takım varsa Team'i güncelle ───
      try {
        if (application.teamInfo?.isInTeam && application.teamInfo.teamName && application.ideathonId) {
          await this._syncApplicationTeamToTeamModel(application);
        }
      } catch (teamSyncError) {
        console.error('Team sync hatası (application update → team):', teamSyncError.message);
      }

      return {
        application: await this.getApplicationById(applicationId),
        message: 'Başvurunuz başarıyla güncellendi'
      };
    } catch (error) {
      throw error;
    }
  }

  // Kullanıcının kendi başvurusunu iptal et
  async withdrawUserApplication(applicationId, userId, reason = '') {
    try {
      const application = await Application.findOne({
        _id: applicationId,
        userId: userId
      });

      if (!application) {
        throw new Error('Başvuru bulunamadı');
      }

      // Sadece pending veya under_review durumundaki başvurular iptal edilebilir
      if (!['pending', 'under_review'].includes(application.status)) {
        throw new Error('Bu başvuruyu iptal edemezsiniz');
      }

      application.status = 'withdrawn';
      application.withdrawnAt = new Date();
      application.withdrawnReason = reason || '';

      await application.save();

      return {
        application: await this.getApplicationById(applicationId),
        message: 'Başvurunuz başarıyla iptal edildi'
      };
    } catch (error) {
      throw error;
    }
  }

  // === PARTICIPANT MANAGEMENT ===

  // Başvuruyu katılımcı olarak onayla
  async approveParticipant(applicationId, approvedBy = null, ideathonId = null) {
    try {
      const query = { _id: applicationId };
      if (ideathonId) query.ideathonId = ideathonId;
      const application = await Application.findOne(query);

      if (!application) {
        throw new Error('Başvuru bulunamadı');
      }

      if (application.status !== 'approved') {
        throw new Error('Sadece onaylanmış başvurular katılımcı olabilir');
      }

      application.participantStatus = 'participant';
      await application.save();

      return await this.getApplicationById(applicationId);
    } catch (error) {
      throw error;
    }
  }

  // Katılımcıyı reddet
  async rejectParticipant(applicationId, rejectedBy = null, ideathonId = null) {
    try {
      const query = { _id: applicationId };
      if (ideathonId) query.ideathonId = ideathonId;
      const application = await Application.findOne(query);

      if (!application) {
        throw new Error('Başvuru bulunamadı');
      }

      application.participantStatus = 'not_participant';
      await application.save();

      return await this.getApplicationById(applicationId);
    } catch (error) {
      throw error;
    }
  }

  // Katılımcıları listele
  async getParticipants(filters = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sort = '-createdAt' } = options;
      const skip = (page - 1) * limit;

      let query = {
        status: 'approved',
        participantStatus: { $in: ['participant', 'grouped'] }
      };

      // Multi-Tenant: ideathonId filtresi
      if (filters.ideathonId) {
        query.ideathonId = filters.ideathonId;
      }

      // İlave filtreler
      if (filters.participantStatus) {
        query.participantStatus = filters.participantStatus;
      }

      if (filters.city) {
        query['personalInfo.city'] = { $regex: filters.city, $options: 'i' };
      }

      if (filters.search) {
        query.$or = [
          { 'personalInfo.firstName': { $regex: filters.search, $options: 'i' } },
          { 'personalInfo.lastName': { $regex: filters.search, $options: 'i' } },
          { 'personalInfo.email': { $regex: filters.search, $options: 'i' } },
          { applicationNumber: { $regex: filters.search, $options: 'i' } }
        ];
      }

      const participants = await Application.find(query)
        .select('personalInfo profileInfo participantStatus teamInfo applicationNumber createdAt')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await Application.countDocuments(query);

      return {
        participants,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalParticipants: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Katılımcılar getirilirken hata oluştu: ${error.message}`);
    }
  }

  // ─────────────────────────────────────────────────────────
  // TEAM ↔ APPLICATION SENKRONİZASYON YARDIMCI FONKSİYONLARI
  // ─────────────────────────────────────────────────────────

  /**
   * Application'daki teamInfo → Team modeline senkronize et.
   * Başvuru oluşturulurken veya güncellenirken çağrılır.
   * Eğer Team yoksa oluşturur, varsa günceller.
   */
  async _syncApplicationTeamToTeamModel(application) {
    const userId = application.userId;
    const ideathonId = application.ideathonId;

    // Mevcut Team var mı kontrol et
    let team = await Team.findOne({
      createdBy: userId,
      ideathonId: ideathonId,
      isActive: true
    });

    // Application'daki üyeleri Team formatına dönüştür
    const teamMembers = (application.teamInfo.teamMembers || []).map(member => ({
      name: member.name,
      tcIdentity: member.tcIdentity || '',
      email: member.email || '',
      role: member.role || 'Takım Üyesi'
    }));

    if (team) {
      // Mevcut Team'i güncelle
      team.teamName = application.teamInfo.teamName;
      team.members = teamMembers;
      if (application.personalInfo?.city) {
        team.city = application.personalInfo.city;
      }
      await team.save();
      console.log(`✅ Team güncellendi (application → team sync): ${team._id}`);
    } else {
      // Yeni Team oluştur
      team = new Team({
        ideathonId: ideathonId,
        teamName: application.teamInfo.teamName,
        teamDescription: '',
        city: application.personalInfo?.city || '',
        members: teamMembers,
        createdBy: userId,
        creationMethod: 'manual',
        isActive: true
      });
      await team.save();
      console.log(`✅ Yeni Team oluşturuldu (application → team sync): ${team._id}`);
    }

    return team;
  }

  /**
   * Team modelindeki değişiklikleri → Application'daki teamInfo'ya senkronize et.
   * Team güncellenirken (üye ekleme/çıkarma/güncelleme) çağrılır.
   * Static method olarak dışarıdan da çağrılabilir.
   */
  async syncTeamToApplication(team) {
    // Bu Team'in sahibinin Application'ını bul
    const application = await Application.findOne({
      userId: team.createdBy,
      ideathonId: team.ideathonId,
      status: { $ne: 'withdrawn' }
    });

    if (!application) {
      console.log(`⚠️ Team sync: Application bulunamadı (userId: ${team.createdBy}, ideathonId: ${team.ideathonId})`);
      return null;
    }

    // Team üyelerini Application formatına dönüştür
    const teamMembers = (team.members || []).map(member => ({
      name: member.name,
      tcIdentity: member.tcIdentity || '',
      role: member.role || 'Takım Üyesi'
    }));

    // Application teamInfo güncelle
    application.teamInfo = {
      ...application.teamInfo,
      isInTeam: true,
      teamName: team.teamName,
      teamSize: team.members.length,
      teamMembers: teamMembers,
      // Mevcut teamId ve teamRole'u koru (admin tarafından atanmışsa)
      teamId: application.teamInfo?.teamId,
      teamRole: application.teamInfo?.teamRole
    };

    await application.save();
    console.log(`✅ Application teamInfo güncellendi (team → application sync): ${application._id}`);

    return application;
  }

  // Katılımcı istatistikleri
  async getParticipantStats(filters = {}) {
    try {
      // Multi-Tenant: ideathonId filtresi
      const baseMatch = {
        status: 'approved',
        participantStatus: { $in: ['participant', 'grouped'] }
      };
      if (filters.ideathonId) {
        const mongoose = require('mongoose');
        baseMatch.ideathonId = new mongoose.Types.ObjectId(filters.ideathonId);
      }

      const stats = await Application.aggregate([
        { $match: baseMatch },
        {
          $group: {
            _id: '$participantStatus',
            count: { $sum: 1 }
          }
        }
      ]);

      const countQuery = { status: 'approved', participantStatus: { $in: ['participant', 'grouped'] } };
      if (filters.ideathonId) countQuery.ideathonId = filters.ideathonId;

      const totalParticipants = await Application.countDocuments(countQuery);

      const groupedParticipants = await Application.countDocuments({
        ...countQuery,
        participantStatus: 'grouped'
      });

      return {
        total: totalParticipants,
        grouped: groupedParticipants,
        ungrouped: totalParticipants - groupedParticipants,
        byStatus: stats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {})
      };
    } catch (error) {
      throw new Error(`Katılımcı istatistikleri alınırken hata oluştu: ${error.message}`);
    }
  }

  // === TEAM MANAGEMENT ===

  // Takım oluştur (manuel)
  async createTeam(teamData, createdBy, ideathonId = null) {
    try {
      const Team = require('../models/Team');

      const team = new Team({
        ...teamData,
        createdBy,
        creationMethod: 'manual',
        ...(ideathonId && { ideathonId })
      });

      await team.save();

      // Takım üyelerini güncelle
      for (const member of team.members) {
        await Application.findByIdAndUpdate(member.applicationId, {
          'teamInfo.isInTeam': true,
          'teamInfo.teamId': team._id,
          'teamInfo.teamName': team.teamName,
          'teamInfo.teamRole': member.role,
          participantStatus: 'grouped'
        });
      }

      return team;
    } catch (error) {
      throw new Error(`Takım oluşturulurken hata oluştu: ${error.message}`);
    }
  }

  // Rastgele takımlar oluştur
  async createRandomTeams(participants, teamSize = 4, createdBy, ideathonId = null) {
    try {
      const Team = require('../models/Team');

      // Sadece participant olanları al
      const availableParticipants = participants.filter(
        p => p.participantStatus === 'participant' && !p.teamInfo.isInTeam
      );

      if (availableParticipants.length < 2) {
        throw new Error('Takım oluşturmak için yeterli katılımcı yok');
      }

      const teams = await Team.createRandomTeams(availableParticipants, teamSize, createdBy);

      // Veritabanına kaydet
      const savedTeams = [];
      for (const team of teams) {
        // Multi-Tenant: ideathonId ekle
        if (ideathonId) team.ideathonId = ideathonId;
        const savedTeam = await team.save();
        savedTeams.push(savedTeam);

        // Takım üyelerini güncelle
        for (const member of savedTeam.members) {
          await Application.findByIdAndUpdate(member.applicationId, {
            'teamInfo.isInTeam': true,
            'teamInfo.teamId': savedTeam._id,
            'teamInfo.teamName': savedTeam.teamName,
            'teamInfo.teamRole': member.role,
            participantStatus: 'grouped'
          });
        }
      }

      return savedTeams;
    } catch (error) {
      throw new Error(`Rastgele takımlar oluşturulurken hata oluştu: ${error.message}`);
    }
  }

  // Takımları listele
  async getTeams(filters = {}, options = {}) {
    try {
      const Team = require('../models/Team');

      const { page = 1, limit = 10, sort = '-createdAt' } = options;
      const skip = (page - 1) * limit;

      let query = { isActive: true };

      // Multi-Tenant: ideathonId filtresi
      if (filters.ideathonId) {
        query.ideathonId = filters.ideathonId;
      }

      if (filters.creationMethod) {
        query.creationMethod = filters.creationMethod;
      }

      const teams = await Team.find(query)
        .populate('createdBy', 'name email')
        .populate('members.applicationId', 'personalInfo applicationNumber')
        .sort(sort)
        .skip(skip)
        .limit(limit);

      const total = await Team.countDocuments(query);

      return {
        teams,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalTeams: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Takımlar getirilirken hata oluştu: ${error.message}`);
    }
  }

  // === PRESENTATION AND PROJECT DESCRIPTION (V2) ===

  // Sunum dosyası yükle veya güncelle
  async uploadPresentation(applicationId, userId, fileData) {
    try {
      const application = await Application.findOne({
        _id: applicationId,
        userId: userId
      });

      if (!application) {
        throw new Error('Başvuru bulunamadı veya bu başvuruya erişim yetkiniz yok');
      }

      // Eski dosyayı sil (varsa)
      if (application.presentationInfo?.presentationFile?.path) {
        const fs = require('fs');
        const oldPath = application.presentationInfo.presentationFile.path;
        try {
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        } catch (error) {
          console.error('Eski dosya silinirken hata:', error);
        }
      }

      // Yeni dosya bilgilerini kaydet
      application.presentationInfo = application.presentationInfo || {};
      application.presentationInfo.presentationFile = fileData;
      application.presentationInfo.lastUpdatedAt = new Date();

      await application.save();

      return {
        application,
        message: 'Sunum dosyası başarıyla yüklendi'
      };
    } catch (error) {
      throw error;
    }
  }

  // Proje açıklaması güncelle
  async updateProjectDescription(applicationId, userId, projectDescription) {
    try {
      const application = await Application.findOne({
        _id: applicationId,
        userId: userId
      });

      if (!application) {
        throw new Error('Başvuru bulunamadı veya bu başvuruya erişim yetkiniz yok');
      }

      // Proje açıklamasını güncelle
      application.presentationInfo = application.presentationInfo || {};
      application.presentationInfo.projectDescription = projectDescription;
      application.presentationInfo.lastUpdatedAt = new Date();

      await application.save();

      return {
        application,
        message: 'Proje açıklaması başarıyla güncellendi'
      };
    } catch (error) {
      throw error;
    }
  }

  // Sunum dosyasını sil
  async deletePresentation(applicationId, userId) {
    try {
      const application = await Application.findOne({
        _id: applicationId,
        userId: userId
      });

      if (!application) {
        throw new Error('Başvuru bulunamadı veya bu başvuruya erişim yetkiniz yok');
      }

      // Dosyayı diskten sil
      if (application.presentationInfo?.presentationFile?.path) {
        const fs = require('fs');
        const filePath = application.presentationInfo.presentationFile.path;
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (error) {
          console.error('Dosya silinirken hata:', error);
        }
      }

      // Database'den temizle
      if (application.presentationInfo) {
        application.presentationInfo.presentationFile = undefined;
        application.presentationInfo.lastUpdatedAt = new Date();
      }

      await application.save();

      return {
        application,
        message: 'Sunum dosyası başarıyla silindi'
      };
    } catch (error) {
      throw error;
    }
  }

  // Sunum bilgilerini getir
  async getPresentationInfo(applicationId, userId) {
    try {
      const application = await Application.findOne({
        _id: applicationId,
        userId: userId
      }).select('presentationInfo applicationNumber');

      if (!application) {
        throw new Error('Başvuru bulunamadı veya bu başvuruya erişim yetkiniz yok');
      }

      return {
        presentationInfo: application.presentationInfo || {
          presentationFile: null,
          projectDescription: null,
          lastUpdatedAt: null
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // === PRE-EVALUATION (V2) ===

  // Juri ön değerlendirmesi ekle veya güncelle
  async addPreEvaluation(applicationId, juriId, evaluationData, ideathonId = null) {
    try {
      const query = { _id: applicationId };
      if (ideathonId) query.ideathonId = ideathonId;

      const application = await Application.findOne(query);

      if (!application) {
        throw new Error('Başvuru bulunamadı');
      }

      const juri = await User.findById(juriId);
      if (!juri || juri.role !== 'juri') {
        throw new Error('Sadece juri kullanıcıları ön değerlendirme yapabilir');
      }

      const { decision, comment } = evaluationData;

      // Validation
      const validDecisions = ['approve', 'reject', 'undecided'];
      if (!validDecisions.includes(decision)) {
        throw new Error('Geçersiz karar değeri');
      }

      // Mevcut ön değerlendirmeyi bul veya yeni oluştur
      const existingIndex = application.preEvaluations.findIndex(
        preEval => preEval.juriId.toString() === juriId.toString()
      );

      const preEvaluation = {
        juriId,
        juriName: juri.name,
        decision,
        comment: comment || '',
        evaluatedAt: existingIndex >= 0 ? application.preEvaluations[existingIndex].evaluatedAt : new Date(),
        updatedAt: new Date()
      };

      let message;
      if (existingIndex >= 0) {
        // Güncelle
        application.preEvaluations[existingIndex] = preEvaluation;
        message = 'Ön değerlendirmeniz başarıyla güncellendi';
      } else {
        // Yeni ekle
        application.preEvaluations.push(preEvaluation);
        message = 'Ön değerlendirmeniz başarıyla kaydedildi';
      }

      await application.save();

      return {
        preEvaluation,
        message,
        applicationNumber: application.applicationNumber
      };
    } catch (error) {
      throw error;
    }
  }

  // Juri'nin kendi yaptığı ön değerlendirmeyi getir
  async getMyPreEvaluation(applicationId, juriId, ideathonId = null) {
    try {
      const query = { _id: applicationId };
      if (ideathonId) query.ideathonId = ideathonId;

      const application = await Application.findOne(query)
        .select('preEvaluations applicationNumber personalInfo');

      if (!application) {
        throw new Error('Başvuru bulunamadı');
      }

      const juri = await User.findById(juriId);
      if (!juri || juri.role !== 'juri') {
        throw new Error('Sadece juri kullanıcıları erişebilir');
      }

      const myPreEvaluation = application.preEvaluations.find(
        preEval => preEval.juriId.toString() === juriId.toString()
      );

      return {
        preEvaluation: myPreEvaluation || null
      };
    } catch (error) {
      throw error;
    }
  }

  // Tüm ön değerlendirmeleri getir (belirli bir başvuru için)
  async getAllPreEvaluations(applicationId) {
    try {
      const application = await Application.findById(applicationId)
        .select('preEvaluations applicationNumber personalInfo')
        .populate('preEvaluations.juriId', 'name email');

      if (!application) {
        throw new Error('Başvuru bulunamadı');
      }

      // Özet istatistik
      const summary = {
        total: application.preEvaluations.length,
        approve: application.preEvaluations.filter(pe => pe.decision === 'approve').length,
        reject: application.preEvaluations.filter(pe => pe.decision === 'reject').length,
        undecided: application.preEvaluations.filter(pe => pe.decision === 'undecided').length
      };

      return {
        preEvaluations: application.preEvaluations,
        summary
      };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ApplicationService();
