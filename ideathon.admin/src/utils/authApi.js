import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_APP || "http://localhost:5002/api";

// 📌 API İsteklerini Yönetecek Axios Özel İstemcisi
const api = axios.create({
    baseURL: API_BASE_URL,
});

// 📌 Token ve X-Ideathon-Id header'ını ekle
api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = localStorage.getItem("token");
        if (token) config.headers.Authorization = `Bearer ${token}`;

        const selectedIdeathonId = localStorage.getItem("selectedIdeathonId");
        if (selectedIdeathonId && selectedIdeathonId !== "null" && selectedIdeathonId !== "all") {
            config.headers["X-Ideathon-Id"] = selectedIdeathonId;
        }
    }
    return config;
});

// 📌 Token süresi dolduğunda kullanıcıyı çıkışa yönlendiren Interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("selectedIdeathonId");
            window.location.href = "/auth/login";
        }
        return Promise.reject(error);
    }
);

export default api;
