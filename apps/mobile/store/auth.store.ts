import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { User } from "@ideah/types";
import { api, TOKEN_KEY } from "../lib/api";

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    const token = await SecureStore.getItemAsync(TOKEN_KEY);
    if (token) {
      try {
        const { data } = await api.get("/auth/me");
        set({ user: data, token, isInitialized: true });
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        set({ isInitialized: true });
      }
    } else {
      set({ isInitialized: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    const { data } = await api.post("/auth/login", { email, password });
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    set({ user: data.user, token: data.token, isLoading: false });
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    const { data } = await api.post("/auth/register", { name, email, password });
    await SecureStore.setItemAsync(TOKEN_KEY, data.token);
    set({ user: data.user, token: data.token, isLoading: false });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ user: null, token: null });
  },
}));
