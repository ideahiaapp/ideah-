"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAdminStore } from "@/store/admin.store";
import { checkIsAdmin, useAuthStore } from "@/store/auth.store";

function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAdmin: isAdminStore } = useAdminStore();
  const { user } = useAuthStore();
  const [checking, setChecking] = useState(true);
  const [allowed,  setAllowed]  = useState(false);

  useEffect(() => {
    async function check() {
      /* 1. Já autenticado via admin.store (login manual) */
      if (isAdminStore) { setAllowed(true); setChecking(false); return; }

      /* 2. Usuário Supabase com e-mail admin */
      if (user?.role === "admin") {
        /* Sincroniza com admin.store — outras páginas (ex: /admin) checam esse store */
        useAdminStore.setState({ email: user.email, isAdmin: true });
        setAllowed(true);
        setChecking(false);
        return;
      }

      /* 3. Verifica sessão Supabase ativa (ex: refresh de página) */
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email?.toLowerCase().trim() ?? "";
      if (email && await checkIsAdmin(email)) {
        /* Autentica também no admin.store para o header mostrar o e-mail */
        useAdminStore.setState({ email: data.user!.email!, isAdmin: true });
        setAllowed(true);
      } else {
        router.replace("/admin/login");
      }
      setChecking(false);
    }
    check();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
      </div>
    );
  }

  if (!allowed) return null;
  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/admin/login";

  return (
    <div className="min-h-screen bg-gray-950">
      {isLoginPage ? children : <AdminGuard>{children}</AdminGuard>}
    </div>
  );
}
