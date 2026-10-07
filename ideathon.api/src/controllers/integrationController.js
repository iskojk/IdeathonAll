const MentorIntegration = require('../models/MentorIntegration');
const oauthService = require('../services/oauthService');
const { generateState, validateState } = require('../utils/stateHelper');

/**
 * Integration Controller
 * OAuth entegrasyonları yönetimi (Google, Microsoft, Zoom)
 */

// ==================== KULLANICI ENTEGRASYONLARI ====================

// @desc    Kullanıcının tüm entegrasyonlarını getir
// @route   GET /api/mentornet/integrations
// @access  Private (Mentor)
exports.getIntegrations = async (req, res) => {
  try {
    const userId = req.user._id;

    const integrations = await MentorIntegration.find({ userId })
      .select('-accessToken -refreshToken') // Token'ları döndürme
      .lean();

    // Her entegrasyon için token geçerliliğini kontrol et
    const integrationsWithStatus = integrations.map(integration => {
      const isValid = new Date(integration.expiresAt).getTime() > Date.now();
      return {
        ...integration,
        isTokenValid: isValid
      };
    });

    res.json({
      success: true,
      count: integrationsWithStatus.length,
      data: integrationsWithStatus
    });
  } catch (error) {
    console.error('getIntegrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Entegrasyonlar getirilirken hata oluştu',
      error: error.message
    });
  }
};

// @desc    Entegrasyonu kaldır
// @route   DELETE /api/mentornet/integrations/:provider
// @access  Private (Mentor)
exports.deleteIntegration = async (req, res) => {
  try {
    const userId = req.user._id;
    const { provider } = req.params;

    // Validation
    if (!['google', 'microsoft', 'zoom'].includes(provider)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz provider'
      });
    }

    const integration = await MentorIntegration.findOne({ userId, provider });

    if (!integration) {
      return res.status(404).json({
        success: false,
        message: 'Entegrasyon bulunamadı'
      });
    }

    // Revoke et
    await integration.revoke();

    res.json({
      success: true,
      message: 'Entegrasyon kaldırıldı'
    });
  } catch (error) {
    console.error('deleteIntegration error:', error);
    res.status(500).json({
      success: false,
      message: 'Entegrasyon kaldırılırken hata oluştu',
      error: error.message
    });
  }
};

// ==================== GOOGLE ====================

// @desc    Google OAuth başlat
// @route   GET /api/mentornet/integrations/google/connect
// @access  Private (Mentor)
exports.connectGoogle = async (req, res) => {
  try {
    const userId = req.user._id;

    // HMAC imzalı, zamanaşımlı state oluştur (güvenlik)
    const state = generateState(userId, 'google');

    const authUrl = oauthService.getGoogleAuthUrl(state);

    res.json({
      success: true,
      authUrl: authUrl
    });
  } catch (error) {
    console.error('connectGoogle error:', error);
    res.status(500).json({
      success: false,
      message: 'Google OAuth URL oluşturulamadı',
      error: error.message
    });
  }
};

// @desc    Google OAuth callback
// @route   GET /auth/google/callback
// @access  Public (OAuth callback)
exports.googleCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    // Hata kontrolü
    if (error) {
      return res.redirect(`${process.env.FRONTEND_MENTOR_URL}/mentor/integrations?provider=google&status=error&reason=${error}`);
    }

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_MENTOR_URL}/mentor/integrations?provider=google&status=error&reason=invalid_request`);
    }

    // State'i doğrula (HMAC, timestamp, nonce)
    const validation = validateState(state);
    
    if (!validation.valid) {
      console.error('❌ State validation failed:', validation.error);
      return res.redirect(`${process.env.FRONTEND_MENTOR_URL}/mentor/integrations?provider=google&status=error&reason=invalid_state`);
    }

    const { userId, provider } = validation;

    // Provider kontrolü
    if (provider !== 'google') {
      console.error('❌ Provider mismatch:', provider);
      return res.redirect(`${process.env.FRONTEND_MENTOR_URL}/mentor/integrations?provider=google&status=error&reason=provider_mismatch`);
    }

    // Code'u token'a çevir
    const tokenData = await oauthService.exchangeGoogleCode(code);

    // DB'ye kaydet veya güncelle (pre-save hook ile token encryption tetiklenmesi için save() kullanılmalı)
    let integration = await MentorIntegration.findOne({ userId, provider: 'google' });
    if (!integration) {
      integration = new MentorIntegration({ userId, provider: 'google' });
    }
    integration.status = 'connected';
    integration.accessToken = tokenData.accessToken;
    integration.refreshToken = tokenData.refreshToken;
    integration.expiresAt = new Date(Date.now() + (tokenData.expiresIn * 1000));
    integration.scope = tokenData.scope;
    integration.email = tokenData.email;
    integration.providerAccountId = tokenData.providerAccountId;
    await integration.save();

    // Başarılı, frontend'e redirect et
    res.redirect(`${process.env.FRONTEND_MENTOR_URL}/mentor/integrations?provider=google&status=success`);
  } catch (error) {
    console.error('googleCallback error:', error);
    res.redirect(`${process.env.FRONTEND_MENTOR_URL}/mentor/integrations?provider=google&status=error&reason=server_error`);
  }
};

// ==================== MICROSOFT ====================

// @desc    Microsoft OAuth başlat
// @route   GET /api/mentornet/integrations/microsoft/connect
// @access  Private (Mentor)
exports.connectMicrosoft = async (req, res) => {
  try {
    const userId = req.user._id;

    const state = generateState(userId, 'microsoft');

    const authUrl = oauthService.getMicrosoftAuthUrl(state);

    res.json({
      success: true,
      authUrl: authUrl
    });
  } catch (error) {
    console.error('connectMicrosoft error:', error);
    res.status(500).json({
      success: false,
      message: 'Microsoft OAuth URL oluşturulamadı',
      error: error.message
    });
  }
};

// @desc    Microsoft OAuth callback
// @route   GET /auth/microsoft/callback
// @access  Public (OAuth callback)
exports.microsoftCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${process.env.FRONTEND_MENTOR_URL}/mentor/integrations?provider=microsoft&status=error&reason=${error}`);
    }

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_MENTOR_URL}/mentor/integrations?provider=microsoft&status=error&reason=invalid_request`);
    }

    const validation = validateState(state);
    
    if (!validation.valid) {
      console.error('❌ State validation failed:', validation.error);
      return res.redirect(`${process.env.FRONTEND_MENTOR_URL}/mentor/integrations?provider=microsoft&status=error&reason=invalid_state`);
    }

    const { userId, provider } = validation;

    if (provider !== 'microsoft') {
      console.error('❌ Provider mismatch:', provider);
      return res.redirect(`${process.env.FRONTEND_MENTOR_URL}/mentor/integrations?provider=microsoft&status=error&reason=provider_mismatch`);
    }

    const tokenData = await oauthService.exchangeMicrosoftCode(code);

    let msIntegration = await MentorIntegration.findOne({ userId, provider: 'microsoft' });
    if (!msIntegration) {
      msIntegration = new MentorIntegration({ userId, provider: 'microsoft' });
    }
    msIntegration.status = 'connected';
    msIntegration.accessToken = tokenData.accessToken;
    msIntegration.refreshToken = tokenData.refreshToken;
    msIntegration.expiresAt = new Date(Date.now() + (tokenData.expiresIn * 1000));
    msIntegration.scope = tokenData.scope;
    msIntegration.email = tokenData.email;
    msIntegration.providerAccountId = tokenData.providerAccountId;
    await msIntegration.save();

    res.redirect(`${process.env.FRONTEND_MENTOR_URL}/mentor/integrations?provider=microsoft&status=success`);
  } catch (error) {
    console.error('microsoftCallback error:', error);
    res.redirect(`${process.env.FRONTEND_MENTOR_URL}/mentor/integrations?provider=microsoft&status=error&reason=server_error`);
  }
};

// ==================== ZOOM ====================

// @desc    Zoom OAuth başlat
// @route   GET /api/mentornet/integrations/zoom/connect
// @access  Private (Mentor)
exports.connectZoom = async (req, res) => {
  try {
    const userId = req.user._id;

    const state = generateState(userId, 'zoom');

    const authUrl = oauthService.getZoomAuthUrl(state);

    res.json({
      success: true,
      authUrl: authUrl
    });
  } catch (error) {
    console.error('connectZoom error:', error);
    res.status(500).json({
      success: false,
      message: 'Zoom OAuth URL oluşturulamadı',
      error: error.message
    });
  }
};

// @desc    Zoom OAuth callback
// @route   GET /auth/zoom/callback
// @access  Public (OAuth callback)
exports.zoomCallback = async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      return res.redirect(`${process.env.FRONTEND_MENTOR_URL}/mentor/integrations?provider=zoom&status=error&reason=${error}`);
    }

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_MENTOR_URL}/mentor/integrations?provider=zoom&status=error&reason=invalid_request`);
    }

    const validation = validateState(state);
    
    if (!validation.valid) {
      console.error('❌ State validation failed:', validation.error);
      return res.redirect(`${process.env.FRONTEND_MENTOR_URL}/mentor/integrations?provider=zoom&status=error&reason=invalid_state`);
    }

    const { userId, provider } = validation;

    if (provider !== 'zoom') {
      console.error('❌ Provider mismatch:', provider);
      return res.redirect(`${process.env.FRONTEND_MENTOR_URL}/mentor/integrations?provider=zoom&status=error&reason=provider_mismatch`);
    }

    const tokenData = await oauthService.exchangeZoomCode(code);

    let zoomIntegration = await MentorIntegration.findOne({ userId, provider: 'zoom' });
    if (!zoomIntegration) {
      zoomIntegration = new MentorIntegration({ userId, provider: 'zoom' });
    }
    zoomIntegration.status = 'connected';
    zoomIntegration.accessToken = tokenData.accessToken;
    zoomIntegration.refreshToken = tokenData.refreshToken;
    zoomIntegration.expiresAt = new Date(Date.now() + (tokenData.expiresIn * 1000));
    zoomIntegration.scope = tokenData.scope;
    zoomIntegration.email = tokenData.email;
    zoomIntegration.providerAccountId = tokenData.providerAccountId;
    await zoomIntegration.save();

    res.redirect(`${process.env.FRONTEND_MENTOR_URL}/mentor/integrations?provider=zoom&status=success`);
  } catch (error) {
    console.error('zoomCallback error:', error);
    res.redirect(`${process.env.FRONTEND_MENTOR_URL}/mentor/integrations?provider=zoom&status=error&reason=server_error`);
  }
};

module.exports = exports;

