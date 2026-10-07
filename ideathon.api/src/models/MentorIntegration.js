const mongoose = require('mongoose');
const crypto = require('crypto');

const mentorIntegrationSchema = new mongoose.Schema({
  // Mentor bilgisi
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Provider bilgisi
  provider: {
    type: String,
    enum: ['google', 'microsoft', 'zoom'],
    required: true
  },

  // Bağlantı durumu
  status: {
    type: String,
    enum: ['connected', 'revoked', 'error'],
    default: 'connected'
  },

  // OAuth token'ları (şifrelenmiş)
  accessToken: {
    type: String,
    required: true
  },

  refreshToken: {
    type: String,
    required: false // Zoom'da olmayabilir
  },

  // Token geçerlilik süresi
  expiresAt: {
    type: Date,
    required: true
  },

  // Provider'dan dönen scope'lar
  scope: {
    type: String,
    required: false
  },

  // Provider hesap ID'si
  providerAccountId: {
    type: String,
    required: false
  },

  // Provider'da kullanılan email
  email: {
    type: String,
    required: false
  },

  // Ek provider bilgileri
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Index'ler
mentorIntegrationSchema.index({ userId: 1, provider: 1 }, { unique: true });
mentorIntegrationSchema.index({ status: 1 });
mentorIntegrationSchema.index({ expiresAt: 1 });

// ==================== ENCRYPTION METHODS (AES-256-GCM) ====================

const ENCRYPTION_KEY = process.env.INTEGRATION_ENCRYPTION_KEY || 'emlak-konut-default-32-char-key!'; // 32 karakter
const ALGORITHM = 'aes-256-gcm'; // GCM mode (Galois/Counter Mode) - authenticated encryption

/**
 * Token'ı şifrele (AES-256-GCM)
 * Format: iv:authTag:cipherText
 */
function encryptToken(token) {
  if (!token) return null;
  
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const iv = crypto.randomBytes(12); // GCM için 12 byte IV önerilir
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(token, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag(); // Authentication tag (bütünlük kontrolü)
  
  // Format: iv:authTag:cipherText
  return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
}

/**
 * Token'ı çöz (AES-256-GCM)
 */
function decryptToken(encryptedToken) {
  if (!encryptedToken) return null;
  
  try {
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
    const parts = encryptedToken.split(':');
    
    // Format kontrolü
    if (parts.length !== 3) {
      // Eski format (CBC) için backward compatibility
      if (parts.length === 2) {
        return decryptTokenLegacyCBC(encryptedToken);
      }
      // Plaintext token (şifrelenmeden kaydedilmiş — findOneAndUpdate bug'ından kalan)
      if (parts.length === 1) {
        return encryptedToken;
      }
      throw new Error('Invalid encrypted token format');
    }
    
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag); // Authentication tag kontrolü
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Token decryption failed:', error.message);
    return null;
  }
}

/**
 * Eski CBC formatındaki token'ları çöz (backward compatibility)
 */
function decryptTokenLegacyCBC(encryptedToken) {
  try {
    const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
    const parts = encryptedToken.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Legacy CBC token decryption failed:', error.message);
    return null;
  }
}

// ==================== PRE-SAVE HOOK ====================

mentorIntegrationSchema.pre('save', function(next) {
  // accessToken'ı şifrele (eğer değiştirilmişse)
  if (this.isModified('accessToken') && this.accessToken && !this.accessToken.includes(':')) {
    this.accessToken = encryptToken(this.accessToken);
  }
  
  // refreshToken'ı şifrele (eğer değiştirilmişse)
  if (this.isModified('refreshToken') && this.refreshToken && !this.refreshToken.includes(':')) {
    this.refreshToken = encryptToken(this.refreshToken);
  }
  
  next();
});

// ==================== INSTANCE METHODS ====================

/**
 * Decrypted token'ları al
 */
mentorIntegrationSchema.methods.getDecryptedTokens = function() {
  return {
    accessToken: decryptToken(this.accessToken),
    refreshToken: decryptToken(this.refreshToken)
  };
};

/**
 * Token'ın geçerli olup olmadığını kontrol et
 */
mentorIntegrationSchema.methods.isTokenValid = function() {
  if (this.status !== 'connected') return false;
  if (!this.expiresAt) return false;
  
  // 5 dakika buffer ekle (refresh için)
  const bufferTime = 5 * 60 * 1000; // 5 dakika
  return new Date(this.expiresAt).getTime() - bufferTime > Date.now();
};

/**
 * Token'ı güncelle
 */
mentorIntegrationSchema.methods.updateTokens = async function(accessToken, refreshToken, expiresIn) {
  this.accessToken = accessToken; // Pre-save hook şifreleyecek
  
  if (refreshToken) {
    this.refreshToken = refreshToken; // Pre-save hook şifreleyecek
  }
  
  if (expiresIn) {
    // expiresIn saniye cinsinden gelir
    this.expiresAt = new Date(Date.now() + (expiresIn * 1000));
  }
  
  this.status = 'connected';
  
  await this.save();
};

/**
 * Entegrasyonu revoke et
 */
mentorIntegrationSchema.methods.revoke = async function() {
  this.status = 'revoked';
  await this.save();
};

// ==================== STATIC METHODS ====================

/**
 * Kullanıcının aktif entegrasyonunu getir
 */
mentorIntegrationSchema.statics.findActiveIntegration = async function(userId, provider) {
  return await this.findOne({
    userId: userId,
    provider: provider,
    status: 'connected'
  });
};

/**
 * Kullanıcının tüm entegrasyonlarını getir
 */
mentorIntegrationSchema.statics.findUserIntegrations = async function(userId) {
  return await this.find({
    userId: userId
  }).select('-accessToken -refreshToken'); // Token'ları döndürme
};

/**
 * Kullanıcının aktif meeting provider'ını bul
 */
mentorIntegrationSchema.statics.findActiveMeetingProvider = async function(userId) {
  // Öncelik sırası: Google > Microsoft > Zoom
  const providers = ['google', 'microsoft', 'zoom'];
  
  for (const provider of providers) {
    const integration = await this.findActiveIntegration(userId, provider);
    if (integration && integration.isTokenValid()) {
      return integration;
    }
  }
  
  return null; // Aktif provider yok, Jitsi kullan
};

module.exports = mongoose.model('MentorIntegration', mentorIntegrationSchema);

