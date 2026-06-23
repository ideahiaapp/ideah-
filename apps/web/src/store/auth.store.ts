import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supabase } from "@/lib/supabase";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "therapist";
  avatarUrl?: string;
  createdAt: Date;
};
import type { User as SupabaseUser } from "@supabase/supabase-js";

export const ADMIN_EMAILS = [
  "carlos.magno@gmail.com",
  "betinha.potter@gmail.com",
  "elimarcia.philos@gmail.com",
  "ideahiaapp@gmail.com",
];

/* ─── Mapeia usuário Supabase → tipo interno ─────────── */
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
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,

      /* ── Email + senha ─────────────────────────────── */
      login: async (email, password) => {
        set({ isLoading: true });
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) { set({ isLoading: false }); throw error; }
        set({ user: toUser(data.user), isLoading: false });
      },

      /* ── Google OAuth ──────────────────────────────── */
      loginWithGoogle: async () => {
        set({ isLoading: true });
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${window.location.origin}/dashboard`,
            queryParams: { access_type: "offline", prompt: "consent" },
          },
        });
        // OAuth redireciona — loading fica ativo durante o redirect
        if (error) { set({ isLoading: false }); throw error; }
      },

      /* ── Cadastro ──────────────────────────────────── */
      register: async (name, email, password) => {
        set({ isLoading: true });
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } },
        });
        if (error) { set({ isLoading: false }); throw error; }

        // Registra o terapeuta como autorizado no IDEAh (mesmo antes de confirmar email)
        if (data.user) {
          await fetch("/api/auth/register-profile", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: data.user.id, email }),
          });
          // register-profile confirma o email via admin API — loga direto
          set({ user: toUser(data.user), isLoading: false });
        } else {
          set({ isLoading: false });
        }
      },

      /* ── Logout ────────────────────────────────────── */
      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null });
      },

      /* ── Recupera sessão ativa (ex: refresh de página) */
      fetchMe: async () => {
        const { data } = await supabase.auth.getUser();
        if (data.user) set({ user: toUser(data.user) });
        else set({ user: null });
      },
    }),
    {
      name: "@ideah:auth",
      partialize: (state) => ({ user: state.user }),
    }
  )
);
