"use client";

import React, { createContext, useContext, useState } from "react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_APP || "http://localhost:5002/api";

const ParticipantContext = createContext(undefined);

export const ParticipantProvider = ({ children }) => {
    const [participants, setParticipants] = useState([]);
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

    // Tüm katılımcıları getir (superadmin için)
    const fetchParticipants = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/applications/participants/list`, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                setParticipants(res.data.data || []);
                return { success: true, data: res.data.data || [] };
            } else {
                throw new Error(res.data.message || "Katılımcılar yüklenemedi");
            }
        } catch (err) {
            setError(err.response?.data?.message || "Katılımcılar yüklenemedi");
            return {
                success: false,
                message: err.response?.data?.message || "Katılımcılar yüklenemedi",
            };
        } finally {
            setLoading(false);
        }
    };

    // Katılımcı istatistiklerini getir
    const fetchParticipantStats = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE_URL}/applications/participants/stats`, {
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

    // Katılımcıyı onay/reddet
    const updateParticipantStatus = async (participantId, action, reason = null) => {
        setLoading(true);
        try {
            const endpoint = action === 'approve'
                ? `${API_BASE_URL}/applications/${participantId}/approve-participant`
                : `${API_BASE_URL}/applications/${participantId}/reject-participant`;

            const data = reason ? { reason } : {};

            const res = await axios.patch(endpoint, data, {
                headers: getAuthHeaders(),
            });

            if (res.data.success) {
                // Listeyi yeniden yükle
                await fetchParticipants();
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

    return (
        <ParticipantContext.Provider
            value={{
                participants,
                loading,
                error,
                fetchParticipants,
                fetchParticipantStats,
                updateParticipantStatus,
            }}
        >
            {children}
        </ParticipantContext.Provider>
    );
};

export { ParticipantContext };
export const useParticipant = () => useContext(ParticipantContext);



