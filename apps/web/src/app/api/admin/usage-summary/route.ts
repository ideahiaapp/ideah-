import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const ADMIN_EMAILS = ["carlos.magno@gmail.com", "betinha.potter@gmail.com", "elimarcia.philos@gmail.com"];

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function monthStartIso(): string {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export async function GET(req: NextRequest) {
  const adminEmail = req.headers.get("x-admin-email")?.toLowerCase().trim();
  if (!ADMIN_EMAILS.includes(adminEmail ?? "")) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const supabase = serviceClient();

  const [{ data: profiles }, { data: limits }, { data: usage }] = await Promise.all([
    supabase.from("profiles").select("id, name, email, plan") as unknown as Promise<{
      data: Array<{ id: string; name: string | null; email: string | null; plan: string }> | null;
    }>,
    supabase.from("plan_limits").select("plan, monthly_token_limit") as unknown as Promise<{
      data: Array<{ plan: string; monthly_token_limit: number }> | null;
    }>,
    supabase
      .from("ai_usage_log")
      .select("therapist_id, input_tokens, output_tokens")
      .gte("created_at", monthStartIso()) as unknown as Promise<{
        data: Array<{ therapist_id: string; input_tokens: number; output_tokens: number }> | null;
      }>,
  ]);

  const limitByPlan = new Map((limits ?? []).map(l => [l.plan, l.monthly_token_limit]));
  const usedByTherapist = new Map<string, number>();
  (usage ?? []).forEach(u => {
    const total = u.input_tokens + u.output_tokens;
    usedByTherapist.set(u.therapist_id, (usedByTherapist.get(u.therapist_id) ?? 0) + total);
  });

  const summary = (profiles ?? []).map(p => ({
    id:    p.id,
    name:  p.name,
    email: p.email,
    plan:  p.plan,
    used:  usedByTherapist.get(p.id) ?? 0,
    limit: limitByPlan.get(p.plan) ?? 0,
  })).sort((a, b) => b.used - a.used);

  return NextResponse.json({ summary }, {
    headers: { "Cache-Control": "no-store" },
  });
}
