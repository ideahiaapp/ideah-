import { create } from "zustand";
import { supabase } from "../lib/supabase";
import type { User } from "@paideia/types";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const ADMIN_EMAILS = [
  "carlos.magno@gmail.com",
  "betinha.potter@gmail.com",
  "elimarcia.philos@gmail.com",
];

function toUser(u: SupabaseUser): User {
  const email = u.email ?? "";
  return {
    id: u.id,
    name: u.user_metadata?.name ?? email.split("@")[0] ?? "Terapeuta",
    email,
    role: ADMIN_EMAILS.includes(email.toLowerCase().trim()) ? "admin" : "therapist",
    avatarUrl: u.user_metadata?.avatar_url ?? undefined,
    createdAt: new Date(u.created_at),
  };
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    set({
      user: session?.user ? toUser(session.user) : null,
      isInitialized: true,
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user ? toUser(session.user) : null });
    });
  },

  login: async (email, password) => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { set({ isLoading: false }); throw error; }
    set({ user: toUser(data.user), isLoading: false });
  },

  register: async (name, email, password) => {
    set({ isLoading: true });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) { set({ isLoading: false }); throw error; }
    if (data.user) {
      // Auto-confirma via backend (igual ao web)
      await fetch(`${process.env.EXPO_PUBLIC_WEB_URL}/api/auth/register-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: data.user.id, email }),
      });
      set({ user: toUser(data.user), isLoading: false });
    } else {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },
}));
