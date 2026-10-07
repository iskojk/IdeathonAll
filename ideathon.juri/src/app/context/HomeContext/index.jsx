"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL_APP || "http://localhost:5002/api";

const HomeContext = createContext(undefined);

export const HomeProvider = ({ children }) => {
  const [summary, setSummary] = useState(null);   // { kpis, timeseries, recent, alerts }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // tarih aralığı + limit (dashboard üst filtresi için)
  const [range, setRange] = useState({
    from: null,  // "YYYY-MM-DD" | null
    to:   null,  // "YYYY-MM-DD" | null
    days: 30,    // from/to yoksa days devreye girer
    limit: 10,   // recent/pending list limit
  });

  const getAuthHeaders = () => {
    if (typeof window === "undefined") return {};
    try {
      const token = localStorage.getItem("token");
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch {
      return {};
    }
  };

  const buildQuery = () => {
    const params = new URLSearchParams();
    if (range.from) params.append("from", range.from);
    if (range.to)   params.append("to", range.to);
    if (!range.from && !range.to) params.append("days", String(range.days || 30));
    params.append("limit", String(range.limit || 10));
    return params.toString();
  };

  const fetchSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = buildQuery();
      const res = await axios.get(`${API_BASE_URL}/admin/dashboard/summary?${q}`, {
        headers: { ...getAuthHeaders() },
      });
      if (res.data?.success) {
        setSummary(res.data.data || null);
      } else {
        throw new Error(res.data?.message || "Özet verisi alınamadı");
      }
    } catch (err) {
      setError(err?.message || "Özet verisi alınamadı");
    } finally {
      setLoading(false);
    }
  };

  const reload = () => fetchSummary();

  useEffect(() => {
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range.from, range.to, range.days, range.limit]);

  const value = useMemo(
    () => ({
      summary,                 // { kpis, timeseries, recent, alerts }
      kpis: summary?.kpis || null,
      timeseries: summary?.timeseries || null,
      recent: summary?.recent || null,
      alerts: summary?.alerts || [],
      range,
      setRange,
      loading,
      error,
      reload,
    }),
    [summary, range, loading, error]
  );

  return <HomeContext.Provider value={value}>{children}</HomeContext.Provider>;
};

export const useHome = () => useContext(HomeContext);
