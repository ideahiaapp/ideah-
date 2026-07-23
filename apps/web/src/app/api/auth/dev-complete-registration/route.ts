import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { completePendingRegistration } from "@/lib/completePendingRegistration";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * ⚠️ TEMPORÁRIO — bypass do pagamento pra destravar testes de cadastro enquanto
 * o checkout (Greenn ou outra plataforma) não está configurado. Cria a conta
 * direto a partir do cadastro pendente, sem exigir confirmação de pagamento.
 *
 * REMOVER esta rota (e o botão que a chama em auth/register/page.tsx) assim que
 * NEXT_PUBLIC_GREENN_CHECKOUT_URL estiver configurado e o webhook testado —
 * caso contrário qualquer pessoa pode criar conta sem pagar.
 */
export async function POST(req: NextRequest) {
  try {
    const { pendingId } = await req.json();
    if (!pendingId) return NextResponse.json({ error: "pendingId é obrigatório." }, { status: 400 });

    const supabase = serviceClient();
    const { data: pending, error } = await supabase
      .from("pending_registrations")
      .select("*")
      .eq("id", pendingId)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!pending) return NextResponse.json({ error: "Cadastro pendente não encontrado." }, { status: 404 });
    if (pending.status === "completed") return NextResponse.json({ ok: true, note: "Já processado." });

    const result = await completePendingRegistration(supabase, pending);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
