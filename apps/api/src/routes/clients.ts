import { FastifyInstance } from "fastify";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middlewares/auth";

const clientSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  birthDate: z.string().datetime().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "WAITLIST"]).default("ACTIVE"),
  approach: z.enum([
    "PSYCHOANALYSIS",
    "COGNITIVE_BEHAVIORAL",
    "SOMATIC",
    "HUMANISTIC",
    "SYSTEMIC",
    "JUNGIAN",
    "GESTALT",
    "ACCEPTANCE_COMMITMENT",
  ]),
  notes: z.string().optional(),
});

export async function clientRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  // GET /clients
  app.get("/", async (request) => {
    const { sub } = request.user as { sub: string };
    return prisma.client.findMany({
      where: { therapistId: sub },
      orderBy: { name: "asc" },
    });
  });

  // POST /clients
  app.post("/", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const body = clientSchema.parse(request.body);
    const client = await prisma.client.create({
      data: { ...body, therapistId: sub, birthDate: body.birthDate ? new Date(body.birthDate) : undefined },
    });
    return reply.status(201).send(client);
  });

  // GET /clients/:id
  app.get("/:id", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const { id } = request.params as { id: string };
    const client = await prisma.client.findFirst({ where: { id, therapistId: sub } });
    if (!client) return reply.status(404).send({ error: "Cliente não encontrado." });
    return client;
  });

  // PUT /clients/:id
  app.put("/:id", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const { id } = request.params as { id: string };
    const body = clientSchema.partial().parse(request.body);
    const client = await prisma.client.updateMany({
      where: { id, therapistId: sub },
      data: { ...body, birthDate: body.birthDate ? new Date(body.birthDate) : undefined },
    });
    if (!client.count) return reply.status(404).send({ error: "Cliente não encontrado." });
    return reply.send({ success: true });
  });

  // DELETE /clients/:id
  app.delete("/:id", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const { id } = request.params as { id: string };
    await prisma.client.deleteMany({ where: { id, therapistId: sub } });
    return reply.send({ success: true });
  });
}
