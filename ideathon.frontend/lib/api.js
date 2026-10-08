/**
 * API Service
 * Backend ile iletişim için merkezi servis
 */
import { isAuthPage, loginUrl } from './authRoutes';

// Backend API URL - Production'da environment variable kullanılmalı
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
const MENTORNET_API_BASE_URL = process.env.NEXT_PUBLIC_MENTORNET_API_URL || 'http://localhost:5002/api/mentornet';

/**
 * HTTP Request Helper
 */
async function requestBase(baseUrl, endpoint, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = {
    ...(typeof FormData !== 'undefined' && options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${baseUrl}${endpoint}`, config);

    // 304 Not Modified için cache'den gelen veriyi işle - başarılı response
    if (response.status === 304) {
      // 304 başarılıdır, cached data kullanılmalı
      // 304'te body olmayabilir, boş success response dön
      return { success: true, data: {} };
    }

    // 401 Unauthorized - Token geçersiz veya süresi dolmuş
    if (response.status === 401) {
      // Token ve user bilgilerini temizle
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Eğer login veya register sayfasında değilsek, login'e yönlendir
        const currentPath = window.location.pathname;
        if (!isAuthPage(currentPath)) {
          // Toast mesajı göstermek için event dispatch et
          window.dispatchEvent(new CustomEvent('auth:unauthorized', {
            detail: { message: 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.' }
          }));
          
          // Login sayfasına yönlendir
          setTimeout(() => {
            window.location.href = loginUrl(currentPath + window.location.search);
          }, 100);
        }
      }
      
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || 'Oturum süreniz doldu');
      error.status = 401;
      throw error;
    }

    // Diğer status kodları için normal işlem
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `HTTP ${response.status}`);
      error.status = response.status;
      error.errors = errorData.errors;
      throw error;
    }

    if (options.responseType === 'blob') return response.blob();
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

const request = (endpoint, options = {}) => requestBase(API_BASE_URL, endpoint, options);

export const entrepreneurAPI = {
  getMyApplication: (signal) => request('/entrepreneurs/my', { signal }),
  beginEdit: (revision) => request('/entrepreneurs/my/edit', { method: 'POST', body: JSON.stringify({ revision }) }),
  cancelEdit: (revision) => request('/entrepreneurs/my/cancel-edit', { method: 'POST', body: JSON.stringify({ revision }) }),
  saveApplication: (payload) => request('/entrepreneurs/my', { method: 'PUT', body: JSON.stringify(payload) }),
  uploadDocument: (questionId, file, revision) => {
    const data = new FormData();
    data.append('revision', String(revision));
    data.append('file', file);
    return request(`/entrepreneurs/documents/${encodeURIComponent(questionId)}`, { method: 'POST', body: data });
  },
  removeDocument: (id, revision) => request(`/entrepreneurs/documents/${id}`, { method: 'DELETE', body: JSON.stringify({ revision }) }),
  downloadDocument: (id, signal) => request(`/entrepreneurs/documents/${id}`, { responseType: 'blob', signal }),
  downloadApplication: (signal) => request('/entrepreneurs/my/export?format=pdf', { responseType: 'blob', signal }),
};
const requestMentorNet = (endpoint, options = {}) => requestBase(MENTORNET_API_BASE_URL, endpoint, options);
const requestUserTeams = (endpoint, options = {}) =>
  requestBase(API_BASE_URL, `/user-teams${endpoint}`, options);

/**
 * Module-level slug fallback — IdeathonContext tarafından güncellenir.
 * localStorage temizlense bile React state'teki slug korunur.
 */
let _slugFallback = null;

export function setSlugFallback(slug) {
  _slugFallback = slug;
}

/**
 * Slug ekleme helper — sadece gerekli çağrılarda kullanılır
 * URL'ye ?event=<slug> parametresini ekler
 * Önce localStorage'a bakar, yoksa context fallback'ini kullanır.
 * @param {string} url - API endpoint URL'i
 * @returns {string} - Slug eklenmiş URL
 */
export function withSlug(url) {
  if (typeof window === 'undefined') return url;
  const slug = localStorage.getItem('ideathon_slug') || _slugFallback;
  if (!slug) return url;

  // Fallback'ten geldiyse localStorage'ı da senkronize et
  if (!localStorage.getItem('ideathon_slug') && _slugFallback) {
    localStorage.setItem('ideathon_slug', _slugFallback);
  }

  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}event=${slug}`;
}

/**
 * ideathonId'yi localStorage'dan al
 * Body'de ideathonId göndermek gerektiğinde kullanılır
 * @returns {string|null}
 */
export function getIdeathonId() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('ideathon_id');
}


/**
 * Authentication API
 */
export const authAPI = {
  // Kayıt ol — ?event=slug ile ideathon'a bağlanır
  register: async (name, email, password, phone = '', { entrepreneur = false } = {}) => {
    return request(entrepreneur ? '/auth/register' : withSlug('/auth/register'), {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
        phone,
        entrepreneur,
        createdBy: null
      }),
    });
  },

  // Giriş yap
  login: async (email, password) => {
    return request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  // Kullanıcı bilgilerini al
  getMe: async () => {
    return request('/auth/me', {
      method: 'GET',
    });
  },

  // Profil güncelle
  updateProfile: async (userData) => {
    return request('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  },

  // Şifre sıfırlama kodu gönder
  forgotPassword: async (email) => {
    return request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Şifreyi sıfırla
  resetPassword: async (email, code, newPassword) => {
    return request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ email, code, newPassword }),
    });
  },

  // Şifre değiştir (authenticated)
  changePassword: async (currentPassword, newPassword) => {
    return request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  },

  // Email tercihlerini getir
  getEmailPreferences: async () => {
    return request('/users/me/email-preferences', {
      method: 'GET',
    });
  },

  // Email tercihlerini güncelle
  updateEmailPreferences: async (preferences) => {
    return request('/users/me/email-preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences),
    });
  },
};

/**
 * Applications API
 */
export const applicationsAPI = {
  // Başvuru oluştur — slug ile ideathon bağlamı sağlanır
  create: async (applicationData) => {
    return request(withSlug('/applications'), {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  },

  // Kendi başvurularımı getir — ideathon filtresi otomatik (slug eklenir)
  getMyApplications: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const base = queryString ? `/applications/my?${queryString}` : '/applications/my';
    return request(withSlug(base), {
      method: 'GET',
    });
  },

  // Başvurumu güncelle — ?event=slug eklenir
  updateMyApplication: async (applicationId, applicationData) => {
    return request(withSlug(`/applications/my/${applicationId}`), {
      method: 'PUT',
      body: JSON.stringify(applicationData),
    });
  },

  // Başvurumu iptal et — ?event=slug eklenir
  withdrawMyApplication: async (applicationId, reason) => {
    return request(withSlug(`/applications/my/${applicationId}/withdraw`), {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },

  // Önceki başvurudan bilgileri ön doldurma
  getPrefill: async () => {
    return request('/applications/my/prefill', {
      method: 'GET',
    });
  },

  // Başvuru durumunu kontrol et (public)
  checkStatus: async (applicationNumber) => {
    return request(`/applications/status/${applicationNumber}`, {
      method: 'GET',
    });
  },

  // V2: Sunum bilgilerini getir
  getPresentationInfo: async (applicationId) => {
    return request(`/applications/my/${applicationId}/presentation`, {
      method: 'GET',
    });
  },

  // V2: Sunum dosyası yükle
  uploadPresentation: async (applicationId, file) => {
    const formData = new FormData();
    formData.append('presentationFile', file);

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    
    try {
      const response = await fetch(`${API_BASE_URL}/applications/my/${applicationId}/presentation/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          const currentPath = window.location.pathname;
          if (!isAuthPage(currentPath)) {
            window.dispatchEvent(new CustomEvent('auth:unauthorized', {
              detail: { message: 'Oturum süreniz doldu. Lütfen tekrar giriş yapın.' }
            }));
            setTimeout(() => {
              window.location.href = loginUrl(currentPath + window.location.search);
            }, 100);
          }
        }
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || 'Oturum süreniz doldu');
        error.status = 401;
        throw error;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(errorData.message || `HTTP ${response.status}`);
        error.status = response.status;
        throw error;
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  // V2: Proje açıklaması ekle/güncelle
  updateProjectDescription: async (applicationId, description) => {
    return request(`/applications/my/${applicationId}/presentation/description`, {
      method: 'PATCH',
      body: JSON.stringify({ projectDescription: description }),
    });
  },

  // V2: Sunum dosyasını sil
  deletePresentationFile: async (applicationId) => {
    return request(`/applications/my/${applicationId}/presentation/file`, {
      method: 'DELETE',
    });
  },
};

/**
 * Contact API - İletişim formu işlemleri
 */
export const contactAPI = {
  // İletişim formu gönder (public) — ?event=slug ile ideathon'a bağlanır
  submitContactForm: async (contactData) => {
    return request(withSlug('/contact'), {
      method: 'POST',
      body: JSON.stringify(contactData),
    });
  },

  // İletişim formlarını listele (admin)
  getContactForms: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/contact?${queryString}` : '/contact';
    return request(endpoint, {
      method: 'GET',
    });
  },

  // İletişim formu detayı getir (admin)
  getContactForm: async (contactId) => {
    return request(`/contact/${contactId}`, {
      method: 'GET',
    });
  },

  // İletişim formu durumunu güncelle (admin)
  updateContactStatus: async (contactId, status) => {
    return request(`/contact/${contactId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // İletişim formu istatistikleri (admin)
  getContactStats: async () => {
    return request('/contact/stats', {
      method: 'GET',
    });
  },
};

/**
 * MentorNet API
 */
export const mentorNetAPI = {
  // Mentors — ideathon filtresi otomatik (slug eklenir)
  getMentors: async (params = {}) => {
    // Slug'ı params'a ekle (varsa)
    if (typeof window !== 'undefined') {
      const slug = localStorage.getItem('ideathon_slug');
      if (slug) params.event = slug;
    }
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/mentors?${queryString}` : '/mentors';
    return requestMentorNet(endpoint, { method: 'GET' });
  },

  getMentor: async (userId) => {
    return requestMentorNet(withSlug(`/mentors/${userId}`), { method: 'GET' });
  },

  getMentorStats: async (userId) => {
    return requestMentorNet(withSlug(`/mentors/${userId}/stats`), { method: 'GET' });
  },

  // Availability — ?event=slug eklenir
  getAvailability: async (mentorUserId, params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString
      ? `/availability/${mentorUserId}?${queryString}`
      : `/availability/${mentorUserId}`;
    return requestMentorNet(withSlug(endpoint), { method: 'GET' });
  },

  // Meetings — tüm meeting çağrılarına ?event=slug eklenir
  createMeeting: async (payload) => {
    return requestMentorNet(withSlug('/meetings'), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMeetings: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = queryString ? `/meetings?${queryString}` : '/meetings';
    return requestMentorNet(withSlug(endpoint), { method: 'GET' });
  },

  getMeeting: async (meetingId) => {
    return requestMentorNet(withSlug(`/meetings/${meetingId}`), { method: 'GET' });
  },

  cancelMeeting: async (meetingId, reason = '') => {
    return requestMentorNet(withSlug(`/meetings/${meetingId}/cancel`), {
      method: 'PATCH',
      body: JSON.stringify({ reason }),
    });
  },

  rescheduleMeeting: async (meetingId, payload) => {
    return requestMentorNet(withSlug(`/meetings/${meetingId}/reschedule`), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  joinMeeting: async (meetingId) => {
    return requestMentorNet(withSlug(`/meetings/${meetingId}/join`), { method: 'POST' });
  },

  getAttendance: async (meetingId) => {
    return requestMentorNet(withSlug(`/meetings/${meetingId}/attendance`), { method: 'GET' });
  },

  giveFeedback: async (meetingId, payload) => {
    return requestMentorNet(withSlug(`/meetings/${meetingId}/feedback`), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getFeedbacks: async (meetingId) => {
    return requestMentorNet(withSlug(`/meetings/${meetingId}/feedback`), { method: 'GET' });
  },

  getMeetingNotes: async (meetingId) => {
    return requestMentorNet(withSlug(`/meetings/${meetingId}/notes`), { method: 'GET' });
  },

  // Feedback Yönetimi
  getMyGivenFeedbacks: async () => {
    return requestMentorNet(withSlug('/feedbacks/my-given'), { method: 'GET' });
  },

  updateFeedback: async (feedbackId, payload) => {
    return requestMentorNet(withSlug(`/feedbacks/${feedbackId}`), {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // Katılım Toggle
  toggleAttendance: async (meetingId, attended) => {
    return requestMentorNet(withSlug(`/meetings/${meetingId}/attendance/toggle`), {
      method: 'PATCH',
      body: JSON.stringify({ attended }),
    });
  },
};

/**
 * Messaging API - MentorNet Mesajlaşma Sistemi
 */
export const messagingAPI = {
  // Konuşmaları listele — ?event=slug eklenir
  getConversations: async (isArchived = false) => {
    const base = isArchived ? '/messages/conversations?isArchived=true' : '/messages/conversations';
    return requestMentorNet(withSlug(base), { method: 'GET' });
  },

  // Konuşma detayı getir
  getConversation: async (conversationId) => {
    return requestMentorNet(withSlug(`/messages/conversations/${conversationId}`), { method: 'GET' });
  },

  // Yeni konuşma başlat veya mevcut konuşmayı getir — ?event=slug eklenir
  createOrGetConversation: async (participantUserId, programId = null) => {
    const body = { participantUserId };
    if (programId) body.programId = programId;
    return requestMentorNet(withSlug('/messages/conversations'), {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  // Mesajları getir
  getMessages: async (conversationId, limit = 50, skip = 0, before = null) => {
    let query = `?limit=${limit}&skip=${skip}`;
    if (before) query += `&before=${before}`;
    return requestMentorNet(withSlug(`/messages/${conversationId}${query}`), { method: 'GET' });
  },

  // Mesaj gönder
  sendMessage: async (conversationId, text, messageType = 'text') => {
    return requestMentorNet(withSlug(`/messages/${conversationId}`), {
      method: 'POST',
      body: JSON.stringify({ text, messageType }),
    });
  },

  // Mesajları okundu işaretle
  markAsRead: async (conversationId) => {
    return requestMentorNet(withSlug(`/messages/${conversationId}/mark-read`), { method: 'POST' });
  },

  // Toplam okunmamış mesaj sayısı — ?event=slug eklenir
  getUnreadCount: async () => {
    return requestMentorNet(withSlug('/messages/unread-count'), { method: 'GET' });
  },

  // Kullanıcı online durumu kontrol
  getOnlineStatus: async (userId) => {
    return requestMentorNet(withSlug(`/messages/online-status/${userId}`), { method: 'GET' });
  },

  // Online kullanıcıları getir
  getOnlineUsers: async () => {
    return requestMentorNet(withSlug('/messages/online-users'), { method: 'GET' });
  },

  // Konuşmayı arşivle
  archiveConversation: async (conversationId) => {
    return requestMentorNet(withSlug(`/messages/conversations/${conversationId}/archive`), { method: 'PATCH' });
  },

  // Konuşmayı arşivden çıkar
  unarchiveConversation: async (conversationId) => {
    return requestMentorNet(withSlug(`/messages/conversations/${conversationId}/unarchive`), { method: 'PATCH' });
  },
};

/**
 * Team Management API (User Teams)
 */
export const teamAPI = {
  // Takımı getir — slug ile ideathon bağlamı sağlanır
  getMyTeam: async () => {
    return requestUserTeams(withSlug('/my-team'), { method: 'GET' });
  },

  // Takım oluştur — slug ile ideathon bağlamı sağlanır
  createTeam: async (teamData) => {
    return requestUserTeams(withSlug('/my-team'), {
      method: 'POST',
      body: JSON.stringify(teamData),
    });
  },

  // Takım bilgilerini güncelle
  updateTeam: async (teamData) => {
    return requestUserTeams('/my-team', {
      method: 'PUT',
      body: JSON.stringify(teamData),
    });
  },

  // Takımı sil
  deleteTeam: async () => {
    return requestUserTeams('/my-team', { method: 'DELETE' });
  },

  // Takıma üye ekle
  addMember: async (memberData) => {
    return requestUserTeams('/my-team/members', {
      method: 'POST',
      body: JSON.stringify(memberData),
    });
  },

  // Takım üyesini güncelle
  updateMember: async (memberIndex, memberData) => {
    return requestUserTeams(`/my-team/members/${memberIndex}`, {
      method: 'PUT',
      body: JSON.stringify(memberData),
    });
  },

  // Takım üyesini sil
  deleteMember: async (memberIndex) => {
    return requestUserTeams(`/my-team/members/${memberIndex}`, { method: 'DELETE' });
  },
};

/**
 * Ideathon API — Public ideathon durumları
 * Next.js proxy üzerinden çağrılır (backend URL gizlenir)
 */
export const ideathonAPI = {
  // Ideathon durumunu getir (public) — proxy üzerinden
  getPublicBySlug: async (slug) => {
    if (!slug) return { success: false, message: 'Slug gerekli' };
    const response = await fetch(`/api/ideathon-status/${slug}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return await response.json();
  },
};

export default { authAPI, applicationsAPI, contactAPI, mentorNetAPI, messagingAPI, teamAPI, ideathonAPI };
