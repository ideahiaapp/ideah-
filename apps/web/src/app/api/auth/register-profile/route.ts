import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { userId, email } = await req.json();
    if (!userId || !email) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

    // Registra como terapeuta autorizado
    await supabaseAdmin
      .from("therapist_profiles")
      .upsert({ user_id: userId, email: email.toLowerCase().trim() });

    // Confirma o email automaticamente — evita exigir clique no link de confirmação
    await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
