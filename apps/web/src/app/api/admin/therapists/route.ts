import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const ADMIN_EMAILS = [
  "carlos.magno@gmail.com",
  "betinha.potter@gmail.com",
  "elimarcia.philos@gmail.com",
  "ideahiaapp@gmail.com",
];

async function assertAdmin(req: NextRequest) {
  const email = req.headers.get("x-admin-email")?.toLowerCase().trim();
  if (!email || !ADMIN_EMAILS.includes(email)) {
    throw new Error("Acesso negado.");
  }
}

// GET /api/admin/therapists — lista todos
export async function GET(req: NextRequest) {
  try {
    await assertAdmin(req);
    const supabaseAdmin = serviceClient();

    const { data: profiles, error } = await supabaseAdmin
      .from("therapist_profiles")
      .select("user_id, email, blocked, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Busca nomes do Supabase Auth
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const userMap = new Map(users.map(u => [u.id, u.user_metadata?.name ?? u.email?.split("@")[0] ?? "—"]));

    const result = (profiles ?? []).map(p => ({
      userId:    p.user_id,
      email:     p.email,
      name:      userMap.get(p.user_id) ?? "—",
      blocked:   p.blocked,
      createdAt: p.created_at,
    }));

    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}

// PATCH /api/admin/therapists — bloquear/desbloquear
export async function PATCH(req: NextRequest) {
  try {
    await assertAdmin(req);
    const supabaseAdmin = serviceClient();
    const { userId, blocked } = await req.json();
    if (!userId || typeof blocked !== "boolean") {
      return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("therapist_profiles")
      .update({ blocked })
      .eq("user_id", userId);

    if (error) throw error;

    // Se bloqueado, revoga sessões ativas
    if (blocked) {
      await supabaseAdmin.auth.admin.signOut(userId);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
