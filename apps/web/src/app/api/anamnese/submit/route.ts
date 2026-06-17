import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendAnamneseNotification, sendAnamneseConfirmation } from "@/lib/email";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { therapistId, ...fields } = body;

    if (!therapistId || !fields.name || !fields.email) {
      return NextResponse.json({ error: "Dados obrigatórios ausentes." }, { status: 400 });
    }

    const supabase = serviceClient();

    // Busca dados do terapeuta
    const { data: therapist } = await supabase
      .from("profiles")
      .select("name, email")
      .eq("id", therapistId)
      .single();

    // Salva anamnese
    const { data: anamnese, error } = await supabase
      .from("anamneses")
      .insert({
        therapist_id: therapistId,
        email: fields.email,
        name: fields.name,
        phone: fields.phone || null,
        cpf: fields.cpf || null,
        birth_date: fields.birth_date || null,
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
        status: "PENDING",
      })
      .select("id")
      .single();

    if (error || !anamnese) {
      throw new Error(error?.message ?? "Erro ao salvar anamnese.");
    }

    // Envia emails em paralelo (não bloqueia resposta se falhar)
    if (therapist) {
      Promise.all([
        sendAnamneseNotification({
          therapistEmail: therapist.email!,
          therapistName: therapist.name ?? "Terapeuta",
          clientName: fields.name,
          clientEmail: fields.email,
          intention: fields.intention ?? "",
          anamneseId: anamnese.id,
        }),
        sendAnamneseConfirmation({
          clientEmail: fields.email,
          clientName: fields.name,
          therapistName: therapist.name ?? "Terapeuta",
        }),
      ]).catch(err => console.warn("Email error (non-critical):", err));
    }

    return NextResponse.json({ ok: true, anamneseId: anamnese.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
