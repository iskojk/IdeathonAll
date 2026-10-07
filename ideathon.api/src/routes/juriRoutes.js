const express = require('express');
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const juriController = require('../controllers/juriController');
const {
  authenticate,
  requireSuperAdmin,
  requireSuperAdminOrAdmin,
  requireJuriOrAdmin,
  attachIdeathonFromJwtOnly,
  attachIdeathonFromHeaderOrQuery
} = require('../middleware/auth');

const router = express.Router();

const evaluateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: (req) => req.user?._id?.toString() || ipKeyGenerator(req.ip),
  message: { success: false, message: 'Çok fazla değerlendirme isteği. Lütfen 1 dakika bekleyin.' },
  standardHeaders: true,
  legacyHeaders: false
});

// === JURI ENDPOINTS (ideathon KESİNLİKLE JWT'den) ===

// Değerlendirme kriterlerini getir (dinamik)
router.get('/criteria',
  authenticate,
  requireJuriOrAdmin,
  attachIdeathonFromJwtOnly,
  juriController.getCriteria
);

// Takımları listele (Juri için - V3 yapısı)
router.get('/teams',
  authenticate,
  requireJuriOrAdmin,
  attachIdeathonFromJwtOnly,
  juriController.getTeams
);

// Takımı değerlendir (Upsert: create or update)
router.post('/teams/:teamName/evaluate',
  authenticate,
  requireJuriOrAdmin,
  attachIdeathonFromJwtOnly,
  evaluateLimiter,
  juriController.evaluateTeam
);

// Değerlendirmeyi güncelle
router.put('/teams/:teamName/evaluate',
  authenticate,
  requireJuriOrAdmin,
  attachIdeathonFromJwtOnly,
  evaluateLimiter,
  juriController.updateEvaluation
);

// Kendi değerlendirmelerini getir
router.get('/my-evaluations',
  authenticate,
  requireJuriOrAdmin,
  attachIdeathonFromJwtOnly,
  juriController.getMyEvaluations
);

// Belirli takım için kendi değerlendirmesini getir
router.get('/teams/:teamName/my-evaluation',
  authenticate,
  requireJuriOrAdmin,
  attachIdeathonFromJwtOnly,
  juriController.getMyEvaluationForTeam
);

// === ADMIN ENDPOINTS (ideathon header/query'den, opsiyonel) ===

// Bir takım için tüm değerlendirmeleri getir
router.get('/teams/:teamName/all-evaluations',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  juriController.getAllEvaluationsForTeam
);

// Genel değerlendirme istatistikleri
router.get('/stats',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  juriController.getEvaluationStats
);

// Takım sıralaması
router.get('/rankings',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  juriController.getTeamRankings
);

// Bir jurinin tüm değerlendirmelerini sil (Admin)
router.delete('/evaluations/by-jury/:juriId',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  juriController.deleteEvaluationsByJury
);

// Değerlendirmeyi sil (Admin)
router.delete('/evaluations/:evaluationId',
  authenticate,
  requireSuperAdminOrAdmin,
  juriController.deleteEvaluation
);

module.exports = router;
