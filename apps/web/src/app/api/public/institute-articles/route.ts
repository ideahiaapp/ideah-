import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "no-store",
};

// GET /api/public/institute-articles?limit=3 — artigos publicados, mais recentes primeiro.
// Consumido pelo site institucional (outro domínio) para a seção "Publicações Recentes".
export async function GET(req: NextRequest) {
  const limitParam = Number(req.nextUrl.searchParams.get("limit"));
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 12;

  const supabaseAdmin = serviceClient();
  const { data, error } = await supabaseAdmin
    .from("institute_articles")
    .select("slug, category, title, excerpt, illustration, published_at")
    .eq("published", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });

  const articles = (data ?? [])
    .sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime())
    .slice(0, limit);

  return NextResponse.json({ articles }, { headers: CORS_HEADERS });
}
