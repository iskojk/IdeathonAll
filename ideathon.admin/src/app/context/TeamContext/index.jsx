"use client";

import React, { createContext, useContext, useState } from "react";
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_APP || "http://localhost:5002/api";

const TeamContext = createContext(undefined);

export const TeamProvider = ({ children }) => {
    const [teams, setTeams] = useState([]);
    const [individuals, setIndividuals] = useState([]);
    const [stats, setStats] = useState({
        totalApproved: 0,
        totalTeams: 0,
        totalIndividuals: 0,
        totalTeamMembers: 0
    });
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

    // Onaylı takımları ve bireyselleri getir
    const fetchTeamsAndIndividuals = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.get(
                `${API_BASE_URL}/applications/approved/teams-and-individuals`,
                {
                    headers: getAuthHeaders(),
                }
            );

            if (res.data.success) {
                setTeams(res.data.data.teams || []);
                setIndividuals(res.data.data.individuals || []);
                setStats(res.data.data.stats || {
                    totalApproved: 0,
                    totalTeams: 0,
                    totalIndividuals: 0,
                    totalTeamMembers: 0
                });
                return { success: true, data: res.data.data };
            } else {
                throw new Error(res.data.message || "Takımlar yüklenemedi");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "Takımlar yüklenemedi";
            setError(errorMessage);
            return {
                success: false,
                message: errorMessage,
            };
        } finally {
            setLoading(false);
        }
    };

    // evaluation_only ideathonlar icin: Takim koleksiyonundan dogrudan getir
    const fetchDirectTeams = async (search = "") => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            params.append("limit", "200");
            if (search) params.append("search", search);

            const res = await axios.get(
                `${API_BASE_URL}/teams?${params.toString()}`,
                { headers: getAuthHeaders() }
            );

            if (res.data.success) {
                const directTeams = (res.data.data || []).map(t => ({
                    teamName: t.teamName,
                    teamId: t._id,
                    teamDescription: t.teamDescription || "",
                    city: t.city || "",
                    leader: t.createdBy ? {
                        userId: t.createdBy._id || t.createdBy,
                        name: t.createdBy.name || "",
                        email: t.createdBy.email || "",
                        phone: t.createdBy.phone || "",
                    } : null,
                    members: (t.members || []).map(m => ({
                        _id: m._id,
                        fullName: m.name,
                        name: m.name || "",
                        firstName: (m.name || "").split(" ")[0] || "",
                        lastName: (m.name || "").split(" ").slice(1).join(" ") || "",
                        email: m.email || "",
                        tcIdentity: m.tcIdentity || "",
                        role: m.role || "Üye",
                    })),
                    memberCount: (t.members || []).length,
                    isActive: t.isActive,
                }));
                setTeams(directTeams);
                setIndividuals([]);
                setStats({
                    totalApproved: 0,
                    totalTeams: directTeams.length,
                    totalIndividuals: 0,
                    totalTeamMembers: directTeams.reduce((s, t) => s + (t.members?.length || 0), 0),
                });
                return { success: true, data: { teams: directTeams, individuals: [], stats } };
            } else {
                throw new Error(res.data.message || "Takimlar yuklenemedi");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "Takimlar yuklenemedi";
            setError(errorMessage);
            return { success: false, message: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    // Takım adını güncelle
    const updateTeamName = async (oldTeamName, newTeamName) => {
        try {
            const res = await axios.put(
                `${API_BASE_URL}/applications/approved/team-name`,
                { oldTeamName, newTeamName },
                { headers: getAuthHeaders() }
            );
            if (res.data.success) {
                return { success: true, message: res.data.message };
            }
            throw new Error(res.data.message || "Takım adı güncellenemedi");
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Takım adı güncellenemedi";
            return { success: false, message: msg };
        }
    };

    // Lider bilgilerini güncelle (sadece Application.personalInfo)
    const updateLeaderInfo = async (applicationId, leaderData) => {
        try {
            const res = await axios.put(
                `${API_BASE_URL}/applications/approved/${applicationId}/leader-info`,
                leaderData,
                { headers: getAuthHeaders() }
            );
            if (res.data.success) {
                return { success: true, data: res.data.data, message: res.data.message };
            }
            throw new Error(res.data.message || "Lider güncellenemedi");
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Lider güncellenemedi";
            return { success: false, message: msg };
        }
    };

    // Takım üyesini güncelle (Application + Team sync)
    const updateApprovedMember = async (applicationId, memberIndex, memberData) => {
        try {
            const res = await axios.put(
                `${API_BASE_URL}/applications/approved/${applicationId}/team-member/${memberIndex}`,
                memberData,
                { headers: getAuthHeaders() }
            );
            if (res.data.success) {
                return { success: true, data: res.data.data, message: res.data.message };
            }
            throw new Error(res.data.message || "Üye güncellenemedi");
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Üye güncellenemedi";
            return { success: false, message: msg };
        }
    };

    // Takıma üye ekle (Application + Team sync)
    const addApprovedMember = async (applicationId, memberData) => {
        try {
            const res = await axios.post(
                `${API_BASE_URL}/applications/approved/${applicationId}/team-member`,
                memberData,
                { headers: getAuthHeaders() }
            );
            if (res.data.success) {
                return { success: true, data: res.data.data, message: res.data.message };
            }
            throw new Error(res.data.message || "Üye eklenemedi");
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Üye eklenemedi";
            return { success: false, message: msg };
        }
    };

    // Takımdan üye sil (Application + Team sync)
    const removeApprovedMember = async (applicationId, memberIndex) => {
        try {
            const res = await axios.delete(
                `${API_BASE_URL}/applications/approved/${applicationId}/team-member/${memberIndex}`,
                { headers: getAuthHeaders() }
            );
            if (res.data.success) {
                return { success: true, message: res.data.message };
            }
            throw new Error(res.data.message || "Üye çıkarılamadı");
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Üye çıkarılamadı";
            return { success: false, message: msg };
        }
    };

    // Ad-hoc takım oluştur (başvurusuz, doğrudan Team koleksiyonuna)
    const createAdHocTeam = async (teamData) => {
        try {
            const res = await axios.post(
                `${API_BASE_URL}/teams`,
                teamData,
                { headers: getAuthHeaders() }
            );
            if (res.data.success) {
                return { success: true, data: res.data.data, message: res.data.message };
            }
            throw new Error(res.data.message || "Takım oluşturulamadı");
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Takım oluşturulamadı";
            return { success: false, message: msg };
        }
    };

    // Ad-hoc takıma üye ekle (Team koleksiyonu)
    const addAdHocMember = async (teamId, memberData) => {
        try {
            const res = await axios.post(
                `${API_BASE_URL}/teams/${teamId}/members`,
                memberData,
                { headers: getAuthHeaders() }
            );
            if (res.data.success) {
                return { success: true, data: res.data.data, message: res.data.message };
            }
            throw new Error(res.data.message || "Üye eklenemedi");
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Üye eklenemedi";
            return { success: false, message: msg };
        }
    };

    // Ad-hoc takım üyesini güncelle (Team koleksiyonu)
    const updateAdHocMember = async (teamId, memberId, memberData) => {
        try {
            const res = await axios.put(
                `${API_BASE_URL}/teams/${teamId}/members/${memberId}`,
                memberData,
                { headers: getAuthHeaders() }
            );
            if (res.data.success) {
                return { success: true, data: res.data.data, message: res.data.message };
            }
            throw new Error(res.data.message || "Üye güncellenemedi");
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Üye güncellenemedi";
            return { success: false, message: msg };
        }
    };

    // Ad-hoc takımdan üye sil (Team koleksiyonu)
    const removeAdHocMember = async (teamId, memberId) => {
        try {
            const res = await axios.delete(
                `${API_BASE_URL}/teams/${teamId}/members/${memberId}`,
                { headers: getAuthHeaders() }
            );
            if (res.data.success) {
                return { success: true, message: res.data.message };
            }
            throw new Error(res.data.message || "Üye çıkarılamadı");
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Üye çıkarılamadı";
            return { success: false, message: msg };
        }
    };

    // Ad-hoc takımı sil (soft delete)
    const deleteAdHocTeam = async (teamId) => {
        try {
            const res = await axios.delete(
                `${API_BASE_URL}/teams/${teamId}`,
                { headers: getAuthHeaders() }
            );
            if (res.data.success) {
                return { success: true, message: res.data.message };
            }
            throw new Error(res.data.message || "Takım silinemedi");
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Takım silinemedi";
            return { success: false, message: msg };
        }
    };

    // Ad-hoc takım bilgilerini güncelle (takım adı vs.)
    const updateAdHocTeam = async (teamId, teamData) => {
        try {
            const res = await axios.put(
                `${API_BASE_URL}/teams/${teamId}`,
                teamData,
                { headers: getAuthHeaders() }
            );
            if (res.data.success) {
                return { success: true, data: res.data.data, message: res.data.message };
            }
            throw new Error(res.data.message || "Takım güncellenemedi");
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Takım güncellenemedi";
            return { success: false, message: msg };
        }
    };

    // Bireysel başvuruyu takıma ekle
    const addIndividualToTeam = async (individualApplicationId, targetTeamName) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.post(
                `${API_BASE_URL}/applications/approved/add-to-team`,
                {
                    individualApplicationId,
                    targetTeamName
                },
                {
                    headers: getAuthHeaders(),
                }
            );

            if (res.data.success) {
                // Listeyi yeniden yükle
                await fetchTeamsAndIndividuals();
                return { success: true, message: res.data.message, data: res.data.data };
            } else {
                throw new Error(res.data.message || "Takıma eklenemedi");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "Takıma eklenemedi";
            setError(errorMessage);
            return {
                success: false,
                message: errorMessage,
            };
        } finally {
            setLoading(false);
        }
    };

    // Takımdan üye çıkar
    const removeFromTeam = async (applicationId) => {
        setLoading(true);
        setError(null);
        try {
            const res = await axios.delete(
                `${API_BASE_URL}/applications/approved/${applicationId}/remove-from-team`,
                {
                    headers: getAuthHeaders(),
                }
            );

            if (res.data.success) {
                // Listeyi yeniden yükle
                await fetchTeamsAndIndividuals();
                return { success: true, message: res.data.message };
            } else {
                throw new Error(res.data.message || "Üye çıkarılamadı");
            }
        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message || "Üye çıkarılamadı";
            setError(errorMessage);
            return {
                success: false,
                message: errorMessage,
            };
        } finally {
            setLoading(false);
        }
    };

    return (
        <TeamContext.Provider
            value={{
                teams,
                individuals,
                stats,
                loading,
                error,
                fetchTeamsAndIndividuals,
                fetchDirectTeams,
                addIndividualToTeam,
                removeFromTeam,
                updateTeamName,
                updateLeaderInfo,
                addApprovedMember,
                updateApprovedMember,
                removeApprovedMember,
                createAdHocTeam,
                addAdHocMember,
                updateAdHocMember,
                removeAdHocMember,
                updateAdHocTeam,
                deleteAdHocTeam,
            }}
        >
            {children}
        </TeamContext.Provider>
    );
};

export { TeamContext };
export const useTeam = () => useContext(TeamContext);





