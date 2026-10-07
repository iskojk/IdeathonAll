import axios from 'axios';

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // 🆕 X-Ideathon-Id header ekle
  const selectedIdeathonId = localStorage.getItem('selectedIdeathonId');
  if (selectedIdeathonId && selectedIdeathonId !== 'null' && selectedIdeathonId !== 'all') {
    config.headers['X-Ideathon-Id'] = selectedIdeathonId;
  }
  return config;
});

export default API;
