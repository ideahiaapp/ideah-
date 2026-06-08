import { FastifyInstance } from "fastify";
import { z } from "zod";
import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middlewares/auth";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const APPROACH_PROMPTS: Record<string, string> = {
  PSYCHOANALYSIS: `Você é um supervisor clínico psicanalítico experiente. Sua orientação é fundamentada em Freud, Lacan, Winnicott e outros autores psicanalíticos clássicos e contemporâneos. Foque em dinâmicas inconscientes, transferência, contratransferência, mecanismos de defesa e a escuta do inconsciente. Não faça diagnósticos — conduza o terapeuta a reflexões mais profundas sobre o caso.`,
  COGNITIVE_BEHAVIORAL: `Você é um supervisor clínico especializado em Terapia Cognitivo-Comportamental (TCC). Sua orientação é baseada em Beck, Ellis e autores contemporâneos da TCC. Foque em crenças centrais, pensamentos automáticos, reestruturação cognitiva e técnicas comportamentais. Não faça diagnósticos — ajude o terapeuta a formular o caso clinicamente.`,
  SOMATIC: `Você é um supervisor clínico especializado em Psicologia Somática e Psicoterapia Corporal. Oriente com base em Reich, Lowen, Levine e Ogden. Foque na relação corpo-mente, traumas somáticos, regulação do sistema nervoso e ressourciation. Não faça diagnósticos.`,
  HUMANISTIC: `Você é um supervisor clínico humanista, baseado na Abordagem Centrada na Pessoa de Carl Rogers. Foque em congruência, consideração positiva incondicional, empatia e o potencial de atualização do cliente. Não faça diagnósticos.`,
  SYSTEMIC: `Você é um supervisor clínico sistêmico e familiar. Oriente com base em Bateson, Minuchin, Bowen e Milan. Foque em padrões relacionais, sistemas familiares, circularidade e contextos. Não faça diagnósticos.`,
  JUNGIAN: `Você é um supervisor clínico junguiano. Sua orientação é baseada em Carl Gustav Jung e autores analíticos. Foque em arquétipos, individuação, sombra, anima/animus, sonhos e o inconsciente coletivo. Não faça diagnósticos.`,
  GESTALT: `Você é um supervisor clínico gestaltico. Oriente com base em Perls, Goodman e a teoria de campo. Foque no contato, awareness, experimentos, fronteira de contato e polaridades. Não faça diagnósticos.`,
  ACCEPTANCE_COMMITMENT: `Você é um supervisor clínico especializado em ACT (Acceptance and Commitment Therapy). Oriente com base em Hayes e Wilson. Foque em desfusão cognitiva, aceitação, valores, comprometimento e flexibilidade psicológica. Não faça diagnósticos.`,
};

export async function supervisionRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  // GET /supervision — listar sessões
  app.get("/", async (request) => {
    const { sub } = request.user as { sub: string };
    return prisma.supervisionSession.findMany({
      where: { therapistId: sub },
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { messages: true } } },
    });
  });

  // POST /supervision — nova sessão
  app.post("/", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const body = z
      .object({
        title: z.string().min(2),
        approach: z.string(),
        clientId: z.string().optional(),
      })
      .parse(request.body);

    const session = await prisma.supervisionSession.create({
      data: {
        therapistId: sub,
        title: body.title,
        approach: body.approach as any,
        clientId: body.clientId,
      },
    });
    return reply.status(201).send(session);
  });

  // GET /supervision/:id — mensagens da sessão
  app.get("/:id", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const { id } = request.params as { id: string };
    const session = await prisma.supervisionSession.findFirst({
      where: { id, therapistId: sub },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!session) return reply.status(404).send({ error: "Sessão não encontrada." });
    return session;
  });

  // POST /supervision/:id/message — enviar mensagem e receber resposta da IA
  app.post("/:id/message", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const { id } = request.params as { id: string };
    const { content } = z.object({ content: z.string().min(1) }).parse(request.body);

    const session = await prisma.supervisionSession.findFirst({
      where: { id, therapistId: sub },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!session) return reply.status(404).send({ error: "Sessão não encontrada." });

    // Salvar mensagem do usuário
    await prisma.supervisionMessage.create({
      data: { sessionId: id, role: "USER", content },
    });

    // Montar histórico para Claude
    const history = session.messages.map((m) => ({
      role: m.role === "USER" ? ("user" as const) : ("assistant" as const),
      content: m.content,
    }));
    history.push({ role: "user", content });

    const systemPrompt =
      APPROACH_PROMPTS[session.approach] ??
      "Você é um supervisor clínico experiente e ético. Não faça diagnósticos.";

    // Chamar Claude
    const response = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 1024,
      system: systemPrompt,
      messages: history,
    });

    const assistantContent =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Salvar resposta da IA
    const assistantMessage = await prisma.supervisionMessage.create({
      data: { sessionId: id, role: "ASSISTANT", content: assistantContent },
    });

    // Atualizar updatedAt da sessão
    await prisma.supervisionSession.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return reply.send(assistantMessage);
  });
}
