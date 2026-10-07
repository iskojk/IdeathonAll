import { AUTH_COOKIE_NAME } from "@/utils/authCookie";
// utils/api/auth.js
import axios from "axios";

const BASE = (process.env.NEXT_PUBLIC_API_BASE_URL_APP || "http://localhost:5002/api").replace(/\/+$/, "");

const ax = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// Request interceptor - Token'ı her istekte header'a ekle
ax.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - 401 hatasında logout yap
ax.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
        window.location.href = "/auth/login";
      }
    }
    return Promise.reject(error);
  }
);

// ---- AUTH ----
export const loginUser = async (credentials) => {
  const res = await ax.post("/auth/login", credentials);
  return res.data;
};

export const verifySession = async () => {
  const res = await ax.get("/auth/me");
  return res.data;
};

export const sendForgotPassword = async (email) => {
  const res = await ax.post("/auth/forgot-password", { email });
  return res.data;
};

export const verifyOtp = async (payload) => {
  const res = await ax.post("/auth/verify-otp", payload);
  return res.data;
};

export const resetPassword = async (payload) => {
  const res = await ax.post("/auth/reset-password", payload);
  return res.data;
};

