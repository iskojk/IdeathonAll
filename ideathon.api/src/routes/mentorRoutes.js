const express = require('express');
const router = express.Router();
const mentorController = require('../controllers/mentorController');
const { uploadMentorPhoto } = require('../middleware/upload');
const { authenticate, requireSuperAdminOrAdmin, attachIdeathonFromHeaderOrQuery } = require('../middleware/auth');


// === PUBLIC ROUTES ===

// Aktif mentorleri getir
router.get('/active', mentorController.getActiveMentors);

// === ADMIN/SUPERADMIN ROUTES ===

// ⚠️ ÖNEMLİ: Spesifik route'lar yukarıda, genel route'lar aşağıda olmalı!

// Dashboard genel istatistikleri
router.get('/stats/dashboard',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  mentorController.getDashboardStats
);

// Mentor istatistikleri (genel)
router.get('/stats/overview',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  mentorController.getMentorStats
);

// Tüm mentorleri istatistiklerle listele (ÖNCELİKLİ - "/" route'undan ÖNCE olmalı)
router.get('/with-stats',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  mentorController.getAllMentorsWithStats
);

// Tüm mentorleri listele (istatistikler olmadan - eski endpoint)
router.get('/',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  mentorController.getAllMentors
);

// Mentor detayını getir
router.get('/:id',
  authenticate,
  requireSuperAdminOrAdmin,
  mentorController.getMentor
);

// Tekil mentor detaylı istatistikleri
router.get('/:id/stats',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  mentorController.getMentorDetailedStats
);

// Yeni mentor oluştur
router.post('/',
  authenticate,
  requireSuperAdminOrAdmin,
  uploadMentorPhoto.single('photo'),
  mentorController.createMentor
);

// Mentor güncelle
router.put('/:id',
  authenticate,
  requireSuperAdminOrAdmin,
  uploadMentorPhoto.single('photo'),
  mentorController.updateMentor
);

// Mentor sıralamasını güncelle
router.patch('/:id/order',
  authenticate,
  requireSuperAdminOrAdmin,
  mentorController.updateMentorOrder
);

// Mentor sil (soft delete)
router.delete('/:id',
  authenticate,
  requireSuperAdminOrAdmin,
  mentorController.deleteMentor
);

// Mentor kalıcı olarak sil (sadece superadmin)
router.delete('/:id/hard',
  authenticate,
  requireSuperAdminOrAdmin,
  mentorController.hardDeleteMentor
);

module.exports = router;


