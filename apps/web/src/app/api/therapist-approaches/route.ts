import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin, AdminAuthError } from "@/lib/adminAuth";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/therapist-approaches?therapistId=xxx
export async function GET(req: NextRequest) {
  const therapistId = req.nextUrl.searchParams.get("therapistId");
  if (!therapistId) return NextResponse.json({ approaches: [] });

  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("therapist_approaches")
    .select("approach")
    .eq("therapist_id", therapistId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ approaches: (data ?? []).map(d => d.approach) });
}

// PUT /api/therapist-approaches — admin sets full list for a therapist
// Body: { therapistId, approaches: string[] }
export async function PUT(req: NextRequest) {
  try {
    await requireAdmin(req);
  } catch (e) {
    if (e instanceof AdminAuthError) return NextResponse.json({ error: e.message }, { status: 403 });
    throw e;
  }

  const { therapistId, approaches } = await req.json() as { therapistId: string; approaches: string[] };
  if (!therapistId || !Array.isArray(approaches)) {
    return NextResponse.json({ error: "therapistId e approaches são obrigatórios." }, { status: 400 });
  }

  const supabase = serviceClient();
  const { error: delErr } = await supabase
    .from("therapist_approaches")
    .delete()
    .eq("therapist_id", therapistId);
  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });

  if (approaches.length > 0) {
    const rows = approaches.map(approach => ({ therapist_id: therapistId, approach }));
    const { error: insErr } = await supabase.from("therapist_approaches").insert(rows);
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
