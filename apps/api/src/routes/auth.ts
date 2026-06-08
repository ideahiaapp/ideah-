import { FastifyInstance } from "fastify";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";

export async function authRoutes(app: FastifyInstance) {
  // POST /auth/register
  app.post("/register", async (request, reply) => {
    const body = z
      .object({
        name: z.string().min(2),
        email: z.string().email(),
        password: z.string().min(6),
      })
      .parse(request.body);

    const exists = await prisma.user.findUnique({ where: { email: body.email } });
    if (exists) return reply.status(409).send({ error: "E-mail já cadastrado." });

    const hashed = await bcrypt.hash(body.password, 10);
    const trialEndsAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashed,
        subscription: {
          create: {
            plan: "TRIAL",
            status: "TRIAL",
            trialEndsAt,
          },
        },
      },
      select: { id: true, name: true, email: true, role: true },
    });

    const token = app.jwt.sign({ sub: user.id, role: user.role }, { expiresIn: "7d" });
    return reply.status(201).send({ user, token });
  });

  // POST /auth/login
  app.post("/login", async (request, reply) => {
    const body = z
      .object({
        email: z.string().email(),
        password: z.string(),
      })
      .parse(request.body);

    const user = await prisma.user.findUnique({ where: { email: body.email } });
    if (!user) return reply.status(401).send({ error: "Credenciais inválidas." });

    const valid = await bcrypt.compare(body.password, user.password);
    if (!valid) return reply.status(401).send({ error: "Credenciais inválidas." });

    const token = app.jwt.sign({ sub: user.id, role: user.role }, { expiresIn: "7d" });

    return reply.send({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      token,
    });
  });

  // GET /auth/me
  app.get(
    "/me",
    { preHandler: [app.authenticate] },
    async (request, reply) => {
      const { sub } = request.user as { sub: string };
      const user = await prisma.user.findUnique({
        where: { id: sub },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
          subscription: true,
          createdAt: true,
        },
      });
      if (!user) return reply.status(404).send({ error: "Usuário não encontrado." });
      return reply.send(user);
    }
  );
}
