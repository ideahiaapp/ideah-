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
  { params }: { params: { id: string } }
) {
  try {
    const supabase = serviceClient();
    const { data, error } = await supabase
      .from("anamneses")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !data) return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
    return NextResponse.json({ anamnese: data });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await req.json();
    if (!["ACCEPTED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }

    const supabase = serviceClient();
    const { error } = await supabase
      .from("anamneses")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", params.id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
