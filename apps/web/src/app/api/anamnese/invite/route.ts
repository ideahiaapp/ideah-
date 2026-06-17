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
    const { therapistId, patientEmail } = await req.json();

    if (!therapistId || !patientEmail) {
      return NextResponse.json({ error: "Dados obrigatórios ausentes." }, { status: 400 });
    }

    const supabase = serviceClient();
    const { data: therapist } = await supabase
      .from("profiles")
      .select("name")
      .eq("id", therapistId)
      .single();

    const origin = req.headers.get("origin") ?? "";
    const anamneseUrl = `${origin}/anamnese/${therapistId}`;

    await sendAnamneseInvite({
      patientEmail,
      therapistName: therapist?.name ?? "Seu terapeuta",
      anamneseUrl,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
