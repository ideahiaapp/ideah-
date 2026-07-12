import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { decryptPending } from "@/lib/pendingRegistrationCrypto";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// TODO: nome exato do header que a Greenn usa para mandar o token ainda não
// confirmado (não documentado publicamente). Verificar no primeiro payload real
// (os headers completos são logados abaixo) e ajustar a lista de headers aceitos.
const CANDIDATE_TOKEN_HEADERS = ["x-webhook-token", "x-greenn-token", "x-greenn-signature", "authorization"];

function isValidWebhookToken(req: NextRequest): boolean {
  const secret = process.env.GREENN_WEBHOOK_SECRET;
  if (!secret) return true; // sem segredo configurado, não bloqueia (dev/local)

  for (const header of CANDIDATE_TOKEN_HEADERS) {
    const value = req.headers.get(header);
    if (!value) continue;
    const token = value.replace(/^Bearer\s+/i, "").trim();
    if (token === secret) return true;
  }
  return false;
}

// Payload confirmado pela documentação oficial da Greenn (webhook de vendas):
// {
//   oldStatus, currentStatus, type: "sale", event: "saleUpdated",
//   product: {...}, sale: {...}, seller: {...},
//   client: { email, name, ... }, saleMetas: [{ meta_key, meta_value }]
// }
// Não existe campo de referência externa (external_reference/ref) nas vendas —
// por isso usamos `client.email` para casar com o cadastro pendente.
interface GreennSaleWebhookBody {
  type?: string;
  event?: string;
  currentStatus?: string;
  client?: { email?: string; name?: string };
  sale?: { amount?: number; status?: string };
  product?: { amount?: number; name?: string };
}

// POST /api/webhooks/greenn
export async function POST(req: NextRequest) {
  if (!isValidWebhookToken(req)) {
    console.error("[Greenn webhook] token inválido ou ausente. Headers recebidos:",
      JSON.stringify(Object.fromEntries(req.headers.entries())));
    return NextResponse.json({ error: "Token inválido." }, { status: 401 });
  }

  let body: GreennSaleWebhookBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  console.log("[Greenn webhook] payload recebido:", JSON.stringify(body));

  // Só nos interessa o webhook de vendas confirmando pagamento.
  if (body.type !== "sale" || body.event !== "saleUpdated") {
    return NextResponse.json({ ok: true, ignored: true, reason: "evento não é venda/atualização de venda" });
  }

  if (body.currentStatus !== "paid") {
    // Outros status possíveis: created, waiting_payment, refused, refunded, chargedback.
    return NextResponse.json({ ok: true, ignored: true, status: body.currentStatus });
  }

  const email = body.client?.email?.toLowerCase().trim();
  if (!email) {
    console.error("[Greenn webhook] pagamento confirmado mas sem e-mail do cliente no payload.");
    return NextResponse.json({ error: "E-mail do cliente ausente no payload." }, { status: 400 });
  }

  const supabase = serviceClient();

  const { data: pending, error: fetchErr } = await supabase
    .from("pending_registrations")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  if (!pending) {
    console.error(`[Greenn webhook] nenhum cadastro pendente encontrado para ${email}.`);
    return NextResponse.json({ ok: true, note: "Cadastro pendente não encontrado para este e-mail." });
  }
  if (pending.status === "completed") return NextResponse.json({ ok: true, note: "Já processado." });

  const password = decryptPending(pending.password_encrypted);

  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email: pending.email,
    password,
    email_confirm: true,
    user_metadata: { name: pending.name },
  });

  if (createErr || !created.user) {
    return NextResponse.json({ error: createErr?.message ?? "Erro ao criar conta." }, { status: 500 });
  }

  if (pending.approaches?.length) {
    await supabase.from("therapist_approaches").insert(
      pending.approaches.map((approach: string) => ({ therapist_id: created.user.id, approach }))
    );
  }

  // Mantém o registro (auditoria) mas remove a senha cifrada e marca como concluído.
  await supabase
    .from("pending_registrations")
    .update({ status: "completed", password_encrypted: "" })
    .eq("id", pending.id);

  return NextResponse.json({ ok: true, userId: created.user.id });
}
