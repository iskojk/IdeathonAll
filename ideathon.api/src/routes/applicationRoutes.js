const express = require('express');
const applicationController = require('../controllers/applicationController');
const {
  authenticate,
  requireSuperAdmin,
  requireSuperAdminOrAdmin,
  requireJuriOrAdmin,
  requireActiveUser,
  attachIdeathonFromJwtOnly,
  attachIdeathonFromHeaderOrQuery,
  attachIdeathonFromQuerySlug
} = require('../middleware/auth');
const { uploadPresentation } = require('../middleware/upload');

const router = express.Router();

// === PUBLIC ROUTES (No Auth Required) ===

// Yeni başvuru oluştur (auth gerekli - user rolü)
// Multi-Tenant: Public tarafta ideathonId query slug'dan (?event=slug) veya body'den gelir
router.post('/',
  authenticate,
  requireActiveUser,
  attachIdeathonFromQuerySlug,
  applicationController.createApplication
);

// Başvuru durumunu kontrol et (application number ile)
router.get('/status/:applicationNumber',
  applicationController.checkApplicationStatus
);

// === USER APPLICATION ROUTES (Auth Required - User) ===

// Önceki başvuru bilgilerini getir (yeni başvuru formu ön doldurma)
router.get('/my/prefill',
  authenticate,
  requireActiveUser,
  applicationController.getPrefillData
);

// Kullanıcının kendi başvurularını listele
router.get('/my',
  authenticate,
  requireActiveUser,
  applicationController.getMyApplications
);

// Kullanıcının kendi başvurusunu güncelle
router.put('/my/:id',
  authenticate,
  requireActiveUser,
  applicationController.updateMyApplication
);

// Kullanıcının kendi başvurusunu iptal et
router.patch('/my/:id/withdraw',
  authenticate,
  requireActiveUser,
  applicationController.withdrawMyApplication
);

// === FRONTEND TEAM MANAGEMENT ROUTES ===

// Kendi takım bilgilerini getir
router.get('/my-team',
  authenticate,
  requireActiveUser,
  applicationController.getMyTeamInfo
);

// Takım bilgilerini güncelle (takım adı)
router.put('/my-team',
  authenticate,
  requireActiveUser,
  applicationController.updateMyTeamInfo
);

// Takıma üye ekle
router.post('/my-team/members',
  authenticate,
  requireActiveUser,
  applicationController.addTeamMember
);

// Takım üyesini güncelle
router.put('/my-team/members/:memberIndex',
  authenticate,
  requireActiveUser,
  applicationController.updateTeamMember
);

// Takım üyesini sil
router.delete('/my-team/members/:memberIndex',
  authenticate,
  requireActiveUser,
  applicationController.deleteTeamMember
);

// === PRESENTATION AND PROJECT DESCRIPTION ROUTES (V2) ===

// Sunum bilgilerini getir (kendi başvurusu)
router.get('/my/:id/presentation',
  authenticate,
  requireActiveUser,
  applicationController.getPresentationInfo
);

// Sunum dosyası yükle/güncelle
router.post('/my/:id/presentation/upload',
  authenticate,
  requireActiveUser,
  uploadPresentation.single('presentationFile'),
  applicationController.uploadPresentation
);

// Proje açıklaması ekle/güncelle
router.patch('/my/:id/presentation/description',
  authenticate,
  requireActiveUser,
  applicationController.updateProjectDescription
);

// Sunum dosyasını sil
router.delete('/my/:id/presentation/file',
  authenticate,
  requireActiveUser,
  applicationController.deletePresentation
);

// === ADMIN ROUTES (Super Admin Required) ===

// Tüm başvuruları listele
router.get('/',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  applicationController.getAllApplications
);

// Başvuru detayını getir
router.get('/:id',
  authenticate,
  requireSuperAdminOrAdmin,
  applicationController.getApplication
);

// Başvuru güncelle
router.put('/:id',
  authenticate,
  requireSuperAdminOrAdmin,
  applicationController.updateApplication
);

// Başvuru sil
router.delete('/:id',
  authenticate,
  requireSuperAdminOrAdmin,
  applicationController.deleteApplication
);

// Başvuru durumunu değiştir
router.patch('/:id/status',
  authenticate,
  requireSuperAdminOrAdmin,
  applicationController.changeApplicationStatus
);

// === JURI ROUTES (Juri or Admin Required — ideathon JWT'den) ===

// Juri için tüm başvuruları listele (değerlendirme için)
router.get('/juri/list',
  authenticate,
  requireJuriOrAdmin,
  attachIdeathonFromJwtOnly,
  applicationController.getApplicationsForJuri
);

// Juri için başvuru detayını getir
router.get('/juri/:id/detail',
  authenticate,
  requireJuriOrAdmin,
  attachIdeathonFromJwtOnly,
  applicationController.getApplicationDetailForJuri
);

// Juri ön değerlendirme ekle/güncelle (V2)
router.post('/:id/pre-evaluate',
  authenticate,
  requireJuriOrAdmin,
  attachIdeathonFromJwtOnly,
  applicationController.addPreEvaluation
);

// Juri'nin kendi yaptığı ön değerlendirmeyi getir
router.get('/:id/my-pre-evaluation',
  authenticate,
  requireJuriOrAdmin,
  attachIdeathonFromJwtOnly,
  applicationController.getMyPreEvaluation
);

// Bir başvurunun tüm ön değerlendirmelerini getir (admin)
router.get('/:id/pre-evaluations',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  applicationController.getAllPreEvaluations
);

// Juri değerlendirmesi ekle/güncelle
router.post('/:id/evaluations',
  authenticate,
  requireJuriOrAdmin,
  attachIdeathonFromJwtOnly,
  applicationController.addJuriEvaluation
);

// Juri'nin değerlendirdiği başvuruları getir
router.get('/juri/my-evaluations',
  authenticate,
  requireJuriOrAdmin,
  attachIdeathonFromJwtOnly,
  applicationController.getJuriEvaluations
);

// === STATISTICS ROUTES (Admin Required) ===

// Başvuru istatistikleri
router.get('/stats/overview',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  applicationController.getApplicationStats
);

// Dashboard istatistikleri
router.get('/stats/dashboard',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  applicationController.getDashboardStats
);

// === PARTICIPANT MANAGEMENT ===
router.patch('/:id/approve-participant',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  applicationController.approveParticipant
);

router.patch('/:id/reject-participant',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  applicationController.rejectParticipant
);

router.get('/participants/list',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  applicationController.getParticipants
);

router.get('/participants/stats',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  applicationController.getParticipantStats
);

// === TEAM MANAGEMENT ===
router.post('/teams/create',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  applicationController.createTeam
);

router.post('/teams/create-random',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  applicationController.createRandomTeams
);

router.get('/teams/list',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  applicationController.getTeams
);

// === APPROVED APPLICATIONS TEAM MANAGEMENT (V3) ===

// Onaylı başvuruların takım ve bireysel listesi
router.get('/approved/teams-and-individuals',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  applicationController.getApprovedTeamsAndIndividuals
);

// Bireysel başvuruyu takıma ekle
router.post('/approved/add-to-team',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  applicationController.addIndividualToTeam
);

// Takımdan üye çıkar
router.delete('/approved/:applicationId/remove-from-team',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  applicationController.removeIndividualFromTeam
);

// === APPROVED TEAM CRUD (Superadmin) ===

// Takım adını güncelle
router.put('/approved/team-name',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  applicationController.updateApprovedTeamName
);

// Takım lideri bilgilerini güncelle (sadece Application.personalInfo)
router.put('/approved/:applicationId/leader-info',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  applicationController.updateApprovedLeaderInfo
);

// Takım üyesi güncelle (Application + Team sync)
router.put('/approved/:applicationId/team-member/:memberIndex',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  applicationController.updateApprovedTeamMember
);

// Takıma üye ekle (Application + Team sync)
router.post('/approved/:applicationId/team-member',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  applicationController.addApprovedTeamMember
);

// Takımdan üye sil (Application + Team sync)
router.delete('/approved/:applicationId/team-member/:memberIndex',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  applicationController.deleteApprovedTeamMember
);

module.exports = router;


