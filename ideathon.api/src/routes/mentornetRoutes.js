const express = require('express');
const router = express.Router();

const {
  authenticate,
  optionalAuth,
  requireSuperAdminOrAdmin,
  requireMentor,
  requireMentorOrAdmin,
  attachIdeathonFromJwtOnly,
  attachIdeathonFromHeaderOrQuery
} = require('../middleware/auth');

const { uploadMentorPhoto } = require('../middleware/upload');

const mentornetController = require('../controllers/mentornetController');
const availabilityController = require('../controllers/availabilityController');
const meetingController = require('../controllers/meetingController');
const messagingController = require('../controllers/messagingController');

// ==================== SUPERADMIN STATS ROUTES ====================

// Superadmin Dashboard İstatistikleri
router.get('/stats/dashboard',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  mentornetController.getSuperadminDashboard
);

// ==================== PARTICIPANTS & TEAMS ROUTES ====================

// Katılımcıları takımlarıyla beraber getir (mentor veya admin)
router.get('/participants',
  authenticate,
  requireMentorOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  mentornetController.getParticipantsWithTeams
);

// ==================== MENTOR PROFILE ROUTES ====================

// ⚠️ ÖNEMLİ: Özel route'lar (/:userId parametresiz) parametreli route'lardan ÖNCE tanımlanmali!

// === MENTOR SELF ROUTES (Özel endpoint'ler - mentor kendi profili için) ===

// Kendi mentor profilimi görüntüle (mentor)
router.get('/mentors/profile',
  authenticate,
  requireMentor,
  attachIdeathonFromJwtOnly,
  mentornetController.getMyMentorProfile
);

// Kendi mentor profilimi güncelle (mentor)
router.put('/mentors/profile',
  authenticate,
  requireMentor,
  attachIdeathonFromJwtOnly,
  mentornetController.updateMyMentorProfile
);

// Kendi profil fotoğrafımı yükle (mentor)
router.post('/mentors/profile/photo',
  authenticate,
  requireMentor,
  attachIdeathonFromJwtOnly,
  uploadMentorPhoto.single('photo'),
  mentornetController.uploadMyMentorPhoto
);

// Kendi istatistiklerimi getir - Dashboard (mentor)
router.get('/mentors/profile/stats',
  authenticate,
  requireMentor,
  attachIdeathonFromJwtOnly,
  mentornetController.getMyMentorStats
);

// Kendi email tercihlerimi getir (mentor)
router.get('/mentors/email-preferences',
  authenticate,
  requireMentor,
  attachIdeathonFromJwtOnly,
  mentornetController.getMyEmailPreferences
);

// Kendi email tercihlerimi güncelle (mentor)
router.patch('/mentors/email-preferences',
  authenticate,
  requireMentor,
  attachIdeathonFromJwtOnly,
  mentornetController.updateMyEmailPreferences
);

// === PUBLIC/ADMIN ROUTES (Genel erişim) ===

// Mentorları genişletilmiş istatistiklerle listele (SuperAdmin)
router.get('/mentors/with-stats',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  mentornetController.getMentorsWithExtendedStats
);

// Mentorları listele (public/authenticated - optional auth)
router.get('/mentors',
  optionalAuth,
  mentornetController.getMentors
);

// Mentor profili oluştur (admin)
router.post('/mentors',
  authenticate,
  requireSuperAdminOrAdmin,
  mentornetController.createMentorProfile
);

// Kendi atanmış kullanıcılarımı getir (mentor self)
router.get('/mentors/my-assigned-users',
  authenticate,
  requireMentor,
  attachIdeathonFromJwtOnly,
  mentornetController.getMyAssignedUsers
);

// === PARAMETERIZED ROUTES (/:userId ile - sonra tanımlanmalı!) ===

// Mentora atanmış kullanıcıları getir (SuperAdmin/Admin)
router.get('/mentors/:userId/assigned-users',
  authenticate,
  requireSuperAdminOrAdmin,
  mentornetController.getMentorAssignedUsers
);

// Mentora kullanıcı ata/çıkar (SuperAdmin/Admin)
router.put('/mentors/:userId/assign-users',
  authenticate,
  requireSuperAdminOrAdmin,
  mentornetController.updateMentorAssignedUsers
);

// Mentor detayı (public/authenticated - optional auth)
router.get('/mentors/:userId',
  optionalAuth,
  mentornetController.getMentorByUserId
);

// Mentor istatistikleri (public)
router.get('/mentors/:userId/stats',
  mentornetController.getMentorStats
);

// Mentor detaylı istatistikleri (SuperAdmin) - User ID veya MentorProfile ID ile çalışır
router.get('/mentors/:id/detailed-stats',
  authenticate,
  requireSuperAdminOrAdmin,
  attachIdeathonFromHeaderOrQuery,
  mentornetController.getMentorDetailedStats
);

// Mentor profili güncelle (mentor self veya admin)
router.patch('/mentors/:userId',
  authenticate,
  requireMentorOrAdmin,
  mentornetController.updateMentorProfile
);

// Mentor profil fotoğrafı yükle (mentor self veya admin)
router.post('/mentors/:userId/photo',
  authenticate,
  requireMentorOrAdmin,
  uploadMentorPhoto.single('photo'),
  mentornetController.uploadMentorPhoto
);

// Mentor profilini sil (admin)
router.delete('/mentors/:userId',
  authenticate,
  requireSuperAdminOrAdmin,
  mentornetController.deleteMentorProfile
);

// ==================== AVAILABILITY RULES ROUTES ====================

// Kendi kurallarını getir (mentor)
router.get('/availability/rules/me',
  authenticate,
  requireMentor,
  attachIdeathonFromJwtOnly,
  availabilityController.getMyRules
);

// Kural oluştur (mentor)
router.post('/availability/rules',
  authenticate,
  requireMentor,
  attachIdeathonFromJwtOnly,
  availabilityController.createRule
);

// Kural güncelle (mentor)
router.put('/availability/rules/:id',
  authenticate,
  requireMentor,
  attachIdeathonFromJwtOnly,
  availabilityController.updateRule
);

// Kural sil (mentor)
router.delete('/availability/rules/:id',
  authenticate,
  requireMentor,
  attachIdeathonFromJwtOnly,
  availabilityController.deleteRule
);

// ==================== AVAILABILITY SLOTS ROUTES ====================

// Mentor'un müsait slotlarını getir (public/authenticated)
router.get('/availability/:mentorUserId',
  availabilityController.getAvailableSlots
);

// Kendi slotlarını getir (mentor)
router.get('/availability/slots/me',
  authenticate,
  requireMentor,
  attachIdeathonFromJwtOnly,
  availabilityController.getMySlots
);

// Manuel slot ekle (mentor)
router.post('/availability/slots',
  authenticate,
  requireMentor,
  attachIdeathonFromJwtOnly,
  availabilityController.createManualSlot
);

// Slot iptal et (mentor)
router.delete('/availability/slots/:id',
  authenticate,
  requireMentor,
  attachIdeathonFromJwtOnly,
  availabilityController.cancelSlot
);

// Süresi dolmuş rezervasyonları temizle (admin - cron job için)
router.post('/availability/expire-reservations',
  authenticate,
  requireSuperAdminOrAdmin,
  availabilityController.expireReservations
);

// ==================== MEETING ROUTES ====================

// Manuel: Geçmiş toplantıları tamamla (admin - test/debug için)
router.post('/meetings/auto-complete',
  authenticate,
  requireSuperAdminOrAdmin,
  meetingController.autoCompletePastMeetings
);

// Mentor tarafından toplantı planla (mentor kendi slotu + atanmış kullanıcı)
router.post('/meetings/plan',
  authenticate,
  requireMentor,
  attachIdeathonFromJwtOnly,
  meetingController.planMeeting
);

// Toplantı oluştur (authenticated user)
router.post('/meetings',
  authenticate,
  meetingController.createMeeting
);

// İptal edilmiş toplantıları listele (mentor paneli için)
router.get('/meetings/cancelled',
  authenticate,
  meetingController.getCancelledMeetings
);

// Tamamlanmış toplantıları listele (mentor paneli için)
router.get('/meetings/completed',
  authenticate,
  meetingController.getCompletedMeetings
);

// Toplantıları listele (role bazlı)
router.get('/meetings',
  authenticate,
  meetingController.getMeetings
);

// Toplantı detayı
router.get('/meetings/:id',
  authenticate,
  meetingController.getMeetingById
);

// Toplantı iptal et
router.patch('/meetings/:id/cancel',
  authenticate,
  meetingController.cancelMeeting
);

// Toplantı tamamla (mentor/admin)
router.patch('/meetings/:id/complete',
  authenticate,
  requireMentorOrAdmin,
  meetingController.completeMeeting
);

// Toplantı yeniden planla
router.post('/meetings/:id/reschedule',
  authenticate,
  meetingController.rescheduleMeeting
);

// Toplantı feedback ver
router.post('/meetings/:id/feedback',
  authenticate,
  meetingController.createFeedback
);

// 🆕 Belirli toplantı için kendi feedback'imi getir
router.get('/meetings/:id/my-feedback',
  authenticate,
  meetingController.getMyFeedbackForMeeting
);

// 🆕 Kendi verdiğim feedback'leri listele
router.get('/feedbacks/my-given',
  authenticate,
  meetingController.getMyGivenFeedbacks
);

// 🆕 Bana verilen feedback'leri listele (mentor)
router.get('/feedbacks/received',
  authenticate,
  requireMentor,
  attachIdeathonFromJwtOnly,
  meetingController.getReceivedFeedbacks
);

// 🆕 Feedback düzenle
router.put('/feedbacks/:id',
  authenticate,
  meetingController.updateFeedback
);

// 🆕 Meeting durumunu değiştir (Mentor)
router.patch('/meetings/:id/status',
  authenticate,
  requireMentor,
  attachIdeathonFromJwtOnly,
  meetingController.updateMeetingStatus
);

// 🆕 Manuel katılım toggle
router.patch('/meetings/:id/attendance/toggle',
  authenticate,
  meetingController.toggleAttendance
);

// Toplantı notlarını getir
router.get('/meetings/:id/notes',
  authenticate,
  meetingController.getMeetingNotes
);

// Toplantı notu ekle
router.post('/meetings/:id/notes',
  authenticate,
  meetingController.createMeetingNote
);

// Toplantıya katılım kaydı
router.post('/meetings/:id/join',
  authenticate,
  meetingController.joinMeeting
);

// Toplantı katılım bilgisi
router.get('/meetings/:id/attendance',
  authenticate,
  meetingController.getMeetingAttendance
);

// ==================== MESSAGING ROUTES ====================

// ⚠️ ÖNEMLİ: Static route'lar (parametresiz) dynamic route'lardan (/:param) ÖNCE tanımlanmalı!

// === STATIC ROUTES (Önce) ===

// Toplam okunmamış mesaj sayısı
router.get('/messages/unread-count',
  authenticate,
  messagingController.getUnreadCount
);

// Tüm online kullanıcıları getir
router.get('/messages/online-users',
  authenticate,
  messagingController.getOnlineUsers
);

// Arşivlenmiş konuşmaları listele (mentor paneli için)
router.get('/messages/conversations/archived',
  authenticate,
  messagingController.getArchivedConversations
);

// Konuşmaları listele
router.get('/messages/conversations',
  authenticate,
  messagingController.getConversations
);

// Yeni konuşma başlat veya mevcut konuşmayı getir
router.post('/messages/conversations',
  authenticate,
  messagingController.createOrGetConversation
);

// === DYNAMIC ROUTES (Sonra) ===

// Online kullanıcı kontrolü
router.get('/messages/online-status/:userId',
  authenticate,
  messagingController.checkOnlineStatus
);

// Konuşma detayı
router.get('/messages/conversations/:id',
  authenticate,
  messagingController.getConversationById
);

// Konuşmayı arşivle
router.patch('/messages/conversations/:id/archive',
  authenticate,
  messagingController.archiveConversation
);

// Konuşmayı arşivden çıkar
router.patch('/messages/conversations/:id/unarchive',
  authenticate,
  messagingController.unarchiveConversation
);

// Konuşmanın mesajlarını getir
router.get('/messages/:conversationId',
  authenticate,
  messagingController.getMessages
);

// Mesaj gönder
router.post('/messages/:conversationId',
  authenticate,
  messagingController.sendMessage
);

// Mesajları okundu olarak işaretle
router.post('/messages/:conversationId/mark-read',
  authenticate,
  messagingController.markAsRead
);

module.exports = router;

