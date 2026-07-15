import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import { getAIOptions, chat } from "@/lib/ai-client";
import { assertUnderUsageLimit, assertUnderRateLimit, logAiUsage, UsageLimitError, RateLimitError } from "@/lib/usage";

export const maxDuration = 30;

function serviceClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = serviceClient();
    const { clientId, therapistId } = await req.json();
    if (!clientId || !therapistId) {
      return NextResponse.json({ error: "clientId e therapistId são obrigatórios." }, { status: 400 });
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

    // Busca cliente
    const { data: client } = await supabaseAdmin
      .from("clients")
      .select("name, approach_label, start_date, total_sessions, main_demand")
      .eq("id", clientId)
      .eq("therapist_id", therapistId)
      .single() as { data: { name: string; approach_label: string | null; start_date: string | null; total_sessions: number; main_demand: string | null } | null };

    if (!client) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });

    // Busca todas as evoluções do cliente, ordenadas por data
    const { data: evolutions } = await supabaseAdmin
      .from("evolutions")
      .select("session_date, content, hypothesis, next_session_plan, mood, ai_hypothesis, session_number")
      .eq("client_id", clientId)
      .eq("therapist_id", therapistId)
      .order("session_date", { ascending: true }) as { data: Array<{
        session_date: string;
        content: string;
        hypothesis: string | null;
        next_session_plan: string | null;
        mood: number | null;
        ai_hypothesis: string | null;
        session_number: number | null;
      }> | null };

    if (!evolutions || evolutions.length === 0) {
      return NextResponse.json({ error: "Nenhuma evolução registrada para este cliente." }, { status: 422 });
    }

    // Monta contexto das evoluções
    const MOOD_LABEL = ["", "Muito difícil", "Difícil", "Neutro", "Produtivo", "Excelente"];
    const evoLines = evolutions.map((e, i) => {
      const num = e.session_number ?? i + 1;
      const mood = e.mood ? `Tom: ${MOOD_LABEL[e.mood]} (${e.mood}/5)` : "";
      const hyp  = e.hypothesis ? `Hipótese: ${e.hypothesis}` : "";
      const plan = e.next_session_plan ? `Plano: ${e.next_session_plan}` : "";
      return [
        `--- Sessão ${num} (${e.session_date}) ${mood}`,
        `Relato: ${e.content}`,
        hyp, plan,
      ].filter(Boolean).join("\n");
    }).join("\n\n");

    const firstDate = evolutions[0].session_date;
    const lastDate  = evolutions[evolutions.length - 1].session_date;

    const systemPrompt = `Você é um supervisor clínico experiente auxiliando um psicoterapeuta a avaliar o progresso de seus clientes.
Analise as evoluções de sessão fornecidas e gere um prospecto clínico objetivo e humanizado.
Responda APENAS com um JSON válido, sem markdown, no seguinte formato:
{
  "verdict": "evoluiu" | "estável" | "regrediu",
  "score": <número de 1 a 10 representando o progresso geral>,
  "summary": "<parágrafo conciso de 3-5 frases descrevendo o arco terapêutico do cliente>",
  "mood_trend": "crescente" | "estável" | "decrescente",
  "key_themes": ["<tema 1>", "<tema 2>", "<tema 3>"],
  "strengths": "<pontos de evolução positiva observados>",
  "challenges": "<pontos de atenção ou resistência observados>",
  "recommendation": "<sugestão clínica para as próximas sessões>"
}`;

    const userPrompt = `Cliente: ${client.name}
Abordagem: ${client.approach_label ?? "não especificada"}
Demanda principal: ${client.main_demand ?? "não registrada"}
Período: ${firstDate} a ${lastDate}
Total de sessões analisadas: ${evolutions.length}

EVOLUÇÕES:
${evoLines}`;

    const { provider, apiKey } = getAIOptions(req);
    const { text: raw, inputTokens, outputTokens } = await chat({
      provider,
      apiKey,
      system:    systemPrompt,
      messages:  [{ role: "user", content: userPrompt }],
      maxTokens: 1024,
    });
    logAiUsage({ therapistId, provider, feature: "patient_prospect", inputTokens, outputTokens }).catch(() => {});
    const result = JSON.parse(raw);

    return NextResponse.json({
      ...result,
      clientName:    client.name,
      sessionCount:  evolutions.length,
      period:        `${firstDate} a ${lastDate}`,
    });
  } catch (error) {
    console.error("[patient-prospect]", error);
    const message = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
