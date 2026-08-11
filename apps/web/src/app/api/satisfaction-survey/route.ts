import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin, AdminAuthError } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/satisfaction-survey — lista todas as respostas (admin only)
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }

  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("satisfaction_survey_responses")
    .select("id, therapist_name, therapist_email, answers, platform, created_at")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ responses: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
}

// POST /api/satisfaction-survey
// Body: { answers: Record<string, unknown>, platform?: "web" | "mobile" }
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
    if (!token) return NextResponse.json({ error: "Acesso negado." }, { status: 401 });

    const supabase = serviceClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) return NextResponse.json({ error: "Acesso negado." }, { status: 401 });

    const { answers, platform } = await req.json() as { answers?: Record<string, unknown>; platform?: string };
    if (!answers || typeof answers !== "object" || Object.keys(answers).length === 0) {
      return NextResponse.json({ error: "Respostas ausentes." }, { status: 400 });
    }

    const { error } = await supabase.from("satisfaction_survey_responses").insert({
      therapist_id:    userData.user.id,
      therapist_name:  userData.user.user_metadata?.name ?? null,
      therapist_email: userData.user.email ?? null,
      answers,
      platform: platform ?? "web",
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
