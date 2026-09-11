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

    const [{ data: profiles, error: profilesErr }, { data: acceptances, error: acceptErr }, { data: adminRows }] = await Promise.all([
      supabaseAdmin.from("therapist_profiles").select("user_id, email, created_at"),
      supabaseAdmin
        .from("pilot_term_acceptances")
        .select("user_id, email, name, term_version, accepted_at")
        .eq("term_version", PILOT_TERM_VERSION),
      supabaseAdmin.from("admins").select("email"),
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

    // Admins também usam o Paideia e precisam aceitar o termo, mas contas admin "puras"
    // (cadastradas direto na tabela admins) não têm linha em therapist_profiles.
    const listedEmails = new Set(result.map(t => t.email?.toLowerCase().trim()));
    for (const row of adminRows ?? []) {
      const adminEmail = row.email?.toLowerCase().trim();
      if (!adminEmail || listedEmails.has(adminEmail)) continue;
      const adminUser = users.find(u => u.email?.toLowerCase().trim() === adminEmail);
      if (!adminUser) continue;
      const acceptance = acceptanceMap.get(adminUser.id);
      result.push({
        userId:     adminUser.id,
        email:      adminUser.email ?? adminEmail,
        name:       adminUser.user_metadata?.name ?? adminUser.email?.split("@")[0] ?? "—",
        createdAt:  adminUser.created_at,
        accepted:   !!acceptance,
        acceptedAt: acceptance?.accepted_at ?? null,
      });
      listedEmails.add(adminEmail);
    }

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
