import { create } from "zustand";
import { persist } from "zustand/middleware";
import { User } from "@ideah/types";
import { api } from "../lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });
        const { data } = await api.post("/auth/login", { email, password });
        localStorage.setItem("@ideah:token", data.token);
        set({ user: data.user, token: data.token, isLoading: false });
      },

      register: async (name, email, password) => {
        set({ isLoading: true });
        const { data } = await api.post("/auth/register", { name, email, password });
        localStorage.setItem("@ideah:token", data.token);
        set({ user: data.user, token: data.token, isLoading: false });
      },

      logout: () => {
        localStorage.removeItem("@ideah:token");
        set({ user: null, token: null });
      },

      fetchMe: async () => {
        const { data } = await api.get("/auth/me");
        set({ user: data });
      },
    }),
    {
      name: "@ideah:auth",
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
