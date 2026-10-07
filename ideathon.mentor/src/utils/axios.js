import { AUTH_COOKIE_NAME } from "@/utils/authCookie";
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_APP || "http://localhost:5002/api";

const axiosServices = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 15000, // 15 saniye timeout
    validateStatus: (status) => status >= 200 && status < 500, // 500+ hataları reject et
});

// Request interceptor - Her istekte token'ı header'a ekle ve retry metadata'sını ekle
axiosServices.interceptors.request.use(
    (config) => {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem("token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        
        // Retry metadata'sını ekle (ilk istek için)
        if (!config.__retryCount) {
            config.__retryCount = 0;
            config.__maxRetries = config.maxRetries || 0; // Default: retry yok
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor - Token süresi dolduğunda kullanıcıyı çıkışa yönlendir, retry logic
axiosServices.interceptors.response.use(
    (response) => response,
    async (error) => {
        const config = error.config;
        
        // 401 - Authentication hatası
        if (error.response && error.response.status === 401) {
            if (typeof window !== 'undefined') {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                document.cookie = `${AUTH_COOKIE_NAME}=; path=/; max-age=0`;
                window.location.href = "/auth/login";
            }
            return Promise.reject(error);
        }
        
        // Retry logic (sadece network hataları ve 5xx hataları için)
        const shouldRetry = (
            config && 
            config.__maxRetries > 0 &&
            config.__retryCount < config.__maxRetries &&
            (
                !error.response || // Network error
                error.code === 'ECONNABORTED' || // Timeout
                (error.response.status >= 500 && error.response.status < 600) // Server error
            )
        );
        
        if (shouldRetry) {
            config.__retryCount += 1;
            
            // Exponential backoff: 1s, 2s, 4s...
            const delay = 1000 * Math.pow(2, config.__retryCount - 1);
            
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(axiosServices(config));
                }, delay);
            });
        }
        
        return Promise.reject(error);
    }
);

export default axiosServices;
 