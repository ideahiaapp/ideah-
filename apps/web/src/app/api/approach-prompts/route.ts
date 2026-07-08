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
  try {
    await requireAdmin(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
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
