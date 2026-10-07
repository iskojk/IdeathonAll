"use client";

import React, { createContext, useContext, useState } from "react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_APP || "http://localhost:5002/api";

const ApplicationContext = createContext(undefined);

export const ApplicationProvider = ({ children }) => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");
        return token ? { Authorization: `Bearer ${token}` } : {};
    };

    // Tüm başvuruları getir (superadmin için)
    const fetchApplications = async (page = 1, limit = 10, filters = {}) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();

            // Page ve limit parametrelerini ekle
            queryParams.append('page', page.toString());
            queryParams.append('limit', limit.toString());

            // Filtre parametrelerini ekle
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
                    queryParams.append(key, filters[key]);
                }
            });

            const url = `${API_BASE_URL}/applications${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

            const res = await axios.get(url, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                setApplications(res.data.data || []);
                return { success: true, data: res.data.data || [], pagination: res.data.pagination };
            } else {
                throw new Error(res.data.message || "Başvurular yüklenemedi");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Başvurular yüklenemedi");
            return {
                success: false,
                message: err.response?.data?.message || "Başvurular yüklenemedi",
            };
        } finally {
            setLoading(false);
        }
    };

    // Tek başvuru getir
    const getApplicationById = async (id) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/applications/${id}`, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                return { success: true, data: res.data.data };
            } else {
                throw new Error(res.data.message || "Başvuru bulunamadı");
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "Başvuru bulunamadı",
            };
        } finally {
            setLoading(false);
        }
    };

    // Başvuru güncelle
    const updateApplication = async (id, data) => {
        setLoading(true);
        try {
            const res = await axios.put(`${API_BASE_URL}/applications/${id}`, data, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                return { success: true, message: res.data.message };
            } else {
                throw new Error(res.data.message || "Başvuru güncellenemedi");
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "Başvuru güncellenemedi",
            };
        } finally {
            setLoading(false);
        }
    };

    // Başvuru sil
    const deleteApplication = async (id) => {
        setLoading(true);
        try {
            const res = await axios.delete(`${API_BASE_URL}/applications/${id}`, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                // Listeyi yeniden yükle
                await fetchApplications();
                return { success: true, message: res.data.message || "Başvuru silindi" };
            } else {
                throw new Error(res.data.message || "Başvuru silinemedi");
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "Başvuru silinemedi",
            };
        } finally {
            setLoading(false);
        }
    };

    // Başvuru durumunu değiştir
    const updateApplicationStatus = async (id, status, reason = null) => {
        setLoading(true);
        try {
            const data = { status };
            if (reason) data.reason = reason;

            const res = await axios.patch(`${API_BASE_URL}/applications/${id}/status`, data, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                return { success: true, message: res.data.message };
            } else {
                throw new Error(res.data.message || "Durum güncellenemedi");
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "Durum güncellenemedi",
            };
        } finally {
            setLoading(false);
        }
    };

    // Juri değerlendirmesi ekle/güncelle
    const addJuriEvaluation = async (applicationId, evaluationData) => {
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/applications/${applicationId}/juri-evaluation`, evaluationData, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                return { success: true, message: res.data.message };
            } else {
                throw new Error(res.data.message || "Değerlendirme eklenemedi");
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "Değerlendirme eklenemedi",
            };
        } finally {
            setLoading(false);
        }
    };

    // Katılımcı onayla
    const approveParticipant = async (applicationId) => {
        setLoading(true);
        try {
            const res = await axios.patch(`${API_BASE_URL}/applications/${applicationId}/approve-participant`, {}, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                return { success: true, message: res.data.message };
            } else {
                throw new Error(res.data.message || "Katılımcı onaylanamadı");
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "Katılımcı onaylanamadı",
            };
        } finally {
            setLoading(false);
        }
    };

    // Katılımcıyı reddet
    const rejectParticipant = async (applicationId) => {
        setLoading(true);
        try {
            const res = await axios.patch(`${API_BASE_URL}/applications/${applicationId}/reject-participant`, {}, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                return { success: true, message: res.data.message };
            } else {
                throw new Error(res.data.message || "Katılımcı reddedilemedi");
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "Katılımcı reddedilemedi",
            };
        } finally {
            setLoading(false);
        }
    };

    // İstatistikleri getir
    const fetchStats = async (type = 'overview') => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/applications/stats/${type}`, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                return { success: true, data: res.data.data };
            } else {
                throw new Error(res.data.message || "İstatistikler yüklenemedi");
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "İstatistikler yüklenemedi",
            };
        } finally {
            setLoading(false);
        }
    };

    // Dashboard istatistikleri
    const fetchDashboardStats = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/applications/dashboard/stats`, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                return { success: true, data: res.data.data };
            } else {
                throw new Error(res.data.message || "Dashboard istatistikleri yüklenemedi");
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "Dashboard istatistikleri yüklenemedi",
            };
        } finally {
            setLoading(false);
        }
    };

    // Katılımcı istatistikleri
    const fetchParticipantStats = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/applications/participants/stats`, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                return { success: true, data: res.data.data };
            } else {
                throw new Error(res.data.message || "Katılımcı istatistikleri yüklenemedi");
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "Katılımcı istatistikleri yüklenemedi",
            };
        } finally {
            setLoading(false);
        }
    };

    // Manuel takım oluştur
    const createTeam = async (teamData) => {
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/applications/teams`, teamData, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                return { success: true, message: res.data.message, data: res.data.data };
            } else {
                throw new Error(res.data.message || "Takım oluşturulamadı");
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "Takım oluşturulamadı",
            };
        } finally {
            setLoading(false);
        }
    };

    // Rastgele takım oluştur
    const createRandomTeams = async (teamSize) => {
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/applications/teams/random`, { teamSize }, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                return { success: true, message: res.data.message, data: res.data.data };
            } else {
                throw new Error(res.data.message || "Rastgele takımlar oluşturulamadı");
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "Rastgele takımlar oluşturulamadı",
            };
        } finally {
            setLoading(false);
        }
    };

    // Takımları getir
    const fetchTeams = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/applications/teams`, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                return { success: true, data: res.data.data };
            } else {
                throw new Error(res.data.message || "Takımlar yüklenemedi");
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "Takımlar yüklenemedi",
            };
        } finally {
            setLoading(false);
        }
    };

    return (
        <ApplicationContext.Provider
            value={{
                applications,
                loading,
                error,
                fetchApplications,
                getApplicationById,
                updateApplication,
                deleteApplication,
                updateApplicationStatus,
                addJuriEvaluation,
                approveParticipant,
                rejectParticipant,
                fetchStats,
                fetchDashboardStats,
                fetchParticipantStats,
                createTeam,
                createRandomTeams,
                fetchTeams,
            }}
        >
            {children}
        </ApplicationContext.Provider>
    );
};

export { ApplicationContext };
