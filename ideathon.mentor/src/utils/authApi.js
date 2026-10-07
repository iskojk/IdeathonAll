import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL_APP || "http://localhost:5002/api";

// 📌 API İsteklerini Yönetecek Axios Özel İstemcisi
const api = axios.create({
    baseURL: API_BASE_URL,
});

// 📌 📌 Token süresi dolduğunda kullanıcıyı çıkışa yönlendiren Interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem("token"); // Token'ı temizle
            localStorage.removeItem("user"); // Kullanıcı verisini temizle
            window.location.href = "/auth/login"; // Giriş sayfasına yönlendir
        }
        return Promise.reject(error);
    }
);

export default api;
