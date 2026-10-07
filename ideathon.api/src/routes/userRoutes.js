const express = require('express');
const userController = require('../controllers/userController');
const {
  authenticate,
  requireSuperAdmin,
  requireSuperAdminOrAdmin,
  requireJuriOrAdmin,
  requireOwnership,
  requireActiveUser,
  attachIdeathonFromHeaderOrQuery
} = require('../middleware/auth');

const router = express.Router();

// === USER CRUD ROUTES ===

// === CHAT USERS MANAGEMENT (Superadmin/Admin Only) ===

// Yeni üye oluştur (+ opsiyonel takım ve takım üyeleri)
router.post('/chat-users',
  authenticate,
  requireSuperAdminOrAdmin,
  userController.createChatUser
);

// NEW_USERS endpoint - Chat userlarını listele
router.get('/chat-users',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  userController.getChatUsers
);

// Chat user detayını getir
router.get('/chat-users/:id',
  authenticate,
  requireSuperAdminOrAdmin,
  userController.getChatUser
);

// Chat user güncelle
router.put('/chat-users/:id',
  authenticate,
  requireSuperAdminOrAdmin,
  userController.updateChatUser
);

// Chat user sil (soft delete)
router.delete('/chat-users/:id',
  authenticate,
  requireSuperAdminOrAdmin,
  userController.deleteChatUser
);

// Chat users istatistikleri
router.get('/chat-users/stats/overview',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  userController.getChatUsersStats
);

// Tüm kullanıcıları listele (superadmin)
router.get('/',
  authenticate,
  requireSuperAdmin,
  attachIdeathonFromHeaderOrQuery,
  userController.getAllUsers
);

// Tek kullanıcı getir
router.get('/:id',
  authenticate,
  requireActiveUser,
  userController.getUser
);

// Yeni kullanıcı oluştur (superadmin)
router.post('/',
  authenticate,
  requireSuperAdmin,
  userController.createUser
);

// Kullanıcı güncelle (kullanıcı kendi hesabını düzenleyebilir, superadmin hepsini)
router.put('/:id',
  authenticate,
  requireOwnership,
  userController.updateUser
);

// Kullanıcı sil (soft delete) - sadece superadmin
router.delete('/:id',
  authenticate,
  requireSuperAdmin,
  userController.deleteUser
);

// Kullanıcı durumunu değiştir (aktif/pasif) - sadece superadmin
router.patch('/:id/status',
  authenticate,
  requireSuperAdmin,
  userController.toggleUserStatus
);

// === JURI SPECIFIC ROUTES ===

// Aktif juri listesi
router.get('/juris/active',
  authenticate,
  requireActiveUser,
  attachIdeathonFromHeaderOrQuery,
  userController.getActiveJuris
);

// Juri operation ekle (sadece juri üyeleri kendi işlemlerini ekleyebilir)
router.post('/:id/juri-operations',
  authenticate,
  requireOwnership,
  userController.addJuriOperation
);

// Kullanıcının juri işlemlerini getir (juri kendi işlemlerini, superadmin hepsini görebilir)
router.get('/:id/juri-operations',
  authenticate,
  requireJuriOrAdmin,
  userController.getUserJuriOperations
);

// === EMAIL TERCİHLERİ ROUTES ===

// Kendi email tercihlerimi getir
router.get('/me/email-preferences',
  authenticate,
  userController.getMyEmailPreferences
);

// Kendi email tercihlerimi güncelle
router.patch('/me/email-preferences',
  authenticate,
  userController.updateMyEmailPreferences
);

// === STATISTICS ROUTES ===

// Kullanıcı istatistikleri
router.get('/stats/overview',
  authenticate,
  requireSuperAdmin,
  attachIdeathonFromHeaderOrQuery,
  userController.getUserStats
);

// === ADMIN/JURI ACCOUNT MANAGEMENT (Superadmin Only) ===

// Admin/Juri hesaplarını listele
router.get('/admin-juri/accounts',
  authenticate,
  requireSuperAdmin,
  userController.getAdminJuriAccounts
);

// Admin/Juri hesabı detayı getir
router.get('/admin-juri/accounts/:id',
  authenticate,
  requireSuperAdmin,
  userController.getAdminJuriAccount
);

// Yeni admin/juri hesabı oluştur
router.post('/admin-juri/accounts',
  authenticate,
  requireSuperAdmin,
  userController.createAdminJuriAccount
);

// Admin/Juri hesabı güncelle
router.put('/admin-juri/accounts/:id',
  authenticate,
  requireSuperAdmin,
  userController.updateAdminJuriAccount
);

// Admin/Juri hesabı sil (soft delete)
router.delete('/admin-juri/accounts/:id',
  authenticate,
  requireSuperAdmin,
  userController.deleteAdminJuriAccount
);

// Admin/Juri hesap istatistikleri
router.get('/admin-juri/stats',
  authenticate,
  requireSuperAdmin,
  userController.getAdminJuriStats
);

module.exports = router;
