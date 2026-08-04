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

export async function GET(
  _req: NextRequest,
  { params }: { params: { approach: string } }
) {
  try {
    const supabase = serviceClient();
    const { data, error } = await supabase
      .from("anamnese_templates")
      .select("content")
      .eq("approach", params.approach)
      .single();

    if (error || !data) {
      return NextResponse.json({ content: null }, { headers: { "Cache-Control": "no-store" } });
    }

    return NextResponse.json(
      { content: data.content },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json({ content: null }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { approach: string } }
) {
  try {
    await requireAdmin(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }

  const { content } = await req.json();
  if (typeof content !== "string" || !content.trim()) {
    return NextResponse.json({ error: "content é obrigatório." }, { status: 400 });
  }

  const supabase = serviceClient();
  const { error } = await supabase
    .from("anamnese_templates")
    .upsert({ approach: params.approach, content, updated_at: new Date().toISOString() }, { onConflict: "approach" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
