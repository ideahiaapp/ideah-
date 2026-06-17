import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { therapistId: string } }
) {
  try {
    const supabase = serviceClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, email")
      .eq("id", params.therapistId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Terapeuta não encontrado." }, { status: 404 });
    }

    return NextResponse.json({ therapist: data });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}
