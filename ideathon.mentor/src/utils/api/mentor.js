// utils/api/mentor.js
import axios from "axios";

const BASE = (process.env.NEXT_PUBLIC_API_BASE_URL_APP || "http://localhost:5002/api").replace(/\/+$/, "");

const ax = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// Request interceptor - Token'ı her istekte header'a ekle
ax.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - 401 hatasında logout yap
ax.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("mentorProfile");
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

// ---- MENTOR PROFILE ----
export const getMentorProfile = async () => {
  const res = await ax.get("/mentornet/mentors/profile");
  return res.data;
};

export const updateMentorProfile = async (profileData) => {
  const res = await ax.put("/mentornet/mentors/profile", profileData);
  return res.data;
};

export const uploadMentorPhoto = async (formData) => {
  const res = await ax.post("/mentornet/mentors/profile/photo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};

// ---- AVAILABILITY ----
export const getMyAvailabilityRules = async (params) => {
  const res = await ax.get("/mentornet/availability/rules/me", { params });
  return res.data;
};

export const createAvailabilityRule = async (ruleData) => {
  const res = await ax.post("/mentornet/availability/rules", ruleData);
  return res.data;
};

export const updateAvailabilityRule = async (ruleId, ruleData) => {
  const res = await ax.put(`/mentornet/availability/rules/${ruleId}`, ruleData);
  return res.data;
};

export const deleteAvailabilityRule = async (ruleId) => {
  const res = await ax.delete(`/mentornet/availability/rules/${ruleId}`);
  return res.data;
};

export const getMySlots = async (params) => {
  const res = await ax.get("/mentornet/availability/slots/me", { params });
  return res.data;
};

export const createManualSlot = async (slotData) => {
  const res = await ax.post("/mentornet/availability/slots", slotData);
  return res.data;
};

export const deleteSlot = async (slotId, reason = null) => {
  const res = await ax.delete(`/mentornet/availability/slots/${slotId}`, {
    data: { reason: reason || "Mentor tarafından silindi" }
  });
  return res.data;
};

// ---- MEETINGS ----
export const getMyMeetings = async (params) => {
  const res = await ax.get("/mentornet/meetings", { params });
  return res.data;
};

export const getMeetingDetails = async (meetingId) => {
  const res = await ax.get(`/mentornet/meetings/${meetingId}`);
  return res.data;
};

export const joinMeeting = async (meetingId) => {
  const res = await ax.post(`/mentornet/meetings/${meetingId}/join`);
  return res.data;
};

export const getMeetingAttendance = async (meetingId) => {
  const res = await ax.get(`/mentornet/meetings/${meetingId}/attendance`);
  return res.data;
};

export const cancelMeeting = async (meetingId, data) => {
  const res = await ax.patch(`/mentornet/meetings/${meetingId}/cancel`, data);
  return res.data;
};

export const rescheduleMeeting = async (meetingId, data) => {
  const res = await ax.post(`/mentornet/meetings/${meetingId}/reschedule`, data);
  return res.data;
};

export const completeMeeting = async (meetingId) => {
  const res = await ax.patch(`/mentornet/meetings/${meetingId}/complete`);
  return res.data;
};

// İptal edilmiş toplantıları getir
export const getCancelledMeetings = async (params) => {
  const res = await ax.get("/mentornet/meetings/cancelled", { params });
  return res.data;
};

// Tamamlanmış toplantıları getir (Yeni endpoint - 21 Ocak 2026)
export const getCompletedMeetings = async (params) => {
  const res = await ax.get("/mentornet/meetings/completed", { params });
  return res.data;
};

// ---- MEETING NOTES ----
export const addMeetingNote = async (meetingId, noteData) => {
  const res = await ax.post(`/mentornet/meetings/${meetingId}/notes`, noteData);
  return res.data;
};

export const getMeetingNotes = async (meetingId) => {
  const res = await ax.get(`/mentornet/meetings/${meetingId}/notes`);
  return res.data;
};

export const getMyMeetingFeedback = async (meetingId) => {
  const res = await ax.get(`/mentornet/meetings/${meetingId}/my-feedback`);
  return res.data;
};

export const submitFeedback = async (meetingId, feedbackData) => {
  // Doğru endpoint: /mentornet/meetings/:id/feedback
  const res = await ax.post(`/mentornet/meetings/${meetingId}/feedback`, feedbackData);
  return res.data;
};

// ---- FEEDBACK MANAGEMENT ----
export const getMyGivenFeedbacks = async () => {
  const res = await ax.get("/mentornet/feedbacks/my-given");
  return res.data;
};

export const getReceivedFeedbacks = async () => {
  const res = await ax.get("/mentornet/feedbacks/received");
  return res.data;
};

export const updateFeedback = async (feedbackId, feedbackData) => {
  const res = await ax.put(`/mentornet/feedbacks/${feedbackId}`, feedbackData);
  return res.data;
};

// ---- MEETING STATUS ----
export const updateMeetingStatus = async (meetingId, statusData) => {
  const res = await ax.patch(`/mentornet/meetings/${meetingId}/status`, statusData);
  return res.data;
};

export const toggleAttendance = async (meetingId, attendanceData) => {
  const res = await ax.patch(`/mentornet/meetings/${meetingId}/attendance/toggle`, attendanceData);
  return res.data;
};

// ---- MESSAGES ----
export const getConversations = async () => {
  const res = await ax.get("/mentornet/messages/conversations");
  return res.data;
};

export const getMessages = async (conversationId, params) => {
  const res = await ax.get(`/mentornet/messages/${conversationId}`, { params });
  return res.data;
};

export const sendMessage = async (conversationId, messageData) => {
  const res = await ax.post(`/mentornet/messages/${conversationId}`, messageData);
  return res.data;
};

export const createConversation = async (conversationData) => {
  const res = await ax.post("/mentornet/messages/conversations", conversationData);
  return res.data;
};

// ---- EMAIL PREFERENCES ----
export const getEmailPreferences = async () => {
  const res = await ax.get("/mentornet/mentors/email-preferences");
  return res.data;
};

export const updateEmailPreferences = async (preferences) => {
  const res = await ax.patch("/mentornet/mentors/email-preferences", preferences);
  return res.data;
};

// ---- PARTICIPANTS & TEAMS ----
export const getParticipants = async () => {
  const res = await ax.get("/mentornet/participants");
  return res.data;
};

// ---- MENTOR PLAN MEETING ----
export const planMeeting = async (data) => {
  const res = await ax.post("/mentornet/meetings/plan", data);
  return res.data;
};

export const getMyAssignedUsers = async () => {
  const res = await ax.get("/mentornet/mentors/my-assigned-users");
  return res.data;
};

