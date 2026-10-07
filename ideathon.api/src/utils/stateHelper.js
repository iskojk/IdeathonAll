const crypto = require('crypto');

/**
 * OAuth State Helper
 * HMAC imzalı, tek kullanımlık, zamanaşımlı state üretimi ve doğrulama
 * 
 * REPLAY SALDIRISI ÖNLEME:
 * - Nonce in-memory Map'te saklanır (tek kullanımlık)
 * - Callback'te nonce consume edilir (silinir)
 * - 10 dakika sonra otomatik temizlenir
 */

const STATE_SECRET = process.env.OAUTH_STATE_SECRET || 'emlak-konut-oauth-state-secret-key';
const STATE_EXPIRY = 10 * 60 * 1000; // 10 dakika

// In-memory nonce storage (tek kullanımlık kontrolü için)
// Production'da Redis kullanılabilir
const usedNonces = new Map(); // nonce -> expiresAt

// Expired nonce'ları temizle (her 5 dakikada bir)
setInterval(() => {
  const now = Date.now();
  for (const [nonce, expiresAt] of usedNonces.entries()) {
    if (expiresAt < now) {
      usedNonces.delete(nonce);
    }
  }
}, 5 * 60 * 1000);

/**
 * State oluştur
 * Format: base64(JSON) + "." + HMAC_SIGNATURE
 */
function generateState(userId, provider) {
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = Date.now();
  
  const stateData = {
    userId: userId.toString(),
    provider,
    nonce,
    timestamp
  };
  
  const stateJson = JSON.stringify(stateData);
  const stateBase64 = Buffer.from(stateJson).toString('base64url');
  
  // HMAC imza oluştur
  const signature = crypto
    .createHmac('sha256', STATE_SECRET)
    .update(stateBase64)
    .digest('base64url');
  
  return `${stateBase64}.${signature}`;
}

/**
 * State'i doğrula ve nonce'ı consume et (tek kullanımlık)
 */
function validateState(state) {
  try {
    // State formatı kontrol et
    if (!state || typeof state !== 'string') {
      return { valid: false, error: 'Invalid state format' };
    }
    
    const parts = state.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Invalid state structure' };
    }
    
    const [stateBase64, signature] = parts;
    
    // İmzayı doğrula
    const expectedSignature = crypto
      .createHmac('sha256', STATE_SECRET)
      .update(stateBase64)
      .digest('base64url');
    
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' };
    }
    
    // State içeriğini çöz
    const stateJson = Buffer.from(stateBase64, 'base64url').toString('utf8');
    const stateData = JSON.parse(stateJson);
    
    // Gerekli alanlar var mı kontrol et
    if (!stateData.userId || !stateData.provider || !stateData.nonce || !stateData.timestamp) {
      return { valid: false, error: 'Missing required fields' };
    }
    
    // Zamanaşımı kontrol et (10 dakika)
    const now = Date.now();
    const age = now - stateData.timestamp;
    
    if (age > STATE_EXPIRY) {
      return { valid: false, error: 'State expired' };
    }
    
    if (age < 0) {
      return { valid: false, error: 'Invalid timestamp' };
    }
    
    // ✅ KRİTİK: Nonce daha önce kullanılmış mı kontrol et (REPLAY SALDIRISI ÖNLEME)
    if (usedNonces.has(stateData.nonce)) {
      return { valid: false, error: 'State already used (replay attack detected)' };
    }
    
    // ✅ Nonce'ı consume et (tek kullanımlık olarak işaretle)
    usedNonces.set(stateData.nonce, now + STATE_EXPIRY);
    
    return {
      valid: true,
      userId: stateData.userId,
      provider: stateData.provider,
      nonce: stateData.nonce
    };
  } catch (error) {
    return { valid: false, error: 'State validation failed: ' + error.message };
  }
}

module.exports = {
  generateState,
  validateState
};

