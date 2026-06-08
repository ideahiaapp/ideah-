import { FastifyInstance } from "fastify";
import { prisma } from "../lib/prisma";
import { authenticate } from "../middlewares/auth";

export async function subscriptionRoutes(app: FastifyInstance) {
  app.addHook("preHandler", authenticate);

  // GET /subscriptions/me
  app.get("/me", async (request, reply) => {
    const { sub } = request.user as { sub: string };
    const subscription = await prisma.subscription.findUnique({
      where: { userId: sub },
    });
    if (!subscription) return reply.status(404).send({ error: "Assinatura não encontrada." });
    return subscription;
  });
}
