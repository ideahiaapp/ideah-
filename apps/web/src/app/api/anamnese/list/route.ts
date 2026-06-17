import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const therapistId = searchParams.get("therapistId");
    const status = searchParams.get("status");

    if (!therapistId) {
      return NextResponse.json({ error: "therapistId obrigatório." }, { status: 400 });
    }

    const supabase = serviceClient();
    let query = supabase
      .from("anamneses")
      .select("*")
      .eq("therapist_id", therapistId)
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const email = searchParams.get("email");
    if (email) query = query.eq("email", email);

    const { data, error } = await query;

    if (error) throw new Error(error.message);
    return NextResponse.json({ anamneses: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
