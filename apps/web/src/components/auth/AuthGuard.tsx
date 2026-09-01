"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, checkIsAdmin } from "@/store/auth.store";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { API_BASE } from "@/lib/api-base";
import { PilotTermModal } from "@/components/auth/PilotTermModal";
import { PILOT_TERM_VERSION } from "@/lib/pilotTerm";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAuthStore();
  const [initialized, setInitialized] = useState(false);
  // null = ainda não verificado; evita mostrar o dashboard por um instante antes de saber.
  const [termAccepted, setTermAccepted] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const u = session.user;
        const email = u.email ?? "";

        // Verifica se o terapeuta está cadastrado e não bloqueado no Paideia
        let allowed = false;
        try {
          const res = await fetch(`${API_BASE}/api/auth/verify?email=${encodeURIComponent(email)}`);
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

  /* Programa-piloto: verifica se este usuário já aceitou a versão atual do
     Termo de Participação e Confidencialidade. Reseta a cada troca de usuário. */
  useEffect(() => {
    if (!user) { setTermAccepted(null); return; }
    let cancelled = false;
    supabase
      .from("pilot_term_acceptances")
      .select("id")
      .eq("user_id", user.id)
      .eq("term_version", PILOT_TERM_VERSION)
      .maybeSingle()
      .then(({ data }) => { if (!cancelled) setTermAccepted(!!data); });
    return () => { cancelled = true; };
  }, [user]);

  async function acceptPilotTerm() {
    if (!user) return;
    const { error } = await supabase.from("pilot_term_acceptances").insert({
      user_id: user.id,
      email: user.email,
      name: user.name,
      term_version: PILOT_TERM_VERSION,
    });
    if (error) throw error;
    setTermAccepted(true);
  }

  if (!initialized || !user || termAccepted === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-7 h-7 text-brand-400 animate-spin" />
      </div>
    );
  }

  if (!termAccepted) {
    return <PilotTermModal onAccept={acceptPilotTerm} />;
  }

  return <>{children}</>;
}
