const express = require('express');
const ideathonController = require('../controllers/ideathonController');
const {
  authenticate,
  requireSuperAdmin,
  requireSuperAdminOrAdmin
} = require('../middleware/auth');

const router = express.Router();

// === PUBLIC ROUTES (No Auth Required) ===

// Public: Slug ile ideathon durumlarını getir (registrationOpen, applicationOpen, individualApplicationOpen)
router.get('/public/:slug',
  ideathonController.getPublicBySlug
);

// === PROTECTED ROUTES ===

// Dropdown listesi (admin paneli için)
router.get('/dropdown',
  authenticate,
  requireSuperAdminOrAdmin,
  ideathonController.listDropdown
);

// Listeleme
router.get('/',
  authenticate,
  requireSuperAdminOrAdmin,
  ideathonController.list
);

// Tekil getir
router.get('/:id',
  authenticate,
  requireSuperAdminOrAdmin,
  ideathonController.getById
);

// Oluştur (Superadmin)
router.post('/',
  authenticate,
  requireSuperAdmin,
  ideathonController.create
);

// Güncelle (Superadmin)
router.put('/:id',
  authenticate,
  requireSuperAdmin,
  ideathonController.update
);

// Sil (Superadmin)
router.delete('/:id',
  authenticate,
  requireSuperAdmin,
  ideathonController.delete
);

// Kullanıcı ata (Superadmin)
router.post('/:id/assign',
  authenticate,
  requireSuperAdmin,
  ideathonController.assignUser
);

// Kullanıcı atamasını kaldır (Superadmin)
router.post('/:id/unassign',
  authenticate,
  requireSuperAdmin,
  ideathonController.unassignUser
);

// İdeathon kullanıcılarını listele
router.get('/:id/users',
  authenticate,
  requireSuperAdminOrAdmin,
  ideathonController.listUsers
);

module.exports = router;






