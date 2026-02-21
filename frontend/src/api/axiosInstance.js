import axios from "axios";

/**
 * Central Axios instance shared across the whole app.
 *
 * Base URL:
 *  - Development: empty string → Vite proxy forwards /api/* to http://localhost:8080
 *  - Production:  set VITE_API_URL env var (e.g. https://api.yourdomain.com)
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "",
});

// ── Request interceptor ────────────────────────────────────────────────────────
// Automatically attach the JWT from localStorage to every outgoing request.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor ──────────────────────────────────────────────────────
// On 401 (expired / invalid token): clear storage and redirect to login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("email");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default api;
