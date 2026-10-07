"use client";

import React, { createContext, useContext, useState } from "react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_APP || "http://localhost:5002";

const MentorContext = createContext(undefined);

export const MentorProvider = ({ children }) => {
    const [mentors, setMentors] = useState([]);
    const [stats, setStats] = useState({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({});

    const getAuthHeaders = () => {
        const token = localStorage.getItem("token");
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const selectedIdeathonId = localStorage.getItem("selectedIdeathonId");
        if (selectedIdeathonId && selectedIdeathonId !== "null" && selectedIdeathonId !== "all") {
            headers["X-Ideathon-Id"] = selectedIdeathonId;
        }
        return headers;
    };

    // Token kontrolü
    const isAuthenticated = () => {
        const token = localStorage.getItem("token");
        return !!token;
    };

    // Tüm mentorleri getir (sayfalama ve filtreleme ile)
    const fetchMentors = async (page = 1, limit = 10, filters = {}) => {

        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString()
            });

            // Filtre parametrelerini ekle
            if (filters.isActive !== undefined) {
                queryParams.append('isActive', filters.isActive);
            }
            if (filters.search) {
                queryParams.append('search', filters.search);
            }
            if (filters.sort) {
                queryParams.append('sort', filters.sort);
            }

            const url = `${API_BASE_URL}/mentors?${queryParams.toString()}`;

            const res = await axios.get(url, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                setMentors(res.data.data.mentors || []);
                setPagination(res.data.data.pagination || {});
                return {
                    success: true,
                    data: res.data.data.mentors || [],
                    pagination: res.data.data.pagination
                };
            } else {
                throw new Error(res.data.message || "Mentor listesi yüklenemedi");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Mentor listesi yüklenemedi");
            return {
                success: false,
                message: err.response?.data?.message || "Mentor listesi yüklenemedi",
            };
        } finally {
            setLoading(false);
        }
    };

    // Tek mentor getir
    const getMentorById = async (id) => {

        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/mentors/${id}`, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                return { success: true, data: res.data.data };
            } else {
                throw new Error(res.data.message || "Mentor bulunamadı");
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "Mentor bulunamadı",
            };
        } finally {
            setLoading(false);
        }
    };

    // Yeni mentor ekle
    const createMentor = async (formData) => {

        setLoading(true);
        try {
            // FormData ise ideathonId ekle (multipart/form-data)
            if (formData instanceof FormData) {
                if (!formData.has("ideathonId")) {
                    const selectedIdeathonId = localStorage.getItem("selectedIdeathonId");
                    if (selectedIdeathonId && selectedIdeathonId !== "null" && selectedIdeathonId !== "all") {
                        formData.append("ideathonId", selectedIdeathonId);
                    }
                }
            } else {
                // Plain object ise
                if (!formData.ideathonId) {
                    const selectedIdeathonId = localStorage.getItem("selectedIdeathonId");
                    if (selectedIdeathonId && selectedIdeathonId !== "null" && selectedIdeathonId !== "all") {
                        formData.ideathonId = selectedIdeathonId;
                    }
                }
            }

            const res = await axios.post(`${API_BASE_URL}/mentors`, formData, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                // Listeye yeni mentoru ekle
                setMentors(prevMentors => [res.data.data, ...prevMentors]);
                return { success: true, message: res.data.message, data: res.data.data };
            } else {
                throw new Error(res.data.message || "Mentor eklenemedi");
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "Mentor eklenemedi",
            };
        } finally {
            setLoading(false);
        }
    };

    // Mentor güncelle
    const updateMentor = async (id, formData) => {

        setLoading(true);
        try {
            const res = await axios.put(`${API_BASE_URL}/mentors/${id}`, formData, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                // Listeyi güncelle
                setMentors(prevMentors =>
                    prevMentors.map(mentor =>
                        mentor._id === id
                            ? res.data.data
                            : mentor
                    )
                );
                return { success: true, message: res.data.message };
            } else {
                throw new Error(res.data.message || "Mentor güncellenemedi");
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "Mentor güncellenemedi",
            };
        } finally {
            setLoading(false);
        }
    };

    // Mentor sıralaması güncelle
    const updateMentorOrder = async (id, order) => {

        try {
            const res = await axios.patch(`${API_BASE_URL}/mentors/${id}/order`,
                { order },
                {
                    headers: getAuthHeaders(),
                }
            );

            if (res.data.success) {
                // Listeyi güncelle
                setMentors(prevMentors =>
                    prevMentors.map(mentor =>
                        mentor._id === id
                            ? { ...mentor, order: order, updatedAt: new Date().toISOString() }
                            : mentor
                    )
                );
                return { success: true, message: res.data.message };
            } else {
                throw new Error(res.data.message || "Sıralama güncellenemedi");
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "Sıralama güncellenemedi",
            };
        }
    };

    // Mentor sil (soft delete)
    const deleteMentor = async (id) => {

        setLoading(true);
        try {
            const res = await axios.delete(`${API_BASE_URL}/mentors/${id}`, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                // Listeden çıkar
                setMentors(prevMentors => prevMentors.filter(mentor => mentor._id !== id));
                return { success: true, message: res.data.message || "Mentor silindi" };
            } else {
                throw new Error(res.data.message || "Mentor silinemedi");
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "Mentor silinemedi",
            };
        } finally {
            setLoading(false);
        }
    };

    // Mentor kalıcı sil (hard delete - sadece superadmin)
    const hardDeleteMentor = async (id) => {

        setLoading(true);
        try {
            const res = await axios.delete(`${API_BASE_URL}/mentors/${id}/hard`, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                // Listeden çıkar
                setMentors(prevMentors => prevMentors.filter(mentor => mentor._id !== id));
                return { success: true, message: res.data.message || "Mentor kalıcı olarak silindi" };
            } else {
                throw new Error(res.data.message || "Mentor kalıcı olarak silinemedi");
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "Mentor kalıcı olarak silinemedi",
            };
        } finally {
            setLoading(false);
        }
    };

    // Mentor istatistiklerini getir
    const fetchStats = async () => {

        try {
            const res = await axios.get(`${API_BASE_URL}/mentors/stats/overview`, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                setStats(res.data.data);
                return { success: true, data: res.data.data };
            } else {
                throw new Error(res.data.message || "İstatistikler yüklenemedi");
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "İstatistikler yüklenemedi",
            };
        }
    };

    return (
        <MentorContext.Provider
            value={{
                mentors,
                stats,
                loading,
                error,
                pagination,
                fetchMentors,
                getMentorById,
                createMentor,
                updateMentor,
                updateMentorOrder,
                deleteMentor,
                hardDeleteMentor,
                fetchStats,
            }}
        >
            {children}
        </MentorContext.Provider>
    );
};

export { MentorContext };

