"use client";

import React, { createContext, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_APP || "http://localhost:5002";

const MentorNetContext = createContext(undefined);

export const MentorNetProvider = ({ children }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const selectedIdeathonId = localStorage.getItem("selectedIdeathonId");
        if (selectedIdeathonId && selectedIdeathonId !== "null" && selectedIdeathonId !== "all") {
            headers["X-Ideathon-Id"] = selectedIdeathonId;
        }
        return headers;
    };

    // ========== USER OPERATIONS ==========

    // Yeni mentor user oluştur
    const createMentorUser = async (userData) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(
                `${API_BASE_URL}/users`,
                {
                    ...userData,
                    role: 'mentor'
                },
                { headers: getAuthHeaders() }
            );

            if (res.data.success) {
                return { 
                    success: true, 
                    message: "Mentor kullanıcısı başarıyla oluşturuldu",
                    data: res.data.data 
                };
            } else {
                throw new Error(res.data.message || "Kullanıcı oluşturulamadı");
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Kullanıcı oluşturulamadı";
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    // Tüm mentor userları getir
    const fetchMentorUsers = async (filters = {}) => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams({
                role: 'mentor',
                ...filters
            });

            const res = await axios.get(
                `${API_BASE_URL}/users?${queryParams.toString()}`,
                { headers: getAuthHeaders() }
            );

            if (res.data.success) {
                return { 
                    success: true, 
                    data: res.data.data 
                };
            } else {
                throw new Error(res.data.message || "Kullanıcılar getirilemedi");
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Kullanıcılar getirilemedi";
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    // Tekil user getir
    const getUserById = async (userId) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(
                `${API_BASE_URL}/users/${userId}`,
                { headers: getAuthHeaders() }
            );

            if (res.data.success) {
                return { 
                    success: true, 
                    data: res.data.data 
                };
            } else {
                throw new Error(res.data.message || "Kullanıcı bulunamadı");
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Kullanıcı bulunamadı";
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    // ========== MENTOR PROFILE OPERATIONS ==========

    // MentorProfile oluştur (ideathonId zorunlu, otomatik user assign)
    const createMentorProfile = async (profileData) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(
                `${API_BASE_URL}/mentornet/mentors`,
                profileData,
                { headers: getAuthHeaders() }
            );

            if (res.data.success) {
                return { 
                    success: true, 
                    message: res.data.message || "Mentor profili başarıyla oluşturuldu",
                    data: res.data.data 
                };
            } else {
                throw new Error(res.data.message || "Mentor profili oluşturulamadı");
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Mentor profili oluşturulamadı";
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    // Mentor profil fotoğrafı yükle
    const uploadMentorPhoto = async (userId, photoFile) => {
        setLoading(true);
        setError(null);
        try {
            const formData = new FormData();
            formData.append('photo', photoFile);

            const res = await axios.post(
                `${API_BASE_URL}/mentornet/mentors/${userId}/photo`,
                formData,
                { 
                    headers: {
                        ...getAuthHeaders(),
                        'Content-Type': 'multipart/form-data'
                    } 
                }
            );

            if (res.data.success) {
                return { 
                    success: true, 
                    message: "Profil fotoğrafı başarıyla yüklendi",
                    data: res.data.data 
                };
            } else {
                throw new Error(res.data.message || "Fotoğraf yüklenemedi");
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Fotoğraf yüklenemedi";
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    // Tüm mentor profilleri getir
    const fetchMentorProfiles = async (filters = {}) => {
        setLoading(true);
        setError(null);
        try {
            const queryParams = new URLSearchParams(filters);

            const res = await axios.get(
                `${API_BASE_URL}/mentornet/mentors?${queryParams.toString()}`,
                { headers: getAuthHeaders() }
            );

            if (res.data.success) {
                return { 
                    success: true, 
                    data: res.data.data 
                };
            } else {
                throw new Error(res.data.message || "Mentor profilleri getirilemedi");
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Mentor profilleri getirilemedi";
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    // Tekil mentor profili getir
    const getMentorProfileByUserId = async (userId) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(
                `${API_BASE_URL}/mentornet/mentors/${userId}`,
                { headers: getAuthHeaders() }
            );

            if (res.data.success) {
                return { 
                    success: true, 
                    data: res.data.data 
                };
            } else {
                throw new Error(res.data.message || "Mentor profili bulunamadı");
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Mentor profili bulunamadı";
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    // Mentor profilini + User bilgilerini güncelle
    // profileData: { title, about, linkedin, expertiseTags, isActive, ideathonId, userInfo: { name, email, phone } }
    const updateMentorProfile = async (userId, profileData) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.patch(
                `${API_BASE_URL}/mentornet/mentors/${userId}`,
                profileData,
                { headers: getAuthHeaders() }
            );

            if (res.data.success) {
                return { 
                    success: true, 
                    message: res.data.message || "Mentor profili başarıyla güncellendi",
                    data: res.data.data 
                };
            } else {
                throw new Error(res.data.message || "Mentor profili güncellenemedi");
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Mentor profili güncellenemedi";
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    // Mentor istatistiklerini getir
    const getMentorStats = async (userId) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(
                `${API_BASE_URL}/mentornet/mentors/${userId}/stats`,
                { headers: getAuthHeaders() }
            );

            if (res.data.success) {
                return { 
                    success: true, 
                    data: res.data.data 
                };
            } else {
                throw new Error(res.data.message || "İstatistikler getirilemedi");
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || "İstatistikler getirilemedi";
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    // Mentor profilini sil (soft delete veya hard delete)
    const deleteMentorProfile = async (userId, hardDelete = false) => {
        setLoading(true);
        setError(null);
        try {
            const queryParam = hardDelete ? '?hardDelete=true' : '';
            const res = await axios.delete(
                `${API_BASE_URL}/mentornet/mentors/${userId}${queryParam}`,
                { headers: getAuthHeaders() }
            );

            if (res.data.success) {
                return { 
                    success: true, 
                    message: hardDelete 
                        ? "Mentor profili kalıcı olarak silindi" 
                        : "Mentor profili deaktif edildi",
                    data: res.data.data 
                };
            } else {
                throw new Error(res.data.message || "Mentor profili silinemedi");
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Mentor profili silinemedi";
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    // ========== KULLANICI ATAMA OPERATIONS ==========

    // Mentora atanmış kullanıcıları getir (checkbox listesi için)
    const fetchAssignedUsers = async (mentorUserId) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(
                `${API_BASE_URL}/mentornet/mentors/${mentorUserId}/assigned-users`,
                { headers: getAuthHeaders() }
            );

            if (res.data.success) {
                return {
                    success: true,
                    data: res.data.data
                };
            } else {
                throw new Error(res.data.message || "Atanmış kullanıcılar getirilemedi");
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Atanmış kullanıcılar getirilemedi";
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    // Kullanıcı ata/çıkar (toplu güncelleme)
    const updateAssignedUsers = async (mentorUserId, assignedUserIds) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.put(
                `${API_BASE_URL}/mentornet/mentors/${mentorUserId}/assign-users`,
                { assignedUserIds },
                { headers: getAuthHeaders() }
            );

            if (res.data.success) {
                return {
                    success: true,
                    message: res.data.message || "Kullanıcı atamaları güncellendi",
                    data: res.data.data
                };
            } else {
                throw new Error(res.data.message || "Kullanıcı atamaları güncellenemedi");
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Kullanıcı atamaları güncellenemedi";
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    // ========== KATILIMCI OPERATIONS ==========

    // Katılımcıları getir (mentor: atanmış, admin: tümü)
    const fetchParticipants = async (ideathonId = null) => {
        setLoading(true);
        setError(null);
        try {
            const headers = getAuthHeaders();
            if (ideathonId) {
                headers["X-Ideathon-Id"] = ideathonId;
            }

            const res = await axios.get(
                `${API_BASE_URL}/mentornet/participants`,
                { headers }
            );

            if (res.data.success) {
                return {
                    success: true,
                    count: res.data.count,
                    data: res.data.data
                };
            } else {
                throw new Error(res.data.message || "Katılımcılar getirilemedi");
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || "Katılımcılar getirilemedi";
            setError(errorMsg);
            return { success: false, message: errorMsg };
        } finally {
            setLoading(false);
        }
    };

    return (
        <MentorNetContext.Provider
            value={{
                loading,
                error,
                // User operations
                createMentorUser,
                fetchMentorUsers,
                getUserById,
                // MentorProfile operations
                createMentorProfile,
                uploadMentorPhoto,
                fetchMentorProfiles,
                getMentorProfileByUserId,
                updateMentorProfile,
                deleteMentorProfile,
                getMentorStats,
                // Kullanıcı Atama
                fetchAssignedUsers,
                updateAssignedUsers,
                // Katılımcılar
                fetchParticipants,
            }}
        >
            {children}
        </MentorNetContext.Provider>
    );
};

export { MentorNetContext };
