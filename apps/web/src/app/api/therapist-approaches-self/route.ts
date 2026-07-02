import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// PUT /api/therapist-approaches-self
// Usado no cadastro (sem sessão) e em self-service no settings
// Body: { userId, approaches: string[] }
export async function PUT(req: NextRequest) {
  const body = await req.json() as { userId?: string; approaches?: string[] };
  const { userId, approaches } = body;

  if (!userId || !Array.isArray(approaches)) {
    return NextResponse.json({ error: "userId e approaches são obrigatórios." }, { status: 400 });
  }

  const supabase = serviceClient();

  const { error: delErr } = await supabase
    .from("therapist_approaches")
    .delete()
    .eq("therapist_id", userId);

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  if (approaches.length > 0) {
    const rows = approaches.map(approach => ({ therapist_id: userId, approach }));
    const { error: insErr } = await supabase.from("therapist_approaches").insert(rows);
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
