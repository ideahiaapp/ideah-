import { NextRequest, NextResponse } from "next/server";

// GET /api/geo — retorna a cidade de onde a requisição está vindo, usando os
// cabeçalhos de geolocalização que a Vercel injeta automaticamente em produção
// (x-vercel-ip-city). Em ambiente local (fora da Vercel) esses headers não
// existem, então city vem null e o front trata isso com um texto neutro.
export async function GET(req: NextRequest) {
  const cityHeader = req.headers.get("x-vercel-ip-city");
  const city = cityHeader ? decodeURIComponent(cityHeader) : null;
  return NextResponse.json({ city }, { headers: { "Cache-Control": "no-store" } });
}
