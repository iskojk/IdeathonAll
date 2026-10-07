import ax from "../axios";

// ===============================
// CONVERSATIONS
// ===============================

/**
 * Konuşma oluştur veya mevcut konuşmayı getir
 * @param {string} participantUserId - Konuşma yapılacak kullanıcının ID'si
 */
export const createOrGetConversation = async (participantUserId) => {
  const res = await ax.post(`/mentornet/messages/conversations`, {
    participantUserId,
  });
  return res.data;
};

/**
 * Tüm konuşmaları listele
 * @param {boolean} isArchived - Arşivlenmiş mi?
 */
export const getConversations = async (isArchived = false) => {
  const res = await ax.get(`/mentornet/messages/conversations`, {
    params: { isArchived },
  });
  return res.data;
};

/**
 * Conversation detayı getir
 * @param {string} conversationId
 */
export const getConversationDetail = async (conversationId) => {
  const res = await ax.get(`/mentornet/messages/conversations/${conversationId}`);
  return res.data;
};

/**
 * Konuşmayı arşivle
 * @param {string} conversationId
 */
export const archiveConversation = async (conversationId) => {
  const res = await ax.patch(`/mentornet/messages/conversations/${conversationId}/archive`);
  return res.data;
};

/**
 * Konuşmayı arşivden çıkar
 * @param {string} conversationId
 */
export const unarchiveConversation = async (conversationId) => {
  const res = await ax.patch(`/mentornet/messages/conversations/${conversationId}/unarchive`);
  return res.data;
};

/**
 * Arşivlenmiş konuşmaları getir (Yeni endpoint)
 * @param {object} params - { programId }
 */
export const getArchivedConversations = async (params = {}) => {
  const res = await ax.get(`/mentornet/messages/conversations/archived`, { params });
  return res.data;
};

// ===============================
// MESSAGES
// ===============================

/**
 * Mesajları getir
 * @param {string} conversationId
 * @param {object} options - { limit, skip, before }
 */
export const getMessages = async (conversationId, options = {}) => {
  const { limit = 50, skip = 0, before } = options;
  const params = { limit, skip };
  if (before) params.before = before;

  const res = await ax.get(`/mentornet/messages/${conversationId}`, { params });
  return res.data;
};

/**
 * Mesaj gönder
 * @param {string} conversationId
 * @param {object} messageData - { text, messageType }
 */
export const sendMessage = async (conversationId, messageData) => {
  const res = await ax.post(`/mentornet/messages/${conversationId}`, messageData);
  return res.data;
};

/**
 * Mesajları okundu işaretle
 * @param {string} conversationId
 */
export const markMessagesAsRead = async (conversationId) => {
  const res = await ax.post(`/mentornet/messages/${conversationId}/mark-read`);
  return res.data;
};

// ===============================
// STATISTICS
// ===============================

/**
 * Toplam okunmamış mesaj sayısı
 */
export const getUnreadCount = async () => {
  const res = await ax.get(`/mentornet/messages/unread-count`);
  return res.data;
};

/**
 * Online kullanıcıları getir
 */
export const getOnlineUsers = async () => {
  const res = await ax.get(`/mentornet/messages/online-users`);
  return res.data;
};

/**
 * Katılımcı online durumu kontrol
 * @param {string} userId
 */
export const getOnlineStatus = async (userId) => {
  const res = await ax.get(`/mentornet/messages/online-status/${userId}`);
  return res.data;
};



