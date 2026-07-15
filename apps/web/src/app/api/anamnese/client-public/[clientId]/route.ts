import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/anamnese/client-public/[clientId] — dados públicos mínimos para pré-preencher o link de anamnese
export async function GET(
  _req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const supabase = serviceClient();
    const { data: client, error } = await supabase
      .from("clients")
      .select("id, name, email, phone, birth_date, therapist_id")
      .eq("id", params.clientId)
      .single();

    if (error || !client) return NextResponse.json({ error: "Link inválido." }, { status: 404 });

    const { data: therapist } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", client.therapist_id)
      .single();

    return NextResponse.json({
      client: {
        id: client.id,
        name: client.name ?? "",
        email: client.email ?? "",
        phone: client.phone ?? "",
        birth_date: client.birth_date ?? "",
      },
      therapistName: therapist?.name ?? "seu terapeuta",
    });
  } catch {
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }
}

// PUT /api/anamnese/client-public/[clientId] — cliente preenche/atualiza a própria anamnese
export async function PUT(
  req: NextRequest,
  { params }: { params: { clientId: string } }
) {
  try {
    const fields = await req.json();
    if (!fields.name?.trim() || !fields.email?.trim()) {
      return NextResponse.json({ error: "Nome e e-mail são obrigatórios." }, { status: 400 });
    }

    const supabase = serviceClient();
    const { data: client, error: clientErr } = await supabase
      .from("clients")
      .select("id, therapist_id, anamnese_id")
      .eq("id", params.clientId)
      .single();

    if (clientErr || !client) {
      return NextResponse.json({ error: "Link inválido." }, { status: 404 });
    }

    // Atualiza dados pessoais no cadastro do cliente, caso o cliente tenha corrigido algo
    await supabase
      .from("clients")
      .update({
        name: fields.name.trim(),
        email: fields.email.trim(),
        phone: fields.phone?.trim() || null,
        birth_date: fields.birth_date || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", client.id);

    const anamneseFields = {
      therapist_id: client.therapist_id,
      email: fields.email.trim(),
      name: fields.name.trim(),
      phone: fields.phone?.trim() || null,
      birth_date: fields.birth_date || null,
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
      approach: fields.approach || null,
      template_answers: fields.template_answers ?? null,
      status: "PENDING",
      updated_at: new Date().toISOString(),
    };

    if (client.anamnese_id) {
      const { error } = await supabase
        .from("anamneses")
        .update(anamneseFields)
        .eq("id", client.anamnese_id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, anamneseId: client.anamnese_id });
    }

    const { data: anamnese, error: insErr } = await supabase
      .from("anamneses")
      .insert(anamneseFields)
      .select("id")
      .single();

    if (insErr || !anamnese) {
      return NextResponse.json({ error: insErr?.message ?? "Erro ao salvar anamnese." }, { status: 500 });
    }

    await supabase
      .from("clients")
      .update({ anamnese_id: anamnese.id })
      .eq("id", client.id);

    return NextResponse.json({ ok: true, anamneseId: anamnese.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
