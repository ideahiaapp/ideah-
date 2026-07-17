import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Libera CORS nas rotas de API para que o app mobile (e qualquer outro cliente
 * autenticado por token/param, sem depender de cookies) consiga chamá-las de
 * outra origem. As rotas já validam acesso via Supabase bearer token ou
 * parâmetros explícitos — a origem não é o limite de segurança aqui.
 */
export function middleware(req: NextRequest) {
  const res = req.method === "OPTIONS"
    ? new NextResponse(null, { status: 204 })
    : NextResponse.next();

  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, x-ai-key, x-ai-provider, x-anthropic-key"
  );

  return res;
}

export const config = {
  matcher: "/api/:path*",
};
