import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getAIOptions, chat } from "@/lib/ai-client";
import { assertUnderUsageLimit, assertUnderRateLimit, logAiUsage, UsageLimitError, RateLimitError } from "@/lib/usage";

export const maxDuration = 60;

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const PERIOD_MONTHS: Record<string, number> = { "1m": 1, "3m": 3, "6m": 6, "1y": 12 };

const PERIOD_LABEL: Record<string, string> = {
  "1m": "1 mês", "3m": "3 meses", "6m": "6 meses", "1y": "1 ano",
};

const APPROACH_LABEL: Record<string, string> = {
  PSYCHOANALYSIS: "Psicanálise Freudiana", COGNITIVE_BEHAVIORAL: "TCC",
  JUNGIAN: "Junguiana", SOMATIC: "Somática / Corporal", TANTRA: "Sexualidade Humana e Tantra",
  GESTALT: "Gestalt-terapia", PSYCHODRAMA: "Psicodrama", SYSTEMIC: "Constelação Familiar",
  NAO_INFORMADO: "Não informada",
};

function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const DEFAULT_CERTIFICATE_PROMPT = `Você é responsável por redigir certificados formais de horas de supervisão clínica para terapeutas.
Com base nos dados fornecidos, redija um certificado de supervisão em português brasileiro, em tom formal e institucional, adequado para ser impresso ou enviado ao terapeuta.
Use markdown. Inclua obrigatoriamente:

# Certificado de Supervisão

Um parágrafo formal certificando que o terapeuta realizou as horas de supervisão informadas, por abordagem teórica, no período indicado.

## Discriminação por Abordagem Teórica
(Liste cada abordagem com o total de horas e número de sessões)

## Carga Horária Total
(Total geral de horas e sessões no período)

Finalize com uma frase de encerramento formal, sem inventar nomes de instituição, assinatura ou data — isso será adicionado separadamente.`;

// GET /api/certificate?therapistId=&period=1m|3m|6m|1y&reportType=sintetico|detalhado
// Funcionalidade disponível para qualquer terapeuta autenticado — mas quem não é
// admin só pode gerar o próprio certificado (therapistId é sobrescrito com o id
// do usuário autenticado).
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
    if (!token) return NextResponse.json({ error: "Acesso negado." }, { status: 401 });

    const supabase = serviceClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) return NextResponse.json({ error: "Acesso negado." }, { status: 401 });

    const requesterId = userData.user.id;
    const requesterEmail = userData.user.email?.toLowerCase().trim();
    const { data: adminRow } = await supabase.from("admins").select("email").eq("email", requesterEmail).maybeSingle();
    const isAdmin = !!adminRow;

    let therapistId = req.nextUrl.searchParams.get("therapistId");
    const period     = req.nextUrl.searchParams.get("period");
    const reportType = req.nextUrl.searchParams.get("reportType");

    if (!isAdmin) therapistId = requesterId; // não-admin só vê o próprio certificado

    if (!therapistId || !period || !reportType) {
      return NextResponse.json({ error: "therapistId, period e reportType são obrigatórios." }, { status: 400 });
    }
    const months = PERIOD_MONTHS[period];
    if (!months) {
      return NextResponse.json({ error: "period inválido. Use 1m, 3m, 6m ou 1y." }, { status: 400 });
    }
    if (reportType !== "sintetico" && reportType !== "detalhado") {
      return NextResponse.json({ error: "reportType inválido. Use sintetico ou detalhado." }, { status: 400 });
    }

    const { provider, apiKey } = getAIOptions(req);

    try {
      await assertUnderRateLimit(requesterId);
      await assertUnderUsageLimit(requesterId);
    } catch (e) {
      if (e instanceof RateLimitError || e instanceof UsageLimitError) {
        return NextResponse.json({ error: e.message }, { status: 429 });
      }
      throw e;
    }

    const end = new Date();
    const start = new Date();
    start.setMonth(start.getMonth() - months);
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    const { data: rows, error } = await supabase
      .from("evolutions")
      .select("*, clients(name)")
      .eq("therapist_id", therapistId)
      .gte("session_date", startStr)
      .lte("session_date", endStr)
      .order("session_date", { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const evolutions = rows ?? [];

    const byApproach = new Map<string, { totalSeconds: number; count: number }>();
    for (const ev of evolutions) {
      const key = ev.approach ?? "NAO_INFORMADO";
      const cur = byApproach.get(key) ?? { totalSeconds: 0, count: 0 };
      cur.totalSeconds += ev.duration_seconds ?? 0;
      cur.count += 1;
      byApproach.set(key, cur);
    }
    const synthesis = Array.from(byApproach.entries())
      .map(([approach, v]) => ({ approach, totalSeconds: v.totalSeconds, count: v.count }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds);

    const totalSeconds = evolutions.reduce((sum, ev) => sum + (ev.duration_seconds ?? 0), 0);

    const { data: authUserData } = await supabase.auth.admin.getUserById(therapistId);
    const therapistUser = authUserData?.user;
    // "||" (não "??") de propósito: user_metadata.name pode vir como string vazia, não só null/undefined.
    const therapistName = therapistUser?.user_metadata?.name?.trim() || therapistUser?.email || "—";

    // Prompt cadastrado pelo admin na aba "Certificado" de Prompts, com fallback para o padrão acima.
    const { data: promptRow } = await supabase
      .from("approach_prompts")
      .select("prompt")
      .eq("approach", "CERTIFICATE")
      .maybeSingle() as { data: { prompt: string } | null };

    const systemPrompt = promptRow?.prompt?.trim() || DEFAULT_CERTIFICATE_PROMPT;

    const synthesisLines = synthesis.length > 0
      ? synthesis.map(row =>
          `- ${APPROACH_LABEL[row.approach] ?? row.approach}: ${formatDuration(row.totalSeconds)} (${row.count} sessão(ões))`
        ).join("\n")
      : "Nenhuma supervisão registrada no período.";

    const detailLines = reportType === "detalhado"
      ? evolutions.map(ev =>
          `- ${(ev.clients as { name?: string } | null)?.name ?? "Cliente"} — ${ev.session_date} — ` +
          `${APPROACH_LABEL[ev.approach ?? "NAO_INFORMADO"] ?? ev.approach} — ${formatDuration(ev.duration_seconds ?? 0)}`
        ).join("\n")
      : "";

    const userPrompt = `Terapeuta: ${therapistName}
Período: ${PERIOD_LABEL[period]} (${startStr} a ${endStr})
Tipo de relatório: ${reportType}

HORAS DE SUPERVISÃO POR ABORDAGEM:
${synthesisLines}

TOTAL GERAL: ${formatDuration(totalSeconds)} em ${evolutions.length} sessão(ões)
${detailLines ? `\nSUPERVISÕES REALIZADAS NO PERÍODO:\n${detailLines}` : ""}`;

    const { text: certificateText, inputTokens, outputTokens } = await chat({
      provider,
      apiKey,
      system:    systemPrompt,
      messages:  [{ role: "user", content: userPrompt }],
      maxTokens: 2000,
    });
    logAiUsage({ therapistId: requesterId, provider, feature: "certificate", inputTokens, outputTokens }).catch(() => {});

    const responseBody: Record<string, unknown> = {
      therapist: {
        id: therapistId,
        name: therapistName,
        email: therapistUser?.email ?? "—",
      },
      period: { start: startStr, end: endStr },
      synthesis,
      totalSeconds,
      totalSessions: evolutions.length,
      certificateText,
    };

    if (reportType === "detalhado") {
      responseBody.evolutions = evolutions.map(ev => ({
        id:              ev.id,
        clientName:      (ev.clients as { name?: string } | null)?.name ?? "—",
        sessionDate:     ev.session_date,
        sessionTime:     ev.session_time,
        approach:        ev.approach,
        durationSeconds: ev.duration_seconds,
        content:         ev.content,
        hypothesis:      ev.hypothesis,
        nextSessionPlan: ev.next_session_plan,
      }));
    }

    return NextResponse.json(responseBody);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
