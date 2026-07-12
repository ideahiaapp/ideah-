import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { encryptPending } from "@/lib/pendingRegistrationCrypto";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST /api/auth/pending-registration
// Cria um cadastro pendente (conta ainda não existe em auth.users).
// A conta real só é criada quando /api/webhooks/greenn confirma o pagamento.
export async function POST(req: NextRequest) {
  const body = await req.json() as {
    name?: string; email?: string; password?: string;
    approaches?: string[]; category?: string; billing?: string;
  };
  const { name, email, password, approaches, category, billing } = body;

  if (!name || !email || !password || !Array.isArray(approaches) || approaches.length === 0) {
    return NextResponse.json({ error: "Dados obrigatórios ausentes." }, { status: 400 });
  }

  const supabase = serviceClient();

  // Já existe conta ativa com esse e-mail?
  const { data: existingUsers } = await supabase.auth.admin.listUsers();
  if (existingUsers?.users.some(u => u.email?.toLowerCase() === email.toLowerCase())) {
    return NextResponse.json({ error: "Este e-mail já está cadastrado. Tente fazer login." }, { status: 409 });
  }

  const passwordEncrypted = encryptPending(password);

  // Substitui um cadastro pendente anterior do mesmo e-mail (ex.: usuário tentou de novo)
  await supabase.from("pending_registrations").delete().eq("email", email.toLowerCase());

  const { data, error } = await supabase
    .from("pending_registrations")
    .insert({
      name,
      email: email.toLowerCase(),
      password_encrypted: passwordEncrypted,
      approaches,
      category: category ?? "individual",
      billing: billing ?? "monthly",
    })
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Erro ao criar cadastro pendente." }, { status: 500 });
  }

  return NextResponse.json({ id: data.id });
}

// GET /api/auth/pending-registration?id=...
// Usado pela tela de retorno do checkout para saber se o pagamento já foi confirmado.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id é obrigatório." }, { status: 400 });

  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("pending_registrations")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ status: "completed" }); // já removido = concluído

  return NextResponse.json({ status: data.status });
}
