// Prefixo de rota do app quando montado sob um caminho (ex.: "/paideia" em produção,
// via Next.js Multi Zones). Mesma env var usada em `basePath` no next.config.js.
export const API_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
