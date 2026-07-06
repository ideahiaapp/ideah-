import { NextRequest, NextResponse } from "next/server";
import { getAIOptions, chat } from "@/lib/ai-client";
import { searchChunks } from "@/lib/rag";
import { assertUnderUsageLimit, logAiUsage, UsageLimitError } from "@/lib/usage";
import { createClient } from "@supabase/supabase-js";

async function getApproachPrompt(approach: string): Promise<string | null> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from("approach_prompts")
      .select("prompt")
      .eq("approach", approach)
      .single();
    return data?.prompt ?? null;
  } catch {
    return null;
  }
}

export const maxDuration = 300;


export async function POST(req: NextRequest) {
  try {
    const { provider, apiKey } = getAIOptions(req);
    const { messages, approach, clientName, therapistId, clientIntention, clientAnamnese, lastEvolution } = await req.json();

    if (!messages || !approach) {
      return NextResponse.json({ error: "Parâmetros inválidos" }, { status: 400 });
    }

    if (therapistId) {
      try {
        await assertUnderUsageLimit(therapistId);
      } catch (e) {
        if (e instanceof UsageLimitError) return NextResponse.json({ error: e.message }, { status: 429 });
        throw e;
      }
    }

    const systemPrompt = await getApproachPrompt(approach);
    if (!systemPrompt) {
      return NextResponse.json({ error: "Prompt não encontrado para esta abordagem." }, { status: 500 });
    }

    // ── RAG: busca chunks relevantes da base de conhecimento ──
    let ragContext = "";
    let ragFound = false;
    const voyageKey = process.env.VOYAGE_API_KEY;
    if (voyageKey && therapistId && messages.length > 0) {
      try {
        const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user");
        if (lastUserMsg) {
          const chunks = await searchChunks(lastUserMsg.content, therapistId, voyageKey, 5, approach);
          if (chunks.length > 0) {
            ragFound = true;
            ragContext = `\n\n---\nCONTEÚDO DA BASE DE CONHECIMENTO DO TERAPEUTA (ÚNICA FONTE PERMITIDA):\n${chunks.map((c, i) => `[${i + 1}] ${c}`).join("\n\n")}\n---`;
          }
        }
      } catch (ragErr) {
        console.warn("RAG search falhou (não crítico):", ragErr);
      }
    }

    const intentionContext = clientIntention && !clientAnamnese
      ? `\n\nINTENÇÃO DO CLIENTE (preenchida na anamnese inicial): "${clientIntention}"\nConsidere essa intenção como ponto de partida clínico ao formular hipóteses e caminhos terapêuticos.`
      : "";

    type AnamneseContext = {
      cpf?: string | null; emergency_contact?: string | null; how_found?: string | null;
      conditions?: string[]; latex_allergy?: boolean; oil_allergy?: string | null;
      medication?: string | null; emotional_state?: string | null; body_pain?: string | null;
      intention?: string | null; sexual_discomfort?: string | null;
      approach?: string | null;
      template_answers?: Record<string, unknown> | null;
    };
    const a = clientAnamnese as AnamneseContext | null | undefined;

    const templateAnswersText = a?.template_answers
      ? `\nRESPOSTAS DO QUESTIONÁRIO DE ANAMNESE (${a.approach ?? "abordagem"}):\n` +
        Object.entries(a.template_answers)
          .filter(([, v]) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0))
          .map(([k, v]) => `- ${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join("\n")
      : "";

    const anamneseContext = a
      ? `\n\nANAMNESE DO CLIENTE (use este material em todas as respostas para contextualizar a formulação clínica):
${a.how_found ? `- Como chegou até o terapeuta: ${a.how_found}\n` : ""}${a.emergency_contact ? `- Contato de emergência: ${a.emergency_contact}\n` : ""}${a.conditions?.length ? `- Condições de saúde: ${a.conditions.join(", ")}\n` : ""}${a.latex_allergy ? `- Alergia a látex: sim\n` : ""}${a.oil_allergy ? `- Alergia a óleo de massagem: ${a.oil_allergy}\n` : ""}${a.medication ? `- Medicamentos em uso: ${a.medication}\n` : ""}${a.emotional_state ? `- Estado emocional relatado: ${a.emotional_state}\n` : ""}${a.body_pain ? `- Dor no corpo relatada: ${a.body_pain}\n` : ""}${a.sexual_discomfort ? `- Incômodo na vida sexual relatado: ${a.sexual_discomfort}\n` : ""}${a.intention ? `- Intenção declarada para o processo: "${a.intention}"\n` : ""}${templateAnswersText}
Leve em conta todo esse material ao formular hipóteses e intervenções.`
      : "";

    const evolutionContext = lastEvolution
      ? `\n\nÚLTIMA SESSÃO REGISTRADA (${lastEvolution.sessionDate}):\nO que aconteceu: ${lastEvolution.content}${lastEvolution.hypothesis ? `\nHipótese clínica do terapeuta: ${lastEvolution.hypothesis}` : ""}${lastEvolution.nextSessionPlan ? `\nPlano para esta sessão: ${lastEvolution.nextSessionPlan}` : ""}\n\nLeve em conta este material ao supervisionar — esta supervisão prepara a próxima sessão a partir do que foi registrado.`
      : "";

    const ragInstruction = ragFound
      ? `\n\nREGRA ABSOLUTA: Responda EXCLUSIVAMENTE com base nos trechos da base de conhecimento acima. NÃO use conhecimento próprio do modelo, treinamento geral, nem informações externas. Cada afirmação clínica deve ser fundamentada nos trechos fornecidos. Se os trechos não cobrirem algum aspecto da pergunta, diga explicitamente: "Não encontrei material na sua base de conhecimento sobre isso."`
      : `\n\nREGRA ABSOLUTA: Não há material relevante na base de conhecimento do terapeuta para esta pergunta. Informe isso claramente ao terapeuta e não responda com base em conhecimento próprio do modelo. Diga: "Não encontrei conteúdo na sua base de conhecimento que responda a isso. Faça upload de materiais teóricos relacionados para que eu possa te apoiar com base no seu próprio estudo."`;

    const systemWithContext = `${systemPrompt}${ragContext}${ragInstruction}${anamneseContext}${intentionContext}${evolutionContext}

REFERENCIAL TEÓRICO ATIVO NESTA MENSAGEM: ${approach}. Toda a sua resposta deve ser fundamentada EXCLUSIVAMENTE nesta abordagem. Se o terapeuta mudar a abordagem em próximas mensagens, você deve adotar o novo referencial imediatamente.

Contexto desta supervisão: O terapeuta está trazendo material clínico referente ao cliente "${clientName || "paciente"}".
Responda de forma estruturada quando apropriado, usando:
- **Negrito** para conceitos-chave
- > Citações para referências teóricas relevantes
- Seções como "Hipóteses clínicas:", "Recursos teóricos:", "Questões para reflexão:" quando pertinente
- Mantenha respostas entre 150-400 palavras — consistentes mas não exaustivas`;

    const aiMessages = messages.map((m: { role: string; content: string }) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const { text: responseText, inputTokens, outputTokens } = await chat({
      provider,
      apiKey,
      system: systemWithContext,
      messages: aiMessages,
      maxTokens: 1024,
    });

    if (therapistId) {
      logAiUsage({ therapistId, provider, feature: "supervision_chat", inputTokens, outputTokens }).catch(() => {});
    }

    return NextResponse.json({ content: responseText });
  } catch (error: unknown) {
    console.error("Supervision chat error:", error);
    const message = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
