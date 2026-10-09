// utils/api/auth.js
import axios from "axios";

const BASE = (process.env.NEXT_PUBLIC_API_BASE_URL_APP || "http://localhost:5002/api").replace(/\/+$/, "");

const ax = axios.create({
  baseURL: BASE,
  headers: { "Content-Type": "application/json" },
  withCredentials: false,
});

// ---- AUTH ----
export const loginUser = async (credentials) => {
  const res = await ax.post("/auth/login", credentials);
  return res.data;
};

export const sendForgotPassword = async (email) => {
  const res = await ax.post("/auth/forgot-password", { email });
  return res.data;
};

export const resetPassword = async (payload) => {
  const res = await ax.post("/auth/reset-password", payload);
  return res.data;
};

// 🆕 İdeathon seçimi — yeni token döner
export const selectIdeathonApi = async (ideathonId) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const res = await ax.post(
    "/auth/select-ideathon",
    { ideathonId: ideathonId || "all" },
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }
  );
  return res.data;
};
