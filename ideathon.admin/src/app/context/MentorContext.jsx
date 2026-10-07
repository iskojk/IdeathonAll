"use client";

import React, { createContext, useState } from 'react';
import { toast } from 'react-toastify';
import axios from '@/utils/api/axios';

export const MentorContext = createContext();

export const MentorProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);

  // Mentorları listele
  const fetchMentors = async (page = 1, limit = 10, filters = {}) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Önce giriş yapmanız gerekiyor');
        return { success: false };
      }

      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...filters
      });

      const response = await axios.get(`/mentors?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        success: true,
        data: response.data.data || [],  // Direkt mentors array'i
        pagination: response.data.pagination || {}  // Doğrudan pagination objesi
      };
    } catch (error) {
      console.error('Mentorları getirme hatası:', error);
      toast.error(error.response?.data?.message || 'Mentorları getirirken bir hata oluştu');
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  // Mentor istatistiklerini getir
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');

      if (!token) {
        return { success: false };
      }

      const response = await axios.get('/mentors/stats/overview', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        success: true,
        data: response.data.data || {}
      };
    } catch (error) {
      console.error('İstatistikleri getirme hatası:', error);
      return { success: false };
    }
  };

  // Yeni mentor oluştur
  const createMentor = async (formData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Önce giriş yapmanız gerekiyor');
        return { success: false };
      }

      const response = await axios.post('/mentors', formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      return {
        success: true,
        message: response.data.message || 'Mentor başarıyla oluşturuldu',
        data: response.data.data
      };
    } catch (error) {
      console.error('Mentor oluşturma hatası:', error);
      const errorMessage = error.response?.data?.message || 'Mentor oluştururken bir hata oluştu';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  // Mentor güncelle
  const updateMentor = async (mentorId, formData) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Önce giriş yapmanız gerekiyor');
        return { success: false };
      }

      const response = await axios.put(`/mentors/${mentorId}`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      return {
        success: true,
        message: response.data.message || 'Mentor başarıyla güncellendi',
        data: response.data.data
      };
    } catch (error) {
      console.error('Mentor güncelleme hatası:', error);
      const errorMessage = error.response?.data?.message || 'Mentor güncellerken bir hata oluştu';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };


  // Mentor sil (soft delete)
  const deleteMentor = async (mentorId) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        toast.error('Önce giriş yapmanız gerekiyor');
        return { success: false };
      }

      const response = await axios.delete(`/mentors/${mentorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      return {
        success: true,
        message: response.data.message || 'Mentor başarıyla silindi'
      };
    } catch (error) {
      console.error('Mentor silme hatası:', error);
      const errorMessage = error.response?.data?.message || 'Mentor silerken bir hata oluştu';
      toast.error(errorMessage);
      return {
        success: false,
        message: errorMessage
      };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    loading,
    fetchMentors,
    fetchStats,
    createMentor,
    updateMentor,
    deleteMentor
  };

  return (
    <MentorContext.Provider value={value}>
      {children}
    </MentorContext.Provider>
  );
};

