"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "@/utils/api/axios";

const IdeathonContext = createContext(undefined);

export const IdeathonProvider = ({ children }) => {
  const [ideathons, setIdeathons] = useState([]); // dropdown listesi
  const [selectedIdeathonId, setSelectedIdeathonId] = useState(null); // null = tümü
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Sayfa yüklendiğinde localStorage'dan seçili ideathon'u yükle
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("selectedIdeathonId");
      if (stored && stored !== "null" && stored !== "all") {
        setSelectedIdeathonId(stored);
      }
    }
  }, []);

  // ========== DROPDOWN ==========

  // Dropdown için ideathon listesini getir
  const fetchDropdownIdeathons = useCallback(async () => {
    try {
      const res = await api.get("/ideathons/dropdown");
      if (res.data.success) {
        setIdeathons(res.data.data || []);
        return { success: true, data: res.data.data || [] };
      }
      throw new Error(res.data.message || "İdeathon listesi alınamadı");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "İdeathon listesi alınamadı";
      setError(msg);
      return { success: false, message: msg };
    }
  }, []);

  // ========== İDEATHON SEÇİMİ ==========

  // İdeathon seçimi — yeni token alır
  const selectIdeathon = useCallback(async (ideathonId) => {
    setLoading(true);
    try {
      const res = await api.post("/auth/select-ideathon", {
        ideathonId: ideathonId || "all",
      });

      if (res.data.success) {
        const newToken = res.data.data?.token;
        if (newToken) {
          localStorage.setItem("token", newToken);
        }

        const newId = ideathonId && ideathonId !== "all" ? ideathonId : null;
        setSelectedIdeathonId(newId);
        localStorage.setItem("selectedIdeathonId", newId || "all");

        return { success: true, token: newToken };
      }
      throw new Error(res.data.message || "İdeathon seçilemedi");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "İdeathon seçilemedi";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // ========== İDEATHON CRUD ==========

  // Sayfalı ideathon listesi
  const fetchIdeathons = useCallback(async (page = 1, limit = 20, filters = {}) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      Object.keys(filters).forEach((key) => {
        if (filters[key] !== undefined && filters[key] !== null && filters[key] !== "") {
          params.append(key, filters[key]);
        }
      });

      const res = await api.get(`/ideathons?${params.toString()}`);
      if (res.data.success) {
        return {
          success: true,
          data: res.data.data || [],
          pagination: res.data.pagination || {},
        };
      }
      throw new Error(res.data.message || "İdeathon listesi alınamadı");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "İdeathon listesi alınamadı";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Tekil ideathon detayı
  const getIdeathonById = useCallback(async (id) => {
    setLoading(true);
    try {
      const res = await api.get(`/ideathons/${id}`);
      if (res.data.success) {
        return { success: true, data: res.data.data };
      }
      throw new Error(res.data.message || "İdeathon bulunamadı");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "İdeathon bulunamadı";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Yeni ideathon oluştur
  const createIdeathon = useCallback(async (data) => {
    setLoading(true);
    try {
      const res = await api.post("/ideathons", data);
      if (res.data.success) {
        // Dropdown listesini güncelle
        fetchDropdownIdeathons();
        return { success: true, data: res.data.data, message: res.data.message };
      }
      throw new Error(res.data.message || "İdeathon oluşturulamadı");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "İdeathon oluşturulamadı";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [fetchDropdownIdeathons]);

  // İdeathon güncelle
  const updateIdeathon = useCallback(async (id, data) => {
    setLoading(true);
    try {
      const res = await api.put(`/ideathons/${id}`, data);
      if (res.data.success) {
        fetchDropdownIdeathons();
        return { success: true, data: res.data.data, message: res.data.message };
      }
      throw new Error(res.data.message || "İdeathon güncellenemedi");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "İdeathon güncellenemedi";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [fetchDropdownIdeathons]);

  // İdeathon sil
  const deleteIdeathon = useCallback(async (id) => {
    setLoading(true);
    try {
      const res = await api.delete(`/ideathons/${id}`);
      if (res.data.success) {
        // Silinen ideathon seçili ise sıfırla
        if (selectedIdeathonId === id) {
          setSelectedIdeathonId(null);
          localStorage.setItem("selectedIdeathonId", "all");
        }
        fetchDropdownIdeathons();
        return { success: true, message: res.data.message };
      }
      throw new Error(res.data.message || "İdeathon silinemedi");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "İdeathon silinemedi";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, [selectedIdeathonId, fetchDropdownIdeathons]);

  // ========== KULLANICI ATAMA ==========

  // Kullanıcıyı ideathon'a ata
  const assignUser = useCallback(async (ideathonId, userId, role) => {
    setLoading(true);
    try {
      const res = await api.post(`/ideathons/${ideathonId}/assign`, { userId, role });
      if (res.data.success) {
        return { success: true, data: res.data.data, message: res.data.message };
      }
      throw new Error(res.data.message || "Kullanıcı atanamadı");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Kullanıcı atanamadı";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Kullanıcı atamasını kaldır
  const unassignUser = useCallback(async (ideathonId, userId, role) => {
    setLoading(true);
    try {
      const res = await api.post(`/ideathons/${ideathonId}/unassign`, { userId, role });
      if (res.data.success) {
        return { success: true, message: res.data.message };
      }
      throw new Error(res.data.message || "Atama kaldırılamadı");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Atama kaldırılamadı";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // İdeathon'a atanmış kullanıcıları getir
  const fetchIdeathonUsers = useCallback(async (ideathonId, role = null) => {
    setLoading(true);
    try {
      const params = role ? `?role=${role}` : "";
      const res = await api.get(`/ideathons/${ideathonId}/users${params}`);
      if (res.data.success) {
        return { success: true, data: res.data.data || [] };
      }
      throw new Error(res.data.message || "Kullanıcılar getirilemedi");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Kullanıcılar getirilemedi";
      setError(msg);
      return { success: false, message: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // ========== HELPER ==========

  // Seçili ideathon objesini döndür
  const getSelectedIdeathon = useCallback(() => {
    if (!selectedIdeathonId) return null;
    return ideathons.find((i) => i._id === selectedIdeathonId) || null;
  }, [selectedIdeathonId, ideathons]);

  const value = {
    // State
    ideathons,
    selectedIdeathonId,
    loading,
    error,

    // Dropdown & Selection
    fetchDropdownIdeathons,
    selectIdeathon,
    setSelectedIdeathonId,
    getSelectedIdeathon,

    // CRUD
    fetchIdeathons,
    getIdeathonById,
    createIdeathon,
    updateIdeathon,
    deleteIdeathon,

    // User Assignment
    assignUser,
    unassignUser,
    fetchIdeathonUsers,
  };

  return (
    <IdeathonContext.Provider value={value}>
      {children}
    </IdeathonContext.Provider>
  );
};

export const useIdeathon = () => {
  const context = useContext(IdeathonContext);
  if (context === undefined) {
    throw new Error("useIdeathon must be used within IdeathonProvider");
  }
  return context;
};

export { IdeathonContext };
export default IdeathonProvider;










