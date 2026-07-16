import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getAIOptions, chat } from "@/lib/ai-client";
import { assertUnderUsageLimit, assertUnderRateLimit, logAiUsage, UsageLimitError, RateLimitError } from "@/lib/usage";

export const maxDuration = 60;

function serviceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const DOCUMENT_LABEL: Record<string, string> = {
  DOC_DECLARACAO_COMPARECIMENTO: "Declaração de comparecimento",
  DOC_RELATORIO_ACOMPANHAMENTO:  "Relatório de acompanhamento psicológico",
  DOC_ATESTADO_PSICOLOGICO:      "Atestado psicológico",
  DOC_ENCAMINHAMENTO:            "Encaminhamento",
};

const DEFAULT_PROMPTS: Record<string, string> = {
  DOC_DECLARACAO_COMPARECIMENTO: `Você redige declarações formais de comparecimento a sessões de acompanhamento psicológico, em português brasileiro, tom institucional e objetivo.
Use markdown. Certifique, em um ou dois parágrafos, que o cliente compareceu às sessões de acompanhamento psicológico no período informado, sem detalhar conteúdo clínico.
Não invente datas, assinaturas ou nomes de instituição — isso será adicionado separadamente.`,
  DOC_RELATORIO_ACOMPANHAMENTO: `Você redige relatórios formais de acompanhamento psicológico destinados a terceiros (escola, trabalho, justiça etc.), em português brasileiro, tom técnico e institucional.
Use markdown, com seções objetivas: contexto do acompanhamento, período, frequência, e considerações gerais sobre o processo — sem detalhar conteúdo sigiloso das sessões.
Não invente datas, assinaturas ou nomes de instituição — isso será adicionado separadamente.`,
  DOC_ATESTADO_PSICOLOGICO: `Você redige atestados psicológicos formais, em português brasileiro, tom clínico e institucional, curto e direto.
Certifique que o cliente está em acompanhamento psicológico, informando período e frequência, sem detalhar conteúdo clínico sigiloso.
Não invente datas, assinaturas, CRP ou nomes de instituição — isso será adicionado separadamente.`,
  DOC_ENCAMINHAMENTO: `Você redige cartas de encaminhamento formais para outro profissional ou especialidade, em português brasileiro, tom técnico e respeitoso ao sigilo clínico.
Use markdown. Explique de forma objetiva o motivo do encaminhamento e o contexto geral do acompanhamento, sem expor conteúdo sigiloso desnecessário.
Não invente datas, assinaturas, nomes de profissionais ou instituições — isso será adicionado separadamente.`,
};

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey } = getAIOptions(req);
    const { clientId, therapistId, documentType } = await req.json() as {
      clientId: string; therapistId: string; documentType: string;
    };

    if (!clientId || !therapistId || !documentType) {
      return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
    }
    if (!DOCUMENT_LABEL[documentType]) {
      return NextResponse.json({ error: "Tipo de documento inválido." }, { status: 400 });
    }

    try {
      await assertUnderRateLimit(therapistId);
      await assertUnderUsageLimit(therapistId);
    } catch (e) {
      if (e instanceof RateLimitError || e instanceof UsageLimitError) {
        return NextResponse.json({ error: e.message }, { status: 429 });
      }
      throw e;
    }

    const db = serviceClient();

    const { data: client } = await db
      .from("clients")
      .select("name, approach_label, start_date, total_sessions, main_demand, occupation, status")
      .eq("id", clientId)
      .eq("therapist_id", therapistId)
      .single() as {
        data: {
          name: string; approach_label: string | null; start_date: string | null;
          total_sessions: number; main_demand: string | null;
          occupation: string | null; status: string | null;
        } | null;
      };

    if (!client) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });

    const { data: authUserData } = await db.auth.admin.getUserById(therapistId);
    const therapistUser = authUserData?.user;
    const therapistName = therapistUser?.user_metadata?.name ?? therapistUser?.email ?? "—";

    const { data: promptRow } = await db
      .from("approach_prompts")
      .select("prompt")
      .eq("approach", documentType)
      .maybeSingle() as { data: { prompt: string } | null };

    const systemPrompt = promptRow?.prompt?.trim() || DEFAULT_PROMPTS[documentType];

    const userPrompt = `Terapeuta responsável: ${therapistName}
Cliente: ${client.name}
Abordagem terapêutica: ${client.approach_label ?? "não especificada"}
Início do acompanhamento: ${client.start_date ?? "não registrado"}
Total de sessões realizadas: ${client.total_sessions}
Status do acompanhamento: ${client.status === "ACTIVE" ? "ativo" : client.status ?? "não informado"}
Demanda principal: ${client.main_demand ?? "não registrada"}
Ocupação: ${client.occupation ?? "não informada"}

Gere o documento: ${DOCUMENT_LABEL[documentType]}`;

    const { text, inputTokens, outputTokens } = await chat({
      provider,
      apiKey,
      system:    systemPrompt,
      messages:  [{ role: "user", content: userPrompt }],
      maxTokens: 1500,
    });
    logAiUsage({ therapistId, provider, feature: "official_document", inputTokens, outputTokens }).catch(() => {});

    return NextResponse.json({
      documentText:  text,
      documentLabel: DOCUMENT_LABEL[documentType],
      clientName:    client.name,
    });
  } catch (error) {
    console.error("[official-document]", error);
    const message = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
