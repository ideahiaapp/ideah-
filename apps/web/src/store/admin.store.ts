import { create } from "zustand";
import { persist } from "zustand/middleware";
import { checkIsAdmin } from "@/store/auth.store";
import { supabase } from "@/lib/supabase";

interface AdminState {
  email:    string | null;
  isAdmin:  boolean;
  isLoading: boolean;
  error:    string | null;
  login:    (email: string, password: string) => Promise<void>;
  logout:   () => Promise<void>;
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      email:     null,
      isAdmin:   false,
      isLoading: false,
      error:     null,

      login: async (email, password) => {
        set({ isLoading: true, error: null });

        // Autentica via Supabase Auth (mesma sessão usada pelo resto do app —
        // sem senha hardcoded, sem lista de e-mails no código).
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error || !data.user?.email) {
          set({ isLoading: false, error: "E-mail ou senha incorretos." });
          return;
        }

        const isAdmin = await checkIsAdmin(data.user.email);
        if (!isAdmin) {
          await supabase.auth.signOut();
          set({ isLoading: false, error: "E-mail não autorizado como administrador." });
          return;
        }

        set({ email: data.user.email, isAdmin: true, isLoading: false, error: null });
      },

      logout: async () => {
        await supabase.auth.signOut();
        set({ email: null, isAdmin: false });
      },
    }),
    {
      name: "@ideah:admin",
      partialize: (s) => ({ email: s.email, isAdmin: s.isAdmin }),
    }
  )
);
