import { create } from "zustand";
import { persist } from "zustand/middleware";

const ADMIN_EMAILS = [
  "carlos.magno@gmail.com",
  "betinha.potter@gmail.com",
  "elimarcia.philos@gmail.com",
];

interface AdminState {
  email:    string | null;
  isAdmin:  boolean;
  isLoading: boolean;
  error:    string | null;
  login:    (email: string, password: string) => Promise<void>;
  logout:   () => void;
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
        await new Promise(r => setTimeout(r, 600));

        if (!ADMIN_EMAILS.includes(email.toLowerCase().trim())) {
          set({ isLoading: false, error: "E-mail não autorizado como administrador." });
          return;
        }
        // Senha mock — troca por auth real quando tiver backend
        if (password !== "ideah@admin2025") {
          set({ isLoading: false, error: "Senha incorreta." });
          return;
        }
        set({ email, isAdmin: true, isLoading: false, error: null });
      },

      logout: () => set({ email: null, isAdmin: false }),
    }),
    {
      name: "@ideah:admin",
      partialize: (s) => ({ email: s.email, isAdmin: s.isAdmin }),
    }
  )
);
