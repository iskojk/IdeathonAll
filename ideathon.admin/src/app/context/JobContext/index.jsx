"use client";

import React, { createContext, useContext, useState } from "react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_APP || "http://localhost:5002/api";

const JobContext = createContext(undefined);

export const JobProvider = ({ children }) => {
    const [jobs, setJobs] = useState([]);
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

    // İş ilanlarını çek
    const fetchJobs = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/jobs`, {
                headers: getAuthHeaders(),
            });
            return { success: true, data: res.data.data }; 
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "İş ilanları yüklenemedi",
            };
        } finally {
            setLoading(false);
        }
    };

    // Yeni iş ilanı oluştur
    const createJob = async (formData) => {
        setLoading(true);
        try {
            const res = await axios.post(`${API_BASE_URL}/jobs`, formData, {
                headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "multipart/form-data",
                },
            });
            await fetchJobs();
            return { success: true, data: res.data };
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "İş ilanı oluşturulamadı",
            };
        } finally {
            setLoading(false);
        }
    };

    // İş ilanı güncelle
    const updateJob = async (id, formData) => {
        setLoading(true);
        try {
            const res = await axios.put(`${API_BASE_URL}/jobs/${id}`, formData, {
                headers: {
                    ...getAuthHeaders(),
                    "Content-Type": "multipart/form-data",
                },
            });
            await fetchJobs();
            return { success: true, data: res.data };
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "İş ilanı güncellenemedi",
            };
        } finally {
            setLoading(false);
        }
    };

    // İş ilanı sil
    const deleteJob = async (id) => {
        setLoading(true);
        try {
            await axios.delete(`${API_BASE_URL}/jobs/${id}`, {
                headers: getAuthHeaders(),
            });
            await fetchJobs();
            return { success: true, message: "İş ilanı başarıyla silindi" };
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "İş ilanı silinemedi",
            };
        } finally {
            setLoading(false);
        }
    };

    // Tek bir iş ilanı getir
    const getJobById = async (id) => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/jobs/${id}`, {
                headers: getAuthHeaders(),
            });
            return { success: true, data: res.data.data };
        } catch (err) {
            return {
                success: false,
                message: err.response?.data?.message || "İş ilanı bulunamadı",
            };
        } finally {
            setLoading(false);
        }
    };

    return (
        <JobContext.Provider
            value={{
                jobs,
                loading,
                error,
                fetchJobs,
                createJob,
                updateJob,
                deleteJob,
                getJobById,
            }}
        >
            {children}
        </JobContext.Provider>
    );
};

export { JobContext };
