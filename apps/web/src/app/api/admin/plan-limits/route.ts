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

export async function GET() {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("plan_limits")
    .select("plan, monthly_token_limit, updated_at")
    .order("plan");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ limits: data ?? [] }, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PUT(req: NextRequest) {
  const adminEmail = req.headers.get("x-admin-email")?.toLowerCase().trim();
  if (!ADMIN_EMAILS.includes(adminEmail ?? "")) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { plan, monthlyTokenLimit } = await req.json();
  if (!plan || !monthlyTokenLimit || monthlyTokenLimit <= 0) {
    return NextResponse.json({ error: "plan e monthlyTokenLimit (> 0) são obrigatórios." }, { status: 400 });
  }

  const supabase = serviceClient();
  const { error } = await supabase
    .from("plan_limits")
    .upsert(
      { plan, monthly_token_limit: monthlyTokenLimit, updated_at: new Date().toISOString() } as object,
      { onConflict: "plan" }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
