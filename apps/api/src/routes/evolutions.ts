import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middlewares/auth";

export async function evolutionRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  // GET /evolutions?clientId=xxx
  app.get("/", async (request) => {
    const { sub } = request.user as { sub: string };
    const { clientId } = request.query as { clientId?: string };
    return prisma.evolution.findMany({
      where: { therapistId: sub, ...(clientId ? { clientId } : {}) },
      orderBy: { sessionDate: "desc" },
    });
  });

  // POST /evolutions
  app.post("/", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const body = z
      .object({
        clientId: z.string(),
        sessionDate: z.string().datetime(),
        content: z.string().min(1),
        hypothesis: z.string().optional(),
        resources: z.string().optional(),
      })
      .parse(request.body);

    const evolution = await prisma.evolution.create({
      data: { ...body, therapistId: sub, sessionDate: new Date(body.sessionDate) },
    });
    return reply.status(201).send(evolution);
  });

  // PUT /evolutions/:id
  app.put("/:id", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const { id } = request.params as { id: string };
    const body = z
      .object({
        content: z.string().optional(),
        hypothesis: z.string().optional(),
        resources: z.string().optional(),
      })
      .parse(request.body);

    const result = await prisma.evolution.updateMany({
      where: { id, therapistId: sub },
      data: body,
    });
    if (!result.count) return reply.status(404).send({ error: "Evolução não encontrada." });
    return reply.send({ success: true });
  });

  // DELETE /evolutions/:id
  app.delete("/:id", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const { id } = request.params as { id: string };
    await prisma.evolution.deleteMany({ where: { id, therapistId: sub } });
    return reply.send({ success: true });
  });
}
