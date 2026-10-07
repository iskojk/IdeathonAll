"use client";

import React, { createContext, useContext, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_APP || "http://localhost:5002/api";

const ChatUsersContext = createContext(undefined);

export const ChatUsersProvider = ({ children }) => {
  const [users, setUsers] = useState([]);
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

  // Chat kullanıcılarını getir
  const fetchUsers = async (page = 1, limit = 10, filters = {}) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('page', page.toString());
      queryParams.append('limit', limit.toString());

      Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
          queryParams.append(key, filters[key]);
        }
      });

      const url = `${API_BASE_URL}/users/chat-users${queryParams.toString() ? '?' + queryParams.toString() : ''}`;

      const response = await axios.get(url, {
        headers: getAuthHeaders(),
      });

      if (response.data.success) {
        setUsers(response.data.data || []);
        return {
          success: true,
          data: response.data.data || [],
          pagination: response.data.pagination || {}
        };
      } else {
        throw new Error(response.data.message || "Kullanıcılar yüklenemedi");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Kullanıcılar yüklenemedi";
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

  // Kullanıcı detayı getir
  const getUserById = async (id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/users/chat-users/${id}`, {
        headers: getAuthHeaders(),
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message || "Kullanıcı bulunamadı");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Kullanıcı bulunamadı";
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Yeni üye oluştur (+ opsiyonel takım ve takım üyeleri)
  const createUser = async (userData) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/users/chat-users`, userData, {
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
      });

      if (response.data.success) {
        toast.success(response.data.message || "Üye başarıyla oluşturuldu");
        return { success: true, data: response.data.data, message: response.data.message };
      } else {
        throw new Error(response.data.message || "Üye oluşturulamadı");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Üye oluşturulamadı";
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcı güncelle
  const updateUser = async (id, userData) => {
    setLoading(true);
    try {
      const response = await axios.put(`${API_BASE_URL}/users/chat-users/${id}`, userData, {
        headers: getAuthHeaders(),
      });

      if (response.data.success) {
        toast.success(response.data.message || "Kullanıcı başarıyla güncellendi");
        return { success: true, message: response.data.message, data: response.data.data };
      } else {
        throw new Error(response.data.message || "Kullanıcı güncellenemedi");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Kullanıcı güncellenemedi";
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Kullanıcı sil (soft delete)
  const deleteUser = async (id) => {
    setLoading(true);
    try {
      const response = await axios.delete(`${API_BASE_URL}/users/chat-users/${id}`, {
        headers: getAuthHeaders(),
      });

      if (response.data.success) {
        toast.success(response.data.message || "Kullanıcı başarıyla silindi");
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data.message || "Kullanıcı silinemedi");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Kullanıcı silinemedi";
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
      const response = await axios.get(`${API_BASE_URL}/users/chat-users/stats/overview`, {
        headers: getAuthHeaders(),
      });

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        throw new Error(response.data.message || "İstatistikler yüklenemedi");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || "İstatistikler yüklenemedi";
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  // Takima uye ekle
  const addTeamMember = async (teamId, memberData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/teams/${teamId}/members`, memberData, {
        headers: getAuthHeaders(),
      });
      if (response.data.success) {
        toast.success("Uye takima eklendi");
        return { success: true, data: response.data.data };
      }
      throw new Error(response.data.message || "Uye eklenemedi");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Uye eklenemedi";
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Takim uyesini guncelle
  const updateTeamMember = async (teamId, memberId, memberData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/teams/${teamId}/members/${memberId}`, memberData, {
        headers: getAuthHeaders(),
      });
      if (response.data.success) {
        toast.success("Uye bilgileri guncellendi");
        return { success: true, data: response.data.data };
      }
      throw new Error(response.data.message || "Uye guncellenemedi");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Uye guncellenemedi";
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Takim bilgilerini guncelle (ad, aciklama, sehir)
  const updateTeam = async (teamId, teamData) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/teams/${teamId}`, teamData, {
        headers: getAuthHeaders(),
      });
      if (response.data.success) {
        toast.success("Takim bilgileri guncellendi");
        return { success: true, data: response.data.data };
      }
      throw new Error(response.data.message || "Takim guncellenemedi");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Takim guncellenemedi";
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  // Takimdan uye cikar
  const removeTeamMember = async (teamId, memberId) => {
    try {
      const response = await axios.delete(`${API_BASE_URL}/teams/${teamId}/members/${memberId}`, {
        headers: getAuthHeaders(),
      });
      if (response.data.success) {
        toast.success("Uye takimdan cikarildi");
        return { success: true };
      }
      throw new Error(response.data.message || "Uye cikarilamadi");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Uye cikarilamadi";
      toast.error(msg);
      return { success: false, message: msg };
    }
  };

  const value = {
    users,
    loading,
    error,
    fetchUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    fetchStats,
    addTeamMember,
    updateTeam,
    updateTeamMember,
    removeTeamMember,
  };

  return (
    <ChatUsersContext.Provider value={value}>
      {children}
    </ChatUsersContext.Provider>
  );
};

export { ChatUsersContext };
export default ChatUsersProvider;
