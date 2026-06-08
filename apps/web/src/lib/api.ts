import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001",
  headers: { "Content-Type": "application/json" },
});

// Injetar token automaticamente
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("@ideah:token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirecionar para login em 401
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("@ideah:token");
      window.location.href = "/auth/login";
    }
    return Promise.reject(error);
  }
);
