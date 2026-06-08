import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import multipart from "@fastify/multipart";
import { config } from "dotenv";

config();

// Routes
import { authRoutes } from "./routes/auth";
import { clientRoutes } from "./routes/clients";
import { evolutionRoutes } from "./routes/evolutions";
import { supervisionRoutes } from "./routes/supervision";
import { subscriptionRoutes } from "./routes/subscriptions";

const app = Fastify({ logger: true });

// ─── Plugins ─────────────────────────────────────────────────────────────────

await app.register(cors, {
  origin: [
    process.env.WEB_URL ?? "http://localhost:3000",
    "http://localhost:8081", // Expo dev
  ],
  credentials: true,
});

await app.register(jwt, {
  secret: process.env.JWT_SECRET ?? "dev-secret-change-in-prod",
});

await app.register(multipart, {
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// ─── Routes ──────────────────────────────────────────────────────────────────

await app.register(authRoutes, { prefix: "/auth" });
await app.register(clientRoutes, { prefix: "/clients" });
await app.register(evolutionRoutes, { prefix: "/evolutions" });
await app.register(supervisionRoutes, { prefix: "/supervision" });
await app.register(subscriptionRoutes, { prefix: "/subscriptions" });

// ─── Health Check ────────────────────────────────────────────────────────────

app.get("/health", async () => ({ status: "ok", timestamp: new Date() }));

// ─── Start ───────────────────────────────────────────────────────────────────

const PORT = Number(process.env.PORT ?? 3001);

try {
  await app.listen({ port: PORT, host: "0.0.0.0" });
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
