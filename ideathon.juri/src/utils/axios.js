import { AUTH_COOKIE_NAME } from "@/utils/authCookie";
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_APP || "http://localhost:5002/api";

const axiosServices = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor - Her istekte token'ı header'a ekle
axiosServices.interceptors.request.use(
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

// Response interceptor - Token süresi dolduğunda kullanıcıyı çıkışa yönlendir
axiosServices.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                // Cookie'yi de temizle
                document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
                window.location.href = "/auth/login";
            }
        }
        return Promise.reject((error.response && error.response.data) || 'Wrong Services');
    }
);

export default axiosServices;
 