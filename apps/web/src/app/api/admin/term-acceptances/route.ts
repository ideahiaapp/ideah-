import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/adminAuth";
import { PILOT_TERM_VERSION } from "@/lib/pilotTerm";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/admin/term-acceptances — lista todos os terapeutas com o status de aceite
// do Termo de Participação no Programa-Piloto (versão vigente).
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const supabaseAdmin = serviceClient();

    const [{ data: profiles, error: profilesErr }, { data: acceptances, error: acceptErr }] = await Promise.all([
      supabaseAdmin.from("therapist_profiles").select("user_id, email, created_at"),
      supabaseAdmin
        .from("pilot_term_acceptances")
        .select("user_id, email, name, term_version, accepted_at")
        .eq("term_version", PILOT_TERM_VERSION),
    ]);
    if (profilesErr) throw profilesErr;
    if (acceptErr) throw acceptErr;

    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
    const userMap = new Map(users.map(u => [u.id, u.user_metadata?.name ?? u.email?.split("@")[0] ?? "—"]));
    const acceptanceMap = new Map((acceptances ?? []).map(a => [a.user_id, a]));

    const result = (profiles ?? []).map(p => {
      const acceptance = acceptanceMap.get(p.user_id);
      return {
        userId:     p.user_id,
        email:      p.email,
        name:       userMap.get(p.user_id) ?? "—",
        createdAt:  p.created_at,
        accepted:   !!acceptance,
        acceptedAt: acceptance?.accepted_at ?? null,
      };
    });

    result.sort((a, b) => {
      if (a.accepted !== b.accepted) return a.accepted ? 1 : -1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return NextResponse.json({
      termVersion: PILOT_TERM_VERSION,
      total: result.length,
      acceptedCount: result.filter(r => r.accepted).length,
      therapists: result,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}
