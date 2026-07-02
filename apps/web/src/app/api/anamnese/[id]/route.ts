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

// PUT /api/anamnese/[id] — terapeuta edita os dados da anamnese
// Nome, e-mail, telefone e data de nascimento vêm sempre do cadastro do cliente vinculado.
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const fields = await req.json();
    const supabase = serviceClient();

    const { data: client } = await supabase
      .from("clients")
      .select("name, email, phone, birth_date")
      .eq("anamnese_id", params.id)
      .single();

    if (!client) {
      return NextResponse.json({ error: "Cliente vinculado não encontrado." }, { status: 404 });
    }

    const { error } = await supabase
      .from("anamneses")
      .update({
        email: client.email,
        name: client.name,
        phone: client.phone || null,
        birth_date: client.birth_date || null,
        cpf: fields.cpf || null,
        emergency_contact: fields.emergency_contact || null,
        how_found: fields.how_found || null,
        conditions: fields.conditions ?? [],
        latex_allergy: fields.latex_allergy ?? false,
        oil_allergy: fields.oil_allergy || null,
        medication: fields.medication || null,
        emotional_state: fields.emotional_state || null,
        body_pain: fields.body_pain || null,
        intention: fields.intention || null,
        sexual_discomfort: fields.sexual_discomfort || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id);

    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
