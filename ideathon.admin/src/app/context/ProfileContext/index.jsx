"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_APP || "http://localhost:5002/api";

const ProfileContext = createContext();

export const ProfileProvider = ({ children }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 📌 Yetkilendirme başlıklarını al
  const getAuthHeaders = () => {
    const token = localStorage.getItem("token");
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const selectedIdeathonId = localStorage.getItem("selectedIdeathonId");
    if (selectedIdeathonId && selectedIdeathonId !== "null" && selectedIdeathonId !== "all") {
      headers["X-Ideathon-Id"] = selectedIdeathonId;
    }
    return headers;
  };

  // 📌 Kullanıcı profilini getir
  const loadUserProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: getAuthHeaders(),
      });

      // API response format kontrolü - farklı formatlar olabilir
      let userData;
      if (response.data.success && response.data.data) {
        // Format: { success, message, data: userObject }
        userData = response.data.data;
        setProfile(userData);
      } else if (response.data.success && !response.data.data) {
        // Format: { success, message, ...userFields }
        const { success, message, ...profileData } = response.data;
        userData = profileData;
        setProfile(userData);
      } else {
        throw new Error(response.data.message || "Profil bilgisi yüklenemedi!");
      }

      // localStorage'ı da güncelle
      if (userData) {
        localStorage.setItem("user", JSON.stringify(userData));
      }
    } catch (error) {
      setError(error.response?.data?.message || "Profil bilgisi yüklenemedi!");
      console.error("Profile loading error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 📌 Kullanıcı profilini güncelle (ad, email)
  const updateUserProfile = async (formData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.patch(`${API_BASE_URL}/auth/profile`, formData, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (response.data.success) {
        // Profil güncellendikten sonra tekrar yükle
        await loadUserProfile();

        // localStorage'daki user verisini de güncelle
        const updatedUser = { ...profile, ...formData };
        localStorage.setItem("user", JSON.stringify(updatedUser));

        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data.message || "Profil güncelleme başarısız!");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Profil güncelleme başarısız!");
      return { success: false, message: error.response?.data?.message };
    } finally {
      setLoading(false);
    }
  };

  // 📌 Şifreyi değiştir (mevcut + yeni şifre)
  const changePassword = async ({ currentPassword, newPassword, confirmPassword }) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/change-password`, {
        currentPassword,
        newPassword,
        confirmPassword: confirmPassword || newPassword,
      }, {
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
      });

      if (response.data.success) {
        return { success: true, message: response.data.message };
      } else {
        throw new Error(response.data.message || "Şifre güncelleme başarısız!");
      }
    } catch (error) {
      setError(error.response?.data?.message || "Şifre güncellenemedi!");
      return { success: false, message: error.response?.data?.message || "Şifre güncellenemedi!" };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserProfile();
  }, []);

  return (
    <ProfileContext.Provider
      value={{
        profile,
        loading,
        error,
        loadUserProfile,
        updateUserProfile,
        changePassword,
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
