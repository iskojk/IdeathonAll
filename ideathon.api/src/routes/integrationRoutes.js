const express = require('express');
const integrationController = require('../controllers/integrationController');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// ==================== KULLANICI ENTEGRASYONLARI ====================
// Mentor paneli için entegrasyon yönetimi

// Tüm entegrasyonları listele
router.get(
  '/mentornet/integrations',
  authenticate,
  integrationController.getIntegrations
);

// Entegrasyonu kaldır
router.delete(
  '/mentornet/integrations/:provider',
  authenticate,
  integrationController.deleteIntegration
);

// ==================== GOOGLE ====================

// Google OAuth başlat
router.get(
  '/mentornet/integrations/google/connect',
  authenticate,
  integrationController.connectGoogle
);

// Google OAuth callback (public - OAuth callback)
router.get(
  '/auth/google/callback',
  integrationController.googleCallback
);

// ==================== MICROSOFT ====================

// Microsoft OAuth başlat
router.get(
  '/mentornet/integrations/microsoft/connect',
  authenticate,
  integrationController.connectMicrosoft
);

// Microsoft OAuth callback (public - OAuth callback)
router.get(
  '/auth/microsoft/callback',
  integrationController.microsoftCallback
);

// ==================== ZOOM ====================

// Zoom OAuth başlat
router.get(
  '/mentornet/integrations/zoom/connect',
  authenticate,
  integrationController.connectZoom
);

// Zoom OAuth callback (public - OAuth callback)
router.get(
  '/auth/zoom/callback',
  integrationController.zoomCallback
);

module.exports = router;




























