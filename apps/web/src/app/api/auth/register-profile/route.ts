import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = serviceClient();
    const { userId, email, approaches } = await req.json() as { userId?: string; email?: string; approaches?: string[] };
    if (!userId || !email) return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });

    // Registra como terapeuta autorizado
    await supabaseAdmin
      .from("therapist_profiles")
      .upsert({ user_id: userId, email: email.toLowerCase().trim() });

    // Confirma o email automaticamente — evita exigir clique no link de confirmação
    await supabaseAdmin.auth.admin.updateUserById(userId, { email_confirm: true });

    // Vínculo das bases escolhidas (ex.: cadastro via Google, que não passa pelo
    // fluxo de pending_registrations). Substitui a lista anterior, se houver.
    if (approaches?.length) {
      await supabaseAdmin.from("therapist_approaches").delete().eq("therapist_id", userId);
      await supabaseAdmin.from("therapist_approaches").insert(
        approaches.map(approach => ({ therapist_id: userId, approach }))
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
