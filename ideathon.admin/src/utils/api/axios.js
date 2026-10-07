// utils/api/axios.js
import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL_APP || "http://localhost:5010/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Access token'ı ve X-Ideathon-Id header'ını ekle
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;

    // Seçili ideathon varsa X-Ideathon-Id header'ı ekle
    const selectedIdeathonId = localStorage.getItem("selectedIdeathonId");
    if (selectedIdeathonId && selectedIdeathonId !== "null" && selectedIdeathonId !== "all") {
      config.headers["X-Ideathon-Id"] = selectedIdeathonId;
    }
  }
  return config;
});

// 401 durumunda direkt logout
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 && typeof window !== "undefined") {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("selectedIdeathonId");
      } catch {}
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);

export default api;
