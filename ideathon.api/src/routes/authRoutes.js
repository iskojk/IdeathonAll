const express = require('express');
const authController = require('../controllers/authController');
const { passwordResetLimits } = require('../services/passwordResetLimits');
const {
  authenticate,
  requireSuperAdmin,
  requireSuperAdminOrAdmin,
  requireOwnership,
  checkLoginAttempts,
  attachIdeathonFromQuerySlugOptional
} = require('../middleware/auth');

const router = express.Router();

// === PUBLIC ROUTES (No Auth Required) ===

// Giriş
router.post('/login',
  checkLoginAttempts,
  authController.login
);

// Mentor özel giriş (MentorProfile bilgileriyle)
router.post('/mentor-login',
  checkLoginAttempts,
  authController.mentorLogin
);

// Public user registration (auth gerektirmez)
// Multi-Tenant: ?event=slug ile ideathon bağlantısı (opsiyonel)
router.post('/register',
  attachIdeathonFromQuerySlugOptional,
  authController.publicRegister
);

// İlk superadmin oluşturma (sadece sistemde superadmin yoksa çalışır)
router.post('/create-initial-admin',
  authController.createInitialSuperAdmin
);

// === PROTECTED ROUTES (Auth Required) ===

// Me endpoint - kendi bilgileri
router.get('/me',
  authenticate,
  authController.me
);

// 🆕 Profil güncelle (Ad, Email)
router.patch('/profile',
  authenticate,
  authController.updateProfile
);

// 🆕 Şifre değiştirme
router.post('/change-password',
  authenticate,
  authController.changePassword
);

// Token yenileme
router.post('/refresh-token',
  authenticate,
  authController.refreshToken
);

// Çıkış
router.post('/logout',
  authenticate,
  authController.logout
);

// === PASSWORD RESET ROUTES ===

// Şifre sıfırlama isteği
router.post('/forgot-password',
  ...passwordResetLimits({ ipLimit: 10, accountLimit: 3 }),
  authController.forgotPassword
);

// Şifre sıfırlama
router.post('/reset-password',
  ...passwordResetLimits(),
  authController.resetPassword
);

// === ADMIN ONLY ROUTES ===

// Yeni kullanıcı kaydı (sadece superadmin)
router.post('/admin/register',
  authenticate,
  requireSuperAdmin,
  authController.register
);

// Admin/Superadmin: İdeathon seçimi (yeni token basılır)
router.post('/select-ideathon',
  authenticate,
  requireSuperAdminOrAdmin,
  authController.selectIdeathon
);

module.exports = router;
