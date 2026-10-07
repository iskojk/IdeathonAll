"use client";

import React, { createContext, useContext, useState } from "react";
import api from "@/utils/api/axios";

const SuperadminMentorContext = createContext(undefined);

export const SuperadminMentorProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Dashboard istatistiklerini getir
  const fetchDashboardStats = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get("/mentornet/stats/dashboard");
      
      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        throw new Error(response.data.message || "Dashboard istatistikleri alınamadı");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Dashboard istatistikleri alınamadı";
      setError(errorMsg);
      return {
        success: false,
        message: errorMsg,
      };
    } finally {
      setLoading(false);
    }
  };

  // Mentor listesini istatistiklerle birlikte getir (MentorNet)
  const fetchMentorsWithStats = async (page = 1, limit = 10, filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      
      // Pagination
      queryParams.append("page", page.toString());
      queryParams.append("limit", limit.toString());
      
      // Filters
      if (filters.searchText) {
        queryParams.append("searchText", filters.searchText);
      }
      if (filters.isActive !== undefined && filters.isActive !== "all") {
        queryParams.append("isActive", filters.isActive);
      }
      if (filters.expertiseTags) {
        queryParams.append("expertiseTags", filters.expertiseTags);
      }

      const url = `/mentornet/mentors/with-stats${queryParams.toString() ? "?" + queryParams.toString() : ""}`;
      const response = await api.get(url);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data || [],
          pagination: response.data.pagination || {},
          count: response.data.count || 0,
        };
      } else {
        throw new Error(response.data.message || "Mentor listesi alınamadı");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Mentor listesi alınamadı";
      setError(errorMsg);
      return {
        success: false,
        message: errorMsg,
      };
    } finally {
      setLoading(false);
    }
  };

  // Tekil mentor detaylı istatistikleri getir (userId ile)
  const fetchMentorStats = async (userId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get(`/mentornet/mentors/${userId}/detailed-stats`);

      if (response.data.success) {
        return {
          success: true,
          data: response.data.data,
        };
      } else {
        throw new Error(response.data.message || "Mentor istatistikleri alınamadı");
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || "Mentor istatistikleri alınamadı";
      setError(errorMsg);
      return {
        success: false,
        message: errorMsg,
      };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    loading,
    error,
    fetchDashboardStats,
    fetchMentorsWithStats,
    fetchMentorStats,
  };

  return (
    <SuperadminMentorContext.Provider value={value}>
      {children}
    </SuperadminMentorContext.Provider>
  );
};

export const useSuperadminMentor = () => {
  const context = useContext(SuperadminMentorContext);
  if (context === undefined) {
    throw new Error("useSuperadminMentor must be used within SuperadminMentorProvider");
  }
  return context;
};

export { SuperadminMentorContext };
