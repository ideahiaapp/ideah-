import { NextRequest, NextResponse } from "next/server";
import { getAIOptions, chat } from "@/lib/ai-client";
import { assertUnderUsageLimit, assertUnderRateLimit, logAiUsage, UsageLimitError, RateLimitError } from "@/lib/usage";

export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey } = getAIOptions(req);
    const { content, approach, clientName, therapistId } = await req.json();

    if (!content || content.trim().length < 20) {
      return NextResponse.json({ error: "Conteúdo muito curto" }, { status: 400 });
    }

    if (therapistId) {
      try {
        await assertUnderRateLimit(therapistId);
        await assertUnderUsageLimit(therapistId);
      } catch (e) {
        if (e instanceof RateLimitError || e instanceof UsageLimitError) {
          return NextResponse.json({ error: e.message }, { status: 429 });
        }
        throw e;
      }
    }

    const systemPrompt = `Você é um supervisor clínico experiente. Com base no relato de sessão fornecido pelo terapeuta, gere uma hipótese clínica concisa e fundamentada teoricamente.

Abordagem de referência: ${approach || "não especificada"}.
Cliente: ${clientName || "paciente"}.

Responda em formato JSON com exatamente esta estrutura:
{
  "hypothesis": "Uma frase direta de hipótese clínica (máx. 15 palavras)",
  "elaboration": "Elaboração em 2-3 frases com embasamento teórico e referência de autor/obra quando pertinente",
  "attentionPoints": ["ponto de atenção 1", "ponto de atenção 2"],
  "nextSessionIdeas": ["sugestão para próxima sessão 1", "sugestão para próxima sessão 2"]
}

IMPORTANTE: Nunca diagnostique. Ofereça apenas hipóteses clínicas para reflexão do terapeuta.
Responda APENAS com o JSON, sem texto adicional.`;

    const { text, inputTokens, outputTokens } = await chat({
      provider,
      apiKey,
      system: systemPrompt,
      messages: [{ role: "user", content: `Relato da sessão:\n\n${content}` }],
      maxTokens: 600,
    });

    if (therapistId) {
      logAiUsage({ therapistId, provider, feature: "evolution_suggest", inputTokens, outputTokens }).catch(() => {});
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("Resposta inválida da IA");

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json(parsed);
  } catch (error: unknown) {
    console.error("Evolution suggest error:", error);
    const message = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
