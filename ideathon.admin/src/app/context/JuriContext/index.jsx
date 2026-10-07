"use client";

import React, { createContext, useContext, useState } from "react";
import api from "@/utils/api/axios";

const JuriContext = createContext(undefined);

const defaultStats = {
        overall: {
            totalEvaluations: 0,
            evaluatedTeamsCount: 0,
    totalApprovedTeams: 0,
    pendingTeamsCount: 0,
            activeJurisCount: 0,
    averageScore: 0,
            maxScore: 0,
    minScore: 0,
    completionRate: 0,
  },
  criteriaAverages: {},
  juriStats: [],
  evaluatedTeamNames: [],
};

const defaultSummary = {
  totalTeams: 0,
  totalEvaluations: 0,
  overallAverageScore: 0,
  highestAverage: 0,
  lowestAverage: 0,
};

export const JuriProvider = ({ children }) => {
  const [stats, setStats] = useState(defaultStats);
    const [rankings, setRankings] = useState([]);
  const [summary, setSummary] = useState(defaultSummary);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

  // Istatistikleri getir
    const fetchStats = async () => {
        setLoading(true);
        setError(null);
        try {
      const res = await api.get("/juri/stats");

            if (res.data.success) {
        setStats({
          overall: { ...defaultStats.overall, ...(res.data.data?.overall || {}) },
          criteriaAverages: res.data.data?.criteriaAverages || {},
          juriStats: res.data.data?.juriStats || [],
          evaluatedTeamNames: res.data.data?.evaluatedTeamNames || [],
                });
                return { success: true, data: res.data.data };
            } else {
        throw new Error(res.data.message || "Istatistikler yuklenemedi");
            }
        } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Istatistikler yuklenemedi";
            setError(errorMessage);
      return { success: false, message: errorMessage };
        } finally {
            setLoading(false);
        }
    };

  // Siralamalari getir
    const fetchRankings = async () => {
        setLoading(true);
        setError(null);
        try {
      const res = await api.get("/juri/rankings");

            if (res.data.success) {
        setRankings(res.data.data?.rankings || []);
        setSummary({ ...defaultSummary, ...(res.data.data?.summary || {}) });
                return { success: true, data: res.data.data };
            } else {
        throw new Error(res.data.message || "Siralama yuklenemedi");
            }
        } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Siralama yuklenemedi";
            setError(errorMessage);
      return { success: false, message: errorMessage };
        } finally {
            setLoading(false);
        }
    };

  // Hem stats hem rankings paralel getir
    const fetchAll = async () => {
        setLoading(true);
        setError(null);
        try {
            const [statsRes, rankingsRes] = await Promise.all([
        api.get("/juri/stats"),
        api.get("/juri/rankings"),
      ]);

      if (statsRes.data.success) {
        setStats({
          overall: { ...defaultStats.overall, ...(statsRes.data.data?.overall || {}) },
          criteriaAverages: statsRes.data.data?.criteriaAverages || {},
          juriStats: statsRes.data.data?.juriStats || [],
          evaluatedTeamNames: statsRes.data.data?.evaluatedTeamNames || [],
        });
      }

      if (rankingsRes.data.success) {
        setRankings(rankingsRes.data.data?.rankings || []);
        setSummary({ ...defaultSummary, ...(rankingsRes.data.data?.summary || {}) });
      }

      if (!statsRes.data.success && !rankingsRes.data.success) {
        throw new Error("Veriler yuklenemedi");
      }
                
                return { 
                    success: true, 
                    stats: statsRes.data.data,
        rankings: rankingsRes.data.data,
                };
        } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Veriler yuklenemedi";
            setError(errorMessage);
      return { success: false, message: errorMessage };
        } finally {
            setLoading(false);
        }
    };

  const deleteEvaluation = async (evaluationId) => {
    try {
      const res = await api.delete(`/juri/evaluations/${evaluationId}`);
      if (res.data.success) {
        return { success: true, data: res.data.data, message: res.data.message };
      }
      throw new Error(res.data.message || "Değerlendirme silinemedi");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Değerlendirme silinemedi";
      return { success: false, message: msg };
    }
  };

  const deleteEvaluationsByJury = async (juriId) => {
    try {
      const res = await api.delete(`/juri/evaluations/by-jury/${juriId}`);
      if (res.data.success) {
        return { success: true, data: res.data.data, message: res.data.message };
      }
      throw new Error(res.data.message || "Değerlendirmeler silinemedi");
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Değerlendirmeler silinemedi";
      return { success: false, message: msg };
    }
  };

    return (
        <JuriContext.Provider
            value={{
                stats,
                rankings,
        summary,
                loading,
                error,
                fetchStats,
                fetchRankings,
                fetchAll,
        deleteEvaluation,
        deleteEvaluationsByJury,
            }}
        >
            {children}
        </JuriContext.Provider>
    );
};

export { JuriContext };
export const useJuri = () => useContext(JuriContext);
