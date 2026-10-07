"use client";

import React, { createContext, useContext, useState } from "react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_APP || "http://localhost:5002";

const ContactContext = createContext(undefined);

export const ContactProvider = ({ children }) => {
    const [contacts, setContacts] = useState([]);
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

    // Tüm iletişim mesajlarını getir (sayfalama ve filtreleme ile)
    const fetchContacts = async (page = 1, limit = 10, status = '') => {
        // Token kontrolü
        if (!isAuthenticated()) {
            setError("Önce giriş yapmanız gerekiyor");
            return {
                success: false,
                message: "Önce giriş yapmanız gerekiyor",
            };
        }

        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString()
            });

            if (status) {
                queryParams.append('status', status);
            }

            const url = `${API_BASE_URL}/contact?${queryParams.toString()}`;

            const res = await axios.get(url, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                setContacts(res.data.data.contacts || []);
                setPagination(res.data.data.pagination || {});
                return {
                    success: true,
                    data: res.data.data.contacts || [],
                    pagination: res.data.data.pagination
                };
            } else {
                throw new Error(res.data.message || "İletişim mesajları yüklenemedi");
            }
        } catch (err) {
            setError(err.response?.data?.message || "İletişim mesajları yüklenemedi");
            return {
                success: false,
                message: err.response?.data?.message || "İletişim mesajları yüklenemedi",
            };
        } finally {
            setLoading(false);
        }
    };

    // Tek iletişim mesajı getir
    const getContactById = async (id) => {
        // Token kontrolü
        if (!isAuthenticated()) {
            return {
                success: false,
                message: "Önce giriş yapmanız gerekiyor",
            };
        }

        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/contact/${id}`, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                return { success: true, data: res.data.data };
            } else {
                throw new Error(res.data.message || "İletişim mesajı bulunamadı");
            }
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "İletişim mesajı bulunamadı",
            };
        } finally {
            setLoading(false);
        }
    };

    // İletişim mesajı durumunu güncelle
    const updateContactStatus = async (id, status) => {
        // Token kontrolü
        if (!isAuthenticated()) {
            return {
                success: false,
                message: "Önce giriş yapmanız gerekiyor",
            };
        }

        setLoading(true);
        try {
            const res = await axios.patch(`${API_BASE_URL}/contact/${id}/status`,
                { status },
                {
                    headers: getAuthHeaders(),
                }
            );

            if (res.data.success) {
                // Listeyi güncelle
                setContacts(prevContacts =>
                    prevContacts.map(contact =>
                        contact._id === id
                            ? { ...contact, status: status, updatedAt: new Date().toISOString() }
                            : contact
                    )
                );
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

    // İletişim istatistiklerini getir
    const fetchStats = async () => {
        // Token kontrolü
        if (!isAuthenticated()) {
            return {
                success: false,
                message: "Önce giriş yapmanız gerekiyor",
            };
        }

        try {
            const res = await axios.get(`${API_BASE_URL}/contact/stats`, {
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
        <ContactContext.Provider
            value={{
                contacts,
                stats,
                loading,
                error,
                pagination,
                fetchContacts,
                getContactById,
                updateContactStatus,
                fetchStats,
            }}
        >
            {children}
        </ContactContext.Provider>
    );
};

export { ContactContext };
