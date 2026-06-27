import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/therapist-approaches?email=xxx
// Retorna as bases adquiridas pelo terapeuta-cliente identificado pelo email
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) return NextResponse.json({ approaches: [] });

  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("clients")
    .select("purchased_approaches")
    .ilike("email", email)
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const approaches: string[] = data?.purchased_approaches ?? [];
  return NextResponse.json({ approaches });
}
