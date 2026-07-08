"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, checkIsAdmin } from "@/store/auth.store";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const u = session.user;
        const email = u.email ?? "";

        // Verifica se o terapeuta está cadastrado e não bloqueado no Paideia
        let allowed = false;
        try {
          const res = await fetch(`/api/auth/verify?email=${encodeURIComponent(email)}`);
          if (res.ok) ({ allowed } = await res.json() as { allowed: boolean });
        } catch { /* rede falhou — bloqueia por segurança */ }

        if (!allowed) {
          await supabase.auth.signOut();
          useAuthStore.setState({ user: null, isLoading: false });
          setInitialized(true);
          router.replace("/auth/login?error=not_registered");
          return;
        }

        const isAdmin = await checkIsAdmin(email);
        useAuthStore.setState({
          user: {
            id: u.id,
            name: u.user_metadata?.name ?? email.split("@")[0] ?? "Terapeuta",
            email,
            role: isAdmin ? "admin" : "therapist",
            avatarUrl: u.user_metadata?.avatar_url ?? undefined,
            createdAt: new Date(u.created_at),
          },
          isLoading: false,
        });
      } else {
        useAuthStore.setState({ user: null, isLoading: false });
      }
      setInitialized(true);
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (initialized && !user) router.replace("/auth/login");
  }, [initialized, user, router]);

  if (!initialized || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
