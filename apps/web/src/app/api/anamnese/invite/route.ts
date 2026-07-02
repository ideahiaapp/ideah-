import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendAnamneseInvite } from "@/lib/email";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const { therapistId, clientId, patientEmail } = await req.json();

    if (!therapistId || (!clientId && !patientEmail)) {
      return NextResponse.json({ error: "Dados obrigatórios ausentes." }, { status: 400 });
    }

    const supabase = serviceClient();
    const { data: therapist } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", therapistId)
      .single();

    const origin = req.headers.get("origin") ?? "";

    let anamneseUrl: string;
    let toEmail: string;

    if (clientId) {
      const { data: client } = await supabase
        .from("clients")
        .select("id, email, therapist_id")
        .eq("id", clientId)
        .single();

      if (!client || client.therapist_id !== therapistId || !client.email) {
        return NextResponse.json({ error: "Cliente não encontrado ou sem e-mail cadastrado." }, { status: 404 });
      }

      anamneseUrl = `${origin}/anamnese/preencher/${client.id}`;
      toEmail = client.email;
    } else {
      anamneseUrl = `${origin}/anamnese/${therapistId}`;
      toEmail = patientEmail;
    }

    await sendAnamneseInvite({
      patientEmail: toEmail,
      therapistName: therapist?.name ?? "Seu terapeuta",
      anamneseUrl,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
