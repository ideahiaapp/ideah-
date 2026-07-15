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

const MOOD_LABEL = ["", "Muito difícil", "Difícil", "Neutro", "Produtivo", "Excelente"];

function periodToDate(period: string): string | null {
  const now = new Date();
  if (period === "1m")  { now.setMonth(now.getMonth() - 1); return now.toISOString().slice(0, 10); }
  if (period === "3m")  { now.setMonth(now.getMonth() - 3); return now.toISOString().slice(0, 10); }
  if (period === "6m")  { now.setMonth(now.getMonth() - 6); return now.toISOString().slice(0, 10); }
  if (period === "1y")  { now.setFullYear(now.getFullYear() - 1); return now.toISOString().slice(0, 10); }
  return null; // "all"
}

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey } = getAIOptions(req);
    const { clientId, therapistId, period } = await req.json() as {
      clientId: string; therapistId: string; period: string;
    };

    if (!clientId || !therapistId || !period) {
      return NextResponse.json({ error: "Parâmetros inválidos." }, { status: 400 });
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
    const since = periodToDate(period);

    // ── Cliente + anamnese ────────────────────────────────────
    const { data: client } = await db
      .from("clients")
      .select("name, approach_label, start_date, total_sessions, main_demand, occupation, birth_date")
      .eq("id", clientId)
      .eq("therapist_id", therapistId)
      .single() as {
        data: {
          name: string; approach_label: string | null; start_date: string | null;
          total_sessions: number; main_demand: string | null;
          occupation: string | null; birth_date: string | null;
        } | null;
      };

    if (!client) return NextResponse.json({ error: "Cliente não encontrado." }, { status: 404 });

    // ── Evoluções no período ──────────────────────────────────
    let evoQuery = db
      .from("evolutions")
      .select("session_date, content, hypothesis, interventions, next_session_plan, mood, ai_hypothesis, session_number")
      .eq("client_id", clientId)
      .eq("therapist_id", therapistId)
      .order("session_date", { ascending: true });

    if (since) evoQuery = evoQuery.gte("session_date", since);

    const { data: evolutions } = await evoQuery as {
      data: Array<{
        session_date: string; content: string; hypothesis: string | null;
        interventions: string | null; next_session_plan: string | null;
        mood: number | null; ai_hypothesis: string | null; session_number: number | null;
      }> | null;
    };

    if (!evolutions || evolutions.length === 0) {
      return NextResponse.json(
        { error: "Nenhuma evolução registrada para este cliente no período selecionado." },
        { status: 422 }
      );
    }

    // ── Supervisões no período ────────────────────────────────
    let supQuery = db
      .from("supervisions")
      .select("id, title, approach, updated_at")
      .eq("client_id", clientId)
      .eq("therapist_id", therapistId)
      .order("updated_at", { ascending: true });

    if (since) supQuery = supQuery.gte("updated_at", since);

    const { data: supervisions } = await supQuery as {
      data: Array<{ id: string; title: string; approach: string; updated_at: string }> | null;
    };

    // Mensagens das supervisões (para extrair o conteúdo clínico)
    let supervisionContext = "";
    if (supervisions && supervisions.length > 0) {
      const supIds = supervisions.map(s => s.id);
      const { data: messages } = await db
        .from("supervision_messages")
        .select("supervision_id, role, content, created_at")
        .in("supervision_id", supIds)
        .eq("role", "assistant") // só respostas da IA, que têm o conteúdo clínico
        .order("created_at", { ascending: true }) as {
          data: Array<{ supervision_id: string; role: string; content: string; created_at: string }> | null;
        };

      if (messages && messages.length > 0) {
        supervisionContext = `\n\nSUPERVISÕES DE IA NO PERÍODO (respostas clínicas geradas):\n` +
          supervisions.map(sup => {
            const supMsgs = messages.filter(m => m.supervision_id === sup.id);
            if (supMsgs.length === 0) return null;
            return `[${sup.approach} — ${sup.title}]\n` +
              supMsgs.map(m => `• ${m.content.slice(0, 400)}`).join("\n");
          }).filter(Boolean).join("\n\n");
      }
    }

    // ── Monta o contexto das evoluções ────────────────────────
    const evoLines = evolutions.map((e, i) => {
      const num  = e.session_number ?? i + 1;
      const mood = e.mood ? `Tom: ${MOOD_LABEL[e.mood]} (${e.mood}/5)` : "";
      const hyp  = e.hypothesis    ? `Hipótese do terapeuta: ${e.hypothesis}` : "";
      const intv = e.interventions ? `Intervenções: ${e.interventions}` : "";
      const plan = e.next_session_plan ? `Plano: ${e.next_session_plan}` : "";
      const aiHyp = e.ai_hypothesis ? `Hipótese IA: ${e.ai_hypothesis.slice(0, 200)}` : "";
      return [
        `--- Sessão ${num} (${e.session_date}) ${mood}`,
        `Relato: ${e.content}`,
        hyp, intv, plan, aiHyp,
      ].filter(Boolean).join("\n");
    }).join("\n\n");

    const firstDate = evolutions[0].session_date;
    const lastDate  = evolutions[evolutions.length - 1].session_date;

    const PERIOD_LABEL: Record<string, string> = {
      "1m": "último mês", "3m": "últimos 3 meses",
      "6m": "últimos 6 meses", "1y": "último ano", "all": "todo o período de atendimento",
    };

    const systemPrompt = `Você é um psicólogo supervisor clínico experiente, com amplo conhecimento em diversas abordagens psicoterapêuticas.
Sua tarefa é gerar um relatório de evolução clínica detalhado e humanizado para apoiar o terapeuta na compreensão do processo terapêutico do cliente.
O relatório deve ser escrito em português brasileiro, em linguagem clínica mas acessível, com sensibilidade e profundidade.
Use markdown para estruturar o relatório. Inclua obrigatoriamente estas seções:

# Relatório de Evolução Clínica — [Nome do Cliente]

## Síntese do Período
(Visão geral do processo terapêutico no período analisado, 3-5 frases)

## Evolução Observada
(Como o cliente evoluiu ao longo das sessões? O que mudou?)

## Temas e Padrões Recorrentes
(Quais temas, emoções ou padrões comportamentais apareceram com mais frequência?)

## Hipóteses Clínicas
(Hipóteses sobre a dinâmica psíquica ou funcionamento do cliente)

## Conquistas e Recursos
(O que de positivo emergiu no processo? Quais recursos o cliente demonstrou?)

## Pontos de Atenção
(O que ainda precisa de trabalho? Resistências, padrões que persistem?)

## Recomendações Clínicas
(Sugestões objetivas para as próximas sessões, intervenções ou encaminhamentos)

## Indicadores de Progresso
(Avalie de 1-10: Engajamento, Insight, Regulação emocional, Funcionalidade)`;

    const userPrompt = `Cliente: ${client.name}
Abordagem terapêutica: ${client.approach_label ?? "não especificada"}
Demanda principal: ${client.main_demand ?? "não registrada"}
Ocupação: ${client.occupation ?? "não informada"}
Início do acompanhamento: ${client.start_date ?? "não registrado"}
Total geral de sessões: ${client.total_sessions}
Período analisado: ${PERIOD_LABEL[period]} (${firstDate} a ${lastDate})
Sessões analisadas: ${evolutions.length}

EVOLUÇÕES DE SESSÃO:
${evoLines}${supervisionContext}`;

    const { text, inputTokens, outputTokens } = await chat({
      provider,
      apiKey,
      system:    systemPrompt,
      messages:  [{ role: "user", content: userPrompt }],
      maxTokens: 3000,
    });
    logAiUsage({ therapistId, provider, feature: "clinical_evolution_report", inputTokens, outputTokens }).catch(() => {});

    return NextResponse.json({
      report:       text,
      clientName:   client.name,
      sessionCount: evolutions.length,
      period:       PERIOD_LABEL[period],
      dateRange:    `${firstDate} a ${lastDate}`,
    });
  } catch (error) {
    console.error("[clinical-evolution]", error);
    const message = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
