import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// POST /api/anamnese/create-for-client
// Terapeuta preenche anamnese diretamente para um cliente já cadastrado, sem anamnese vinculada.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { therapistId, clientId, ...fields } = body;

    if (!therapistId || !clientId) {
      return NextResponse.json({ error: "Dados obrigatórios ausentes." }, { status: 400 });
    }

    const supabase = serviceClient();

    const { data: client } = await supabase
      .from("clients")
      .select("id, therapist_id, name, email, phone, birth_date")
      .eq("id", clientId)
      .single();

    if (!client || client.therapist_id !== therapistId) {
      return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });
    }
    if (!client.name || !client.email) {
      return NextResponse.json({ error: "Cliente precisa ter nome e e-mail cadastrados." }, { status: 400 });
    }

    const { data: anamnese, error: insErr } = await supabase
      .from("anamneses")
      .insert({
        therapist_id: therapistId,
        email: client.email,
        name: client.name,
        phone: client.phone || null,
        birth_date: client.birth_date || null,
        cpf: fields.cpf || null,
        emergency_contact: fields.emergency_contact || null,
        how_found: fields.how_found || null,
        accepts_email: fields.accepts_email ?? true,
        conditions: fields.conditions ?? [],
        latex_allergy: fields.latex_allergy ?? false,
        oil_allergy: fields.oil_allergy || null,
        medication: fields.medication || null,
        emotional_state: fields.emotional_state || null,
        body_pain: fields.body_pain || null,
        intention: fields.intention || null,
        sexual_discomfort: fields.sexual_discomfort || null,
        consent_nudity: fields.consent_nudity ?? false,
        consent_touch: fields.consent_touch ?? false,
        consent_therapeutic: fields.consent_therapeutic ?? false,
        consent_payment: fields.consent_payment ?? false,
        status: "ACCEPTED",
      })
      .select("id")
      .single();

    if (insErr || !anamnese) {
      return NextResponse.json({ error: insErr?.message ?? "Erro ao salvar anamnese." }, { status: 500 });
    }

    const { error: updErr } = await supabase
      .from("clients")
      .update({ anamnese_id: anamnese.id, updated_at: new Date().toISOString() })
      .eq("id", clientId);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ ok: true, anamneseId: anamnese.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
