import { cookies } from "next/headers";
import { isValidAdminCookie, COOKIE_NAME } from "@/lib/adminAuth";
import { getServiceClient } from "@/lib/supabase/server";
import { login, logout } from "./actions";
import { Dashboard } from "@/components/interessados/Dashboard";
import type { DarichaEvent } from "@/components/interessados/types";

export const dynamic = "force-dynamic";

export default async function InteressadosPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const cookieValue = cookies().get(COOKIE_NAME)?.value;
  const authenticated = isValidAdminCookie(cookieValue);

  if (!authenticated) {
    return <LoginScreen wrongPassword={searchParams.erro === "1"} />;
  }

  const client = getServiceClient();
  if (!client) {
    return (
      <Shell>
        <p className="text-cream-100/80">
          O Supabase deste projeto ainda não está configurado (variáveis
          <code className="mx-1 rounded bg-cream-100/10 px-1.5 py-0.5 text-sm">
            NEXT_PUBLIC_SUPABASE_URL
          </code>
          e
          <code className="mx-1 rounded bg-cream-100/10 px-1.5 py-0.5 text-sm">
            SUPABASE_SERVICE_ROLE_KEY
          </code>
          ). Assim que estiverem definidas, os dados de interesse aparecem aqui.
        </p>
      </Shell>
    );
  }

  const { data, error } = await client
    .from("daricha_events")
    .select("id, created_at, session_id, event_type, slide_index, slide_id, device, name")
    .order("created_at", { ascending: false })
    .limit(10000);

  return (
    <Shell>
      {error ? (
        <p className="text-coral-300">Não foi possível carregar os dados: {error.message}</p>
      ) : (
        <Dashboard events={(data ?? []) as DarichaEvent[]} />
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-wine-950 px-4 py-8 text-cream-50 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.25em] text-gold-300">Daricha Sundari</p>
            <h1 className="font-display text-2xl font-medium">Interessados</h1>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="rounded-full border border-cream-100/20 px-4 py-2 text-xs uppercase tracking-wide text-cream-100/70 transition-colors hover:bg-cream-100/10"
            >
              Sair
            </button>
          </form>
        </div>
        {children}
      </div>
    </div>
  );
}

function LoginScreen({ wrongPassword }: { wrongPassword: boolean }) {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-wine-gradient px-6 text-cream-50">
      <form action={login} className="w-full max-w-sm rounded-3xl border border-cream-100/10 bg-wine-900/60 p-8 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.25em] text-gold-300">Daricha Sundari</p>
        <h1 className="mt-1 font-display text-2xl font-medium">Painel de interessados</h1>
        <p className="mt-3 text-sm text-cream-100/70">
          Acesso restrito à equipe. Informe a senha para continuar.
        </p>
        <input
          type="password"
          name="password"
          required
          autoFocus
          placeholder="Senha"
          className="mt-6 w-full rounded-xl border border-cream-100/20 bg-cream-100/5 px-4 py-3 text-cream-50 outline-none focus:border-coral-400"
        />
        {wrongPassword && <p className="mt-2 text-sm text-coral-400">Senha incorreta.</p>}
        <button
          type="submit"
          className="mt-6 w-full rounded-full bg-coral-400 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-wine-950"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
