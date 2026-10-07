const Application = require('../models/Application');
const TeamEvaluation = require('../models/TeamEvaluation');
const Team = require('../models/Team');
const Ideathon = require('../models/Ideathon');
const User = require('../models/User');

// Ideathon bilgisi degerlendirme suresi boyunca degismez — 60sn TTL cache
const ideathonCache = new Map();
const IDEATHON_CACHE_TTL = 60 * 1000;

async function getCachedIdeathon(ideathonId, selectFields) {
  const key = `${ideathonId}_${selectFields}`;
  const cached = ideathonCache.get(key);
  if (cached && Date.now() - cached.ts < IDEATHON_CACHE_TTL) {
    return cached.data;
  }
  const doc = await Ideathon.findById(ideathonId).select(selectFields).lean();
  ideathonCache.set(key, { data: doc, ts: Date.now() });
  return doc;
}

class JuriController {
  
  // === JURI ENDPOINTS ===

  /**
   * Takımları listele (Juri için)
   * GET /api/juri/teams
   * ideathonId: req.ideathonId (JWT'den)
   */
  async getTeams(req, res) {
    try {
      const juriId = req.user._id;
      const ideathonId = req.ideathonId;

      const ideathon = await getCachedIdeathon(ideathonId, 'type maxTotalScore evaluationCriteria');

      let teams = [];

      if (ideathon && ideathon.type === 'evaluation_only') {
        // evaluation_only: Takimlari dogrudan Team koleksiyonundan cek
        // isActive: true filtresi yeterli — kullanici pasife alindiginda Team.isActive da false yapiliyor
        const teamRecords = await Team.find({ ideathonId, isActive: true })
          .sort({ createdAt: 1 })
          .lean();

        teams = teamRecords.map(t => ({
          teamId: t._id,
          teamName: t.teamName,
          members: (t.members || []).map(m => ({
            firstName: (m.name || '').split(' ')[0] || '',
            lastName: (m.name || '').split(' ').slice(1).join(' ') || '',
            fullName: m.name || '',
            email: m.email || '',
            tcIdentity: m.tcIdentity || '',
            role: m.role || 'Üye',
            isProjectOwner: false,
            isAddedIndividual: false
          })),
          applicationIds: [],
          addedMembers: [],
          presentations: []
        }));
      } else {
        // standard: Mevcut Application-bazlı mantık
        const approvedApplications = await Application.find({
          status: 'approved',
          ideathonId
        })
          .select('personalInfo teamInfo applicationNumber submittedAt presentationInfo')
          .sort({ 'teamInfo.teamName': 1 })
          .lean();

        const teamMap = new Map();

        approvedApplications.forEach(app => {
          const isInTeam = app.teamInfo?.isInTeam;
          const teamName = app.teamInfo?.teamName?.trim();

          if (isInTeam && teamName) {
            if (!teamMap.has(teamName)) {
              teamMap.set(teamName, {
                teamName: teamName,
                members: [],
                applicationIds: [],
                addedMembers: [],
                presentations: []
              });
            }

            const team = teamMap.get(teamName);
            
            const ownerFirstName = app.personalInfo?.firstName || '';
            const ownerLastName = app.personalInfo?.lastName || '';
            const ownerFullName = `${ownerFirstName} ${ownerLastName}`.trim().toLowerCase();
            const ownerTC = app.personalInfo?.tcIdentity || '';
            
            const hasOriginalTeamMembers = app.teamInfo?.teamMembers && 
                                          Array.isArray(app.teamInfo.teamMembers) && 
                                          app.teamInfo.teamMembers.length > 0;

            const projectOwner = {
              applicationId: app._id.toString(),
              firstName: ownerFirstName,
              lastName: ownerLastName,
              fullName: `${ownerFirstName} ${ownerLastName}`.trim(),
              tcIdentity: ownerTC,
              email: app.personalInfo?.email || '',
              phone: app.personalInfo?.phone || '',
              role: hasOriginalTeamMembers ? 'Proje Sahibi' : 'Takıma Eklenen Üye',
              isProjectOwner: hasOriginalTeamMembers,
              isAddedIndividual: !hasOriginalTeamMembers
            };

            team.members.push(projectOwner);
            team.applicationIds.push(app._id.toString());

            if (!hasOriginalTeamMembers) {
              team.addedMembers.push(app._id.toString());
            }

            if (app.presentationInfo) {
              if (app.presentationInfo.presentationFile) {
                team.presentations.push({
                  applicationId: app._id.toString(),
                  fileName: app.presentationInfo.presentationFile.originalName,
                  filePath: app.presentationInfo.presentationFile.path,
                  uploadedAt: app.presentationInfo.presentationFile.uploadedAt,
                  uploadedBy: `${ownerFirstName} ${ownerLastName}`
                });
              }
            }

            if (hasOriginalTeamMembers) {
              app.teamInfo.teamMembers.forEach(member => {
                const memberFullName = (member.name || '').trim().toLowerCase();
                const memberTC = member.tcIdentity || '';
                
                const isDuplicateByTC = memberTC && memberTC === ownerTC;
                const isDuplicateByName = memberFullName && memberFullName === ownerFullName;
                
                if (!isDuplicateByTC && !isDuplicateByName) {
                  const nameParts = (member.name || '').trim().split(' ');
                  const firstName = nameParts[0] || '';
                  const lastName = nameParts.slice(1).join(' ') || '';
                  
                  team.members.push({
                    firstName: firstName,
                    lastName: lastName,
                    fullName: member.name || '',
                    tcIdentity: memberTC,
                    role: member.role || 'Takım Üyesi',
                    isProjectOwner: false,
                    isAddedIndividual: false
                  });
                }
              });
            }
          }
        });

        const teamNames = Array.from(teamMap.keys());
        const teamRecords = await Team.find({
          ideathonId,
          teamName: { $in: teamNames }
        }).select('_id teamName').lean();

        const teamIdMap = new Map();
        teamRecords.forEach(t => teamIdMap.set(t.teamName, t._id));

        teamMap.forEach(team => {
          team.teamId = teamIdMap.get(team.teamName) || null;
          teams.push(team);
        });

        const candidateAdHocTeams = await Team.find({
          ideathonId,
          isActive: true,
          teamName: { $nin: teamNames },
          'members.0': { $exists: true }
        }).populate('createdBy', 'role').lean();

        const adHocTeams = candidateAdHocTeams.filter(t =>
          t.createdBy && ['superadmin', 'admin'].includes(t.createdBy.role)
        );

        adHocTeams.forEach(t => {
          teams.push({
            teamId: t._id,
            teamName: t.teamName,
            members: (t.members || []).map(m => ({
              firstName: (m.name || '').split(' ')[0] || '',
              lastName: (m.name || '').split(' ').slice(1).join(' ') || '',
              fullName: m.name || '',
              email: m.email || '',
              tcIdentity: m.tcIdentity || '',
              role: m.role || 'Üye',
              isProjectOwner: false,
              isAddedIndividual: false
            })),
            applicationIds: [],
            addedMembers: [],
            presentations: [],
            isAdHoc: true
          });
        });
      }

      // Bu jurinin değerlendirmelerini getir
      const myEvaluations = await TeamEvaluation.find({
        juriId,
        ideathonId
      })
        .select('teamName teamId totalScore evaluatedAt')
        .lean();

      const teamsWithEvaluationStatus = teams.map(team => {
        const evaluation = myEvaluations.find(ev =>
          (ev.teamId && team.teamId && ev.teamId.toString() === team.teamId.toString()) ||
          ev.teamName === team.teamName
        );
        return {
          ...team,
          isEvaluated: !!evaluation,
          myScore: evaluation ? evaluation.totalScore : null,
          evaluatedAt: evaluation ? evaluation.evaluatedAt : null
        };
      });

      res.status(200).json({
        success: true,
        data: {
          teams: teamsWithEvaluationStatus,
          stats: {
            totalTeams: teams.length,
            evaluatedTeams: myEvaluations.length,
            pendingTeams: teams.length - myEvaluations.length,
            totalTeamMembers: teams.reduce((sum, team) => sum + team.members.length, 0)
          }
        }
      });

    } catch (error) {
      console.error('Takımlar getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Takımlar getirilirken hata oluştu'
      });
    }
  }

  /**
   * Takımı değerlendir — UPSERT (create or update, concurrent-safe)
   * POST /api/juri/teams/:teamName/evaluate
   * ideathonId: req.ideathonId (JWT'den)
   */
  async evaluateTeam(req, res) {
    try {
      const rawTeamName = req.params.teamName;
      const teamName = decodeURIComponent(rawTeamName);
      const juriId = req.user._id;
      const juriName = req.user.name;
      const juriEmail = req.user.email;
      const ideathonId = req.ideathonId;
      const { criteria, generalComment, status } = req.body;

      if (!teamName || !teamName.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Takım adı zorunludur'
        });
      }

      if (!criteria) {
        return res.status(400).json({
          success: false,
          message: 'Değerlendirme kriterleri zorunludur'
        });
      }

      // Ideathon bilgisini cache'den cek (tip + dinamik kriterler)
      const ideathon = await getCachedIdeathon(ideathonId, 'type evaluationCriteria');

      // Takimin varligini kontrol et — ideathon tipine gore farkli kaynak
      if (ideathon && ideathon.type === 'evaluation_only') {
        const teamRecord = await Team.findOne({
          ideathonId,
          teamName: teamName.trim(),
          isActive: true
        }).lean();
        if (!teamRecord) {
          return res.status(404).json({
            success: false,
            message: 'Takım bulunamadı'
          });
        }
      } else {
        const teamExists = await Application.findOne({
          status: 'approved',
          ideathonId,
          'teamInfo.isInTeam': true,
          'teamInfo.teamName': teamName.trim()
        });
        if (!teamExists) {
          const adHocTeam = await Team.findOne({
            ideathonId,
            teamName: teamName.trim(),
            isActive: true
          }).lean();
          if (!adHocTeam) {
            return res.status(404).json({
              success: false,
              message: 'Takım bulunamadı veya onaylanmamış'
            });
          }
        }
      }

      // Dinamik kriter validasyonu
      if (ideathon && ideathon.evaluationCriteria && ideathon.evaluationCriteria.length > 0) {
        const criteriaConfig = ideathon.evaluationCriteria;
        const configKeyMap = new Map(criteriaConfig.map(c => [c.key, c]));

        for (const cfg of criteriaConfig) {
          if (!criteria[cfg.key] || criteria[cfg.key].score === undefined || criteria[cfg.key].score === null) {
            return res.status(400).json({
              success: false,
              message: `${cfg.name} (${cfg.key}) için puan zorunludur`
            });
          }
          const score = criteria[cfg.key].score;
          if (typeof score !== 'number' || score < 0 || score > cfg.maxScore) {
            return res.status(400).json({
              success: false,
              message: `${cfg.name} puanı 0-${cfg.maxScore} arasında olmalıdır`
            });
          }
        }
      } else {
        // Fallback: evaluationCriteria tanımlanmamış — gelen tüm keyler kabul edilir
        for (const [key, value] of Object.entries(criteria)) {
          if (!value || value.score === undefined || value.score === null) {
            return res.status(400).json({
              success: false,
              message: `${key} için puan zorunludur`
            });
          }
        }
      }

      // Toplam puanı hesapla
      let totalScore = 0;
      for (const value of Object.values(criteria)) {
        if (value && typeof value.score === 'number') {
          totalScore += value.score;
        }
      }

      // Team kaydini atomic bul-veya-olustur (race condition onlemi)
      const team = await Team.findOneAndUpdate(
        { ideathonId, teamName: teamName.trim() },
        {
          $setOnInsert: {
            ideathonId,
            teamName: teamName.trim(),
            members: [],
            createdBy: juriId,
            creationMethod: 'manual'
          }
        },
        { upsert: true, new: true }
      );

      // UPSERT: Atomic create-or-update
      const evaluation = await TeamEvaluation.findOneAndUpdate(
        {
          ideathonId,
          juriId,
          teamId: team._id
        },
        {
          $set: {
            teamName: teamName.trim(),
            juriName,
            juriEmail,
            criteria,
            totalScore,
            generalComment: generalComment || '',
            status: status || 'submitted',
            lastUpdatedAt: new Date()
          },
          $setOnInsert: {
            evaluatedAt: new Date()
          }
        },
        {
          upsert: true,
          new: true,
          runValidators: true
        }
      );

      const isNew = !evaluation.lastUpdatedAt || evaluation.evaluatedAt >= evaluation.lastUpdatedAt;

      res.status(isNew ? 201 : 200).json({
        success: true,
        message: isNew ? 'Değerlendirme başarıyla kaydedildi' : 'Değerlendirme başarıyla güncellendi',
        data: {
          evaluation: {
            _id: evaluation._id,
            teamName: evaluation.teamName,
            teamId: evaluation.teamId,
            totalScore: evaluation.totalScore,
            criteria: evaluation.criteria,
            generalComment: evaluation.generalComment,
            evaluatedAt: evaluation.evaluatedAt
          }
        }
      });

    } catch (error) {
      console.error('Takım değerlendirme hatası:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Bu takımı zaten değerlendirdiniz'
        });
      }

      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validasyon hatası',
          errors
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Değerlendirme kaydedilirken hata oluştu'
      });
    }
  }

  /**
   * Değerlendirmeyi güncelle
   * PUT /api/juri/teams/:teamName/evaluate
   * ideathonId: req.ideathonId (JWT'den)
   */
  async updateEvaluation(req, res) {
    try {
      const rawTeamName = req.params.teamName;
      const teamName = decodeURIComponent(rawTeamName);
      const juriId = req.user._id;
      const ideathonId = req.ideathonId;
      const { criteria, generalComment, status } = req.body;

      // Mevcut değerlendirmeyi bul (ideathonId + juriId + teamName)
      const evaluation = await TeamEvaluation.findOne({
        juriId,
        ideathonId,
        teamName: teamName.trim()
      });

      if (!evaluation) {
        return res.status(404).json({
          success: false,
          message: 'Bu takım için değerlendirme bulunamadı. Önce değerlendirme oluşturun.'
        });
      }

      // Güncelle
      if (criteria) {
        evaluation.criteria = criteria;
      }
      
      if (generalComment !== undefined) {
        evaluation.generalComment = generalComment;
      }
      
      if (status) {
        evaluation.status = status;
      }

      await evaluation.save();

      res.status(200).json({
        success: true,
        message: 'Değerlendirme başarıyla güncellendi',
        data: {
          evaluation: {
            _id: evaluation._id,
            teamName: evaluation.teamName,
            teamId: evaluation.teamId,
            totalScore: evaluation.totalScore,
            criteria: evaluation.criteria,
            generalComment: evaluation.generalComment,
            evaluatedAt: evaluation.evaluatedAt,
            lastUpdatedAt: evaluation.lastUpdatedAt
          }
        }
      });

    } catch (error) {
      console.error('Değerlendirme güncelleme hatası:', error);
      
      if (error.name === 'ValidationError') {
        const errors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validasyon hatası',
          errors
        });
      }

      res.status(500).json({
        success: false,
        message: error.message || 'Değerlendirme güncellenirken hata oluştu'
      });
    }
  }

  /**
   * Kendi değerlendirmelerini getir
   * GET /api/juri/my-evaluations
   * ideathonId: req.ideathonId (JWT'den)
   */
  async getMyEvaluations(req, res) {
    try {
      const juriId = req.user._id;
      const ideathonId = req.ideathonId;
      const { page = 1, limit = 20, sort = '-totalScore' } = req.query;

      const query = { juriId, ideathonId };

      const evaluations = await TeamEvaluation.find(query)
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean();

      const total = await TeamEvaluation.countDocuments(query);

      res.status(200).json({
        success: true,
        data: {
          evaluations,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit)
          },
          stats: {
            totalEvaluations: total,
            averageScore: evaluations.length > 0 
              ? (evaluations.reduce((sum, ev) => sum + ev.totalScore, 0) / evaluations.length).toFixed(2)
              : 0
          }
        }
      });

    } catch (error) {
      console.error('Kendi değerlendirmeleri getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Değerlendirmeler getirilirken hata oluştu'
      });
    }
  }

  /**
   * Belirli takım için kendi değerlendirmesini getir
   * GET /api/juri/teams/:teamName/my-evaluation
   * ideathonId: req.ideathonId (JWT'den)
   */
  async getMyEvaluationForTeam(req, res) {
    try {
      const { teamName } = req.params;
      const juriId = req.user._id;
      const ideathonId = req.ideathonId;

      const decodedTeamName = decodeURIComponent(teamName).trim();

      const evaluation = await TeamEvaluation.findOne({
        juriId,
        ideathonId,
        teamName: decodedTeamName
      }).lean();

      res.status(200).json({
        success: true,
        data: {
          evaluation: evaluation || null
        }
      });

    } catch (error) {
      console.error('Takım değerlendirmesi getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Değerlendirme getirilirken hata oluştu'
      });
    }
  }

  /**
   * Değerlendirme kriterlerini getir (dinamik)
   * GET /api/juri/criteria
   * ideathonId: req.ideathonId (JWT'den)
   */
  async getCriteria(req, res) {
    try {
      const ideathonId = req.ideathonId;
      const ideathon = await getCachedIdeathon(ideathonId, 'name type evaluationCriteria');

      if (!ideathon) {
        return res.status(404).json({
          success: false,
          message: 'İdeathon bulunamadı'
        });
      }

      const criteria = (ideathon.evaluationCriteria || [])
        .sort((a, b) => (a.order || 0) - (b.order || 0));

      const maxTotalScore = criteria.reduce((sum, c) => sum + (c.maxScore || 0), 0);

      res.status(200).json({
        success: true,
        data: {
          ideathonName: ideathon.name,
          ideathonType: ideathon.type || 'standard',
          criteria,
          maxTotalScore
        }
      });
    } catch (error) {
      console.error('Kriter getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Kriterler getirilirken hata oluştu'
      });
    }
  }

  // === ADMIN ENDPOINTS ===

  /**
   * Bir takım için tüm değerlendirmeleri getir (Admin)
   * GET /api/juri/teams/:teamName/all-evaluations
   * ideathonId: req.ideathonId (header/query — opsiyonel, null → tümü)
   */
  async getAllEvaluationsForTeam(req, res) {
    try {
      const rawTeamName = req.params.teamName;
      const teamName = decodeURIComponent(rawTeamName);
      const ideathonId = req.ideathonId;

      const query = { teamName: teamName.trim() };
      if (ideathonId) query.ideathonId = ideathonId;

      const evaluations = await TeamEvaluation.find(query)
        .populate('juriId', 'name email')
        .sort({ totalScore: -1 })
        .lean();

      if (evaluations.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Bu takım için henüz değerlendirme yapılmamış'
        });
      }

      // Ortalama hesapla
      const totalScoreSum = evaluations.reduce((sum, ev) => sum + ev.totalScore, 0);
      const averageScore = totalScoreSum / evaluations.length;

      res.status(200).json({
        success: true,
        data: {
          teamName: teamName.trim(),
          evaluations,
          statistics: {
            averageScore: averageScore.toFixed(2),
            evaluationCount: evaluations.length,
            maxScore: Math.max(...evaluations.map(e => e.totalScore)),
            minScore: Math.min(...evaluations.map(e => e.totalScore))
          },
          evaluationCount: evaluations.length
        }
      });

    } catch (error) {
      console.error('Takım değerlendirmeleri getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Değerlendirmeler getirilirken hata oluştu'
      });
    }
  }

  /**
   * Genel değerlendirme istatistikleri (Admin)
   * GET /api/juri/stats
   * ideathonId: req.ideathonId (header/query — opsiyonel)
   */
  async getEvaluationStats(req, res) {
    try {
      const ideathonId = req.ideathonId;

      const matchStage = {};
      if (ideathonId) matchStage.ideathonId = ideathonId;

      const totalEvaluations = await TeamEvaluation.countDocuments(matchStage);
      const evaluatedTeamNames = await TeamEvaluation.distinct('teamName', matchStage);
      const activeJuris = await TeamEvaluation.distinct('juriId', matchStage);

      // Toplam takım sayısını ideathon tipine göre farklı hesapla
      let totalApprovedTeams = 0;
      let ideathon = null;
      if (ideathonId) {
        ideathon = await getCachedIdeathon(ideathonId, 'type evaluationCriteria');

        if (ideathon && ideathon.type === 'evaluation_only') {
          totalApprovedTeams = await Team.countDocuments({ ideathonId, isActive: true });
        } else {
          const approvedTeamNames = await Application.distinct('teamInfo.teamName', {
            ideathonId,
            status: 'approved',
            'teamInfo.isInTeam': true,
            'teamInfo.teamName': { $ne: null, $ne: '' }
          });
          totalApprovedTeams = approvedTeamNames.length;
        }
      }

      // Genel puan istatistikleri
      const scorePipeline = [];
      if (ideathonId) scorePipeline.push({ $match: { ideathonId } });
      scorePipeline.push({
        $group: {
          _id: null,
          averageScore: { $avg: '$totalScore' },
          maxScore: { $max: '$totalScore' },
          minScore: { $min: '$totalScore' }
        }
      });
      const avgScoreResult = await TeamEvaluation.aggregate(scorePipeline);
      const avgScore = avgScoreResult.length > 0 ? avgScoreResult[0] : {
        averageScore: 0, maxScore: 0, minScore: 0
      };

      // Kriter bazlı ortalama puanlar — dinamik yapı
      let criteriaAverages = null;
      const evalCriteria = ideathon?.evaluationCriteria;

      if (evalCriteria && evalCriteria.length > 0) {
        // Dinamik: ideathon.evaluationCriteria'dan pipeline oluştur
        const groupStage = { _id: null };
        evalCriteria.forEach(c => {
          groupStage[c.key] = { $avg: `$criteria.${c.key}.score` };
        });

        const criteriaPipeline = [];
        if (ideathonId) criteriaPipeline.push({ $match: { ideathonId } });
        criteriaPipeline.push({ $group: groupStage });

        const criteriaResult = await TeamEvaluation.aggregate(criteriaPipeline);
        if (criteriaResult.length > 0) {
          criteriaAverages = {};
          evalCriteria.forEach(c => {
            criteriaAverages[c.key] = {
              name: c.name,
              average: parseFloat((criteriaResult[0][c.key] || 0).toFixed(2)),
              maxPossible: c.maxScore
            };
          });
        }
      } else {
        // Fallback: eski hardcoded yapı (evaluationCriteria tanımlanmamış ideathonlar)
        const criteriaPipeline = [];
        if (ideathonId) criteriaPipeline.push({ $match: { ideathonId } });
        criteriaPipeline.push({
          $group: {
            _id: null,
            problemDefinition: { $avg: '$criteria.problemDefinition.score' },
            emlakKonutAlignment: { $avg: '$criteria.emlakKonutAlignment.score' },
            innovation: { $avg: '$criteria.innovation.score' },
            userExperience: { $avg: '$criteria.userExperience.score' },
            technicalFeasibility: { $avg: '$criteria.technicalFeasibility.score' },
            teamPotential: { $avg: '$criteria.teamPotential.score' },
            sustainability: { $avg: '$criteria.sustainability.score' },
            presentationQuality: { $avg: '$criteria.presentationQuality.score' }
          }
        });
        const criteriaResult = await TeamEvaluation.aggregate(criteriaPipeline);
        if (criteriaResult.length > 0) {
          criteriaAverages = {
            problemDefinition: { name: 'Problem Tanımı ve İhtiyaç Analizi', average: parseFloat((criteriaResult[0].problemDefinition || 0).toFixed(2)), maxPossible: 15 },
            emlakKonutAlignment: { name: 'Emlak Konut Odak Alanlarıyla Uyum', average: parseFloat((criteriaResult[0].emlakKonutAlignment || 0).toFixed(2)), maxPossible: 10 },
            innovation: { name: 'Yenilikçilik ve Farklılaşma', average: parseFloat((criteriaResult[0].innovation || 0).toFixed(2)), maxPossible: 20 },
            userExperience: { name: 'Kullanıcı Odaklılık ve Deneyim', average: parseFloat((criteriaResult[0].userExperience || 0).toFixed(2)), maxPossible: 10 },
            technicalFeasibility: { name: 'Teknik Uygulanabilirlik', average: parseFloat((criteriaResult[0].technicalFeasibility || 0).toFixed(2)), maxPossible: 15 },
            teamPotential: { name: 'Ekip Potansiyeli', average: parseFloat((criteriaResult[0].teamPotential || 0).toFixed(2)), maxPossible: 15 },
            sustainability: { name: 'Sürdürülebilirlik', average: parseFloat((criteriaResult[0].sustainability || 0).toFixed(2)), maxPossible: 5 },
            presentationQuality: { name: 'Sunum Kalitesi ve Takım Dinamiği', average: parseFloat((criteriaResult[0].presentationQuality || 0).toFixed(2)), maxPossible: 10 }
          };
        }
      }

      // Juri başına detaylı istatistik
      const juriPipeline = [];
      if (ideathonId) juriPipeline.push({ $match: { ideathonId } });
      juriPipeline.push(
        {
          $group: {
            _id: '$juriId',
            evaluationCount: { $sum: 1 },
            averageScore: { $avg: '$totalScore' },
            maxScore: { $max: '$totalScore' },
            minScore: { $min: '$totalScore' },
            lastEvaluatedAt: { $max: '$evaluatedAt' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'juri'
          }
        },
        { $unwind: '$juri' },
        {
          $project: {
            juriId: '$_id',
            juriName: '$juri.name',
            juriEmail: '$juri.email',
            evaluationCount: 1,
            averageScore: { $round: ['$averageScore', 2] },
            maxScore: 1,
            minScore: 1,
            lastEvaluatedAt: 1
          }
        },
        { $sort: { evaluationCount: -1 } }
      );
      const juriStats = await TeamEvaluation.aggregate(juriPipeline);

      const pendingTeamsCount = totalApprovedTeams > 0 
        ? totalApprovedTeams - evaluatedTeamNames.length 
        : 0;

      res.status(200).json({
        success: true,
        data: {
          overall: {
            totalEvaluations,
            evaluatedTeamsCount: evaluatedTeamNames.length,
            totalApprovedTeams,
            pendingTeamsCount: pendingTeamsCount > 0 ? pendingTeamsCount : 0,
            activeJurisCount: activeJuris.length,
            averageScore: avgScore.averageScore ? parseFloat(avgScore.averageScore.toFixed(2)) : 0,
            maxScore: avgScore.maxScore || 0,
            minScore: avgScore.minScore || 0,
            completionRate: totalApprovedTeams > 0 
              ? parseFloat(((evaluatedTeamNames.length / totalApprovedTeams) * 100).toFixed(1))
              : 0
          },
          criteriaAverages,
          juriStats,
          evaluatedTeamNames
        }
      });

    } catch (error) {
      console.error('İstatistik getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'İstatistikler getirilirken hata oluştu'
      });
    }
  }

  /**
   * Takım sıralaması (Admin)
   * GET /api/juri/rankings
   * ideathonId: req.ideathonId (header/query — opsiyonel)
   */
  async getTeamRankings(req, res) {
    try {
      const ideathonId = req.ideathonId;
      const rankings = await TeamEvaluation.getTeamRankings(ideathonId);

      // Dinamik maxTotalScore hesapla
      let maxTotalScore = 100; // fallback
      if (ideathonId) {
        const ideathon = await getCachedIdeathon(ideathonId, 'evaluationCriteria');
        if (ideathon && ideathon.evaluationCriteria && ideathon.evaluationCriteria.length > 0) {
          maxTotalScore = ideathon.evaluationCriteria.reduce((sum, c) => sum + (c.maxScore || 0), 0);
        }
      }

      const rankedTeams = rankings.map((team, index) => {
        const sortedEvaluations = (team.evaluations || [])
          .sort((a, b) => (b.totalScore || 0) - (a.totalScore || 0))
          .map(ev => ({
            evaluationId: ev.evaluationId,
            juriId: ev.juriId,
            juriName: ev.juriName,
            juriEmail: ev.juriEmail,
            totalScore: ev.totalScore,
            criteria: ev.criteria,
            generalComment: ev.generalComment,
            evaluatedAt: ev.evaluatedAt,
            status: ev.status
          }));

        return {
          rank: index + 1,
          teamId: team.teamId || null,
          teamName: team.teamName,
          averageScore: team.averageScore,
          evaluationCount: team.evaluationCount,
          maxScore: team.maxScore,
          minScore: team.minScore,
          scoreRange: parseFloat((team.maxScore - team.minScore).toFixed(2)),
          scorePercentage: maxTotalScore > 0
            ? parseFloat(((team.averageScore / maxTotalScore) * 100).toFixed(2))
            : 0,
          maxTotalScore,
          evaluations: sortedEvaluations
        };
      });

      const totalEvaluations = rankedTeams.reduce((sum, t) => sum + t.evaluationCount, 0);
      const allScores = rankedTeams.map(t => t.averageScore);
      const overallAvg = allScores.length > 0 
        ? parseFloat((allScores.reduce((a, b) => a + b, 0) / allScores.length).toFixed(2)) 
        : 0;

      res.status(200).json({
        success: true,
        data: {
          rankings: rankedTeams,
          summary: {
            totalTeams: rankedTeams.length,
            totalEvaluations,
            overallAverageScore: overallAvg,
            highestAverage: allScores.length > 0 ? Math.max(...allScores) : 0,
            lowestAverage: allScores.length > 0 ? Math.min(...allScores) : 0,
            maxTotalScore
          }
        }
      });

    } catch (error) {
      console.error('Sıralama getirme hatası:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Sıralama getirilirken hata oluştu'
      });
    }
  }

  /**
   * Değerlendirmeyi sil (Admin)
   * DELETE /api/juri/evaluations/:evaluationId
   */
  async deleteEvaluation(req, res) {
    try {
      const { evaluationId } = req.params;

      const evaluation = await TeamEvaluation.findByIdAndDelete(evaluationId);

      if (!evaluation) {
        return res.status(404).json({
          success: false,
          message: 'Değerlendirme bulunamadı'
        });
      }

      res.status(200).json({
        success: true,
        message: 'Değerlendirme başarıyla silindi',
        data: {
          deletedEvaluation: {
            teamName: evaluation.teamName,
            juriName: evaluation.juriName,
            totalScore: evaluation.totalScore
          }
        }
      });

    } catch (error) {
      console.error('Değerlendirme silme hatası:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Değerlendirme silinirken hata oluştu'
      });
    }
  }

  /**
   * Bir jurinin tüm değerlendirmelerini sil (Admin)
   * DELETE /api/juri/evaluations/by-jury/:juriId
   * ideathonId: req.ideathonId (header/query — opsiyonel)
   */
  async deleteEvaluationsByJury(req, res) {
    try {
      const { juriId } = req.params;
      const ideathonId = req.ideathonId;

      if (!juriId) {
        return res.status(400).json({
          success: false,
          message: 'Juri ID zorunludur'
        });
      }

      const query = { juriId };
      if (ideathonId) query.ideathonId = ideathonId;

      const countBefore = await TeamEvaluation.countDocuments(query);

      if (countBefore === 0) {
        return res.status(404).json({
          success: false,
          message: 'Bu juriye ait değerlendirme bulunamadı'
        });
      }

      const juriInfo = await TeamEvaluation.findOne(query).select('juriName juriEmail').lean();
      const result = await TeamEvaluation.deleteMany(query);

      res.status(200).json({
        success: true,
        message: `${result.deletedCount} değerlendirme başarıyla silindi`,
        data: {
          deletedCount: result.deletedCount,
          juriName: juriInfo?.juriName || '',
          juriEmail: juriInfo?.juriEmail || ''
        }
      });

    } catch (error) {
      console.error('Juri değerlendirmeleri toplu silme hatası:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Değerlendirmeler silinirken hata oluştu'
      });
    }
  }
}

module.exports = new JuriController();
