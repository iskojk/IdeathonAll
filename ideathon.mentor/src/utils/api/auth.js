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

// Response interceptor - 401 hatasında logout yap (login sayfası hariç)
ax.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/auth/mentor-login') || error.config?.url?.includes('/auth/login');
      if (!isLoginRequest && typeof window !== 'undefined') {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("mentorProfile");
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

// ---- MENTOR AUTH ----
export const mentorLogin = async (credentials) => {
  const res = await ax.post("/auth/mentor-login", credentials);
  return res.data;
};

export const refreshToken = async () => {
  const res = await ax.post("/auth/refresh-token");
  return res.data;
};

export const getMe = async () => {
  const res = await ax.get("/auth/me");
  return res.data;
};

export const changePassword = async (passwordData) => {
  const res = await ax.post("/auth/change-password", passwordData);
  return res.data;
};

export const updateProfile = async (profileData) => {
  const res = await ax.patch("/auth/profile", profileData);
  return res.data;
};

// ---- PASSWORD RESET ----
/**
 * Şifre sıfırlama kodu iste
 * @param {string} email - Kullanıcının email adresi
 */
export const forgotPassword = async (email) => {
  const res = await ax.post("/auth/forgot-password", { email });
  return res.data;
};

/**
 * Şifreyi sıfırla (kod ile)
 * @param {object} data - { email, code, newPassword }
 */
export const resetPassword = async (data) => {
  const res = await ax.post("/auth/reset-password", data);
  return res.data;
};

