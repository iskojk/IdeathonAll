"use client";

import React, { createContext, useContext, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_APP || "http://localhost:5002/api";

const AdminJuriContext = createContext(undefined);

export const AdminJuriProvider = ({ children }) => {
    const [accounts, setAccounts] = useState([]);
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

    // Admin/Juri hesaplarını getir
    const fetchAccounts = async (page = 1, limit = 10, filters = {}) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();

            // Pagination parametrelerini ekle
            queryParams.append('page', page);
            queryParams.append('limit', limit);

            // Filtre parametrelerini ekle
            Object.keys(filters).forEach(key => {
                if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
                    queryParams.append(key, filters[key]);
                }
            });

            const url = `${API_BASE_URL}/users/admin-juri/accounts${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

            const res = await axios.get(url, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                setAccounts(res.data.data || []);
                return {
                    success: true,
                    data: res.data.data || [],
                    pagination: res.data.pagination
                };
            } else {
                throw new Error(res.data.message || "Hesaplar yüklenemedi");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Hesaplar yüklenemedi";
            setError(errorMessage);
            toast.error(errorMessage);
            return {
                success: false,
                message: errorMessage,
            };
        } finally {
            setLoading(false);
        }
    };

    // Hesap detayı getir
    const getAccountById = async (id) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/users/admin-juri/accounts/${id}`, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                return { success: true, data: res.data.data };
            } else {
                throw new Error(res.data.message || "Hesap bulunamadı");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Hesap bulunamadı";
            toast.error(errorMessage);
            return {
                success: false,
                message: errorMessage,
            };
        } finally {
            setLoading(false);
        }
    };

    // Yeni hesap oluştur
    const createAccount = async (accountData) => {
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/users/admin-juri/accounts`, accountData, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                toast.success(res.data.message || "Hesap başarıyla oluşturuldu");
                return { success: true, message: res.data.message, data: res.data.data };
            } else {
                throw new Error(res.data.message || "Hesap oluşturulamadı");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Hesap oluşturulamadı";
            toast.error(errorMessage);
            return {
                success: false,
                message: errorMessage,
            };
        } finally {
            setLoading(false);
        }
    };

    // Hesap güncelle
    const updateAccount = async (id, updateData) => {
        setLoading(true);
        try {
            const res = await axios.put(`${API_BASE_URL}/users/admin-juri/accounts/${id}`, updateData, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                toast.success(res.data.message || "Hesap başarıyla güncellendi");
                return { success: true, message: res.data.message, data: res.data.data };
            } else {
                throw new Error(res.data.message || "Hesap güncellenemedi");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Hesap güncellenemedi";
            toast.error(errorMessage);
            return {
                success: false,
                message: errorMessage,
            };
        } finally {
            setLoading(false);
        }
    };

    // Hesap sil
    const deleteAccount = async (id) => {
        setLoading(true);
        try {
            const res = await axios.delete(`${API_BASE_URL}/users/admin-juri/accounts/${id}`, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                toast.success(res.data.message || "Hesap başarıyla silindi");
                return { success: true, message: res.data.message };
            } else {
                throw new Error(res.data.message || "Hesap silinemedi");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || "Hesap silinemedi";
            toast.error(errorMessage);
            return {
                success: false,
                message: errorMessage,
            };
        } finally {
            setLoading(false);
        }
    };

    // İstatistikleri getir
    const fetchStats = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/users/admin-juri/stats`, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                return { success: true, data: res.data.data };
            } else {
                throw new Error(res.data.message || "İstatistikler yüklenemedi");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || "İstatistikler yüklenemedi";
            return {
                success: false,
                message: errorMessage,
            };
        } finally {
            setLoading(false);
        }
    };

    const value = {
        accounts,
        loading,
        error,
        fetchAccounts,
        getAccountById,
        createAccount,
        updateAccount,
        deleteAccount,
        fetchStats,
    };

    return (
        <AdminJuriContext.Provider value={value}>
            {children}
        </AdminJuriContext.Provider>
    );
};

export { AdminJuriContext };
export default AdminJuriProvider;
