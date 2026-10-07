/**
 * Auth Helper Functions
 * Token yönetimi ve auth utilities
 */

// /auth/me kullanıcıyı data altında, giriş/kayıt ise data.user altında döndürür.
export const getAuthUser = (response) => {
  if (!response?.success) return null;
  const user = response.data?.user || response.data;
  return user && typeof user._id === 'string' ? user : null;
};

/**
 * Token'ı localStorage'a kaydet
 */
export const setToken = (token) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

/**
 * Token'ı localStorage'dan al
 */
export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

/**
 * Token'ı localStorage'dan sil
 */
export const removeToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
  }
};

/**
 * Kullanıcı giriş yapmış mı kontrol et
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Kullanıcının baş harflerini al
 * @param {string} name - Kullanıcı adı
 * @returns {string} - Baş harfler (örn: "Ahmet Yılmaz" -> "AY")
 */
export const getInitials = (name) => {
  if (!name || typeof name !== 'string') return '?';

  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Kullanıcının rolüne göre renk döndür
 */
export const getRoleColor = (role) => {
  const colors = {
    user: '#2563eb',
    juri: '#dc2626',
    superadmin: '#7c3aed',
  };
  return colors[role] || colors.user;
};

/**
 * Kullanıcı bilgilerini localStorage'a kaydet
 */
export const setUser = (user) => {
  if (typeof window !== 'undefined') {
    // user null veya undefined ise kaydetme
    if (user && typeof user === 'object') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }
};

/**
 * Kullanıcı bilgilerini localStorage'dan al
 */
export const getUser = () => {
  if (typeof window !== 'undefined') {
    try {
      const user = localStorage.getItem('user');
      // "undefined" string'ini veya null'u kontrol et
      if (!user || user === 'undefined' || user === 'null') {
        return null;
      }
      return JSON.parse(user);
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
      // Hatalı veri varsa temizle
      localStorage.removeItem('user');
      return null;
    }
  }
  return null;
};

/**
 * Kullanıcı bilgilerini localStorage'dan sil
 */
export const removeUser = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('user');
  }
};

/**
 * Tam çıkış - tüm verileri temizle (ideathon bilgileri dahil)
 */
export const logout = () => {
  removeToken();
  removeUser();
  // Ideathon verilerini de temizle
  if (typeof window !== 'undefined') {
    localStorage.removeItem('ideathon_slug');
    localStorage.removeItem('ideathon_id');
  }
};
