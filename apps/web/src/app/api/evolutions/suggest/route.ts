import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

function getClient(req: NextRequest) {
  const apiKey =
    req.headers.get("x-anthropic-key") ||
    process.env.ANTHROPIC_API_KEY ||
    "";

  if (!apiKey) {
    throw new Error(
      "API Key não configurada. Acesse Configurações → API Key para informar sua chave da Anthropic."
    );
  }

  return new Anthropic({ apiKey });
}

export async function POST(req: NextRequest) {
  try {
    const client = getClient(req);
    const { content, approach, clientName } = await req.json();

    if (!content || content.trim().length < 20) {
      return NextResponse.json({ error: "Conteúdo muito curto" }, { status: 400 });
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

    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 600,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Relato da sessão:\n\n${content}`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";

    // Extrair JSON da resposta
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
