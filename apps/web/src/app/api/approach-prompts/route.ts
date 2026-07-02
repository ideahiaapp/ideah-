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
    .from("approach_prompts")
    .select("approach, prompt, updated_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prompts: data ?? [] }, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PUT(req: NextRequest) {
  const adminEmail = req.headers.get("x-admin-email")?.toLowerCase().trim();
  if (!ADMIN_EMAILS.includes(adminEmail ?? "")) {
    return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
  }

  const { approach, prompt } = await req.json();
  if (!approach || !prompt) {
    return NextResponse.json({ error: "approach e prompt são obrigatórios." }, { status: 400 });
  }

  const supabase = serviceClient();
  const { error } = await supabase
    .from("approach_prompts")
    .upsert({ approach, prompt, updated_at: new Date().toISOString() }, { onConflict: "approach" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
