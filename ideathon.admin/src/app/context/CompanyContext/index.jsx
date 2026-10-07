"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_APP || 'http://localhost:5002/api';

const CompanyContext = createContext(undefined);

export const CompanyProvider = ({ children }) => {
    const [companies, setCompanies] = useState([]);
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

    // Firma listesi çekme
    const fetchCompanies = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/companies`, {
                headers: getAuthHeaders(),
            });
            setCompanies(res.data);
        } catch (err) {
            setError(err.response?.data?.message || "Firmalar yüklenemedi");
        } finally {
            setLoading(false);
        }
    };

    // Yeni firma oluşturma
    const createCompany = async (formData) => {
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/companies`, formData, {
                headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "multipart/form-data",
                },
            });
            await fetchCompanies();
            return { success: true, data: res.data };
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "Firma oluşturulamadı",
            };
        } finally {
            setLoading(false);
        }
    };

    // Firma güncelleme
    const updateCompany = async (id, formData) => {
        setLoading(true);
        try {
            const res = await axios.put(`${API_BASE_URL}/companies/${id}`, formData, {
                headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "multipart/form-data",
                },
            });
            await fetchCompanies();
            return { success: true, data: res.data };
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "Firma güncellenemedi",
            };
        } finally {
            setLoading(false);
        }
    };

    // Firma silme
    const deleteCompany = async (id) => {
        setLoading(true);
        try {
            await axios.delete(`${API_BASE_URL}/companies/${id}`, {
                headers: getAuthHeaders(),
            });
            await fetchCompanies();
            return { success: true, message: "Firma başarıyla silindi" };
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "Firma silinemedi",
            };
        } finally {
            setLoading(false);
        }
    };


    // Tek bir firma getir
    const getCompanyById = async (id) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/companies/${id}`, {
                headers: getAuthHeaders(),
            });
            return { success: true, data: res.data };
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "Firma bulunamadı",
            };
        } finally {
            setLoading(false);
        }
    };

    return (
        <CompanyContext.Provider
            value={{
                companies,
                loading,
                error,
                fetchCompanies,
                createCompany,
                updateCompany,
                deleteCompany,
                getCompanyById,
            }}
        >
            {children}
        </CompanyContext.Provider>
    );
};

export { CompanyContext };
