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

// GET /api/public/institute-articles/[slug] — um artigo publicado, texto completo.
export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabaseAdmin = serviceClient();

  const { data, error } = await supabaseAdmin
    .from("institute_articles")
    .select("slug, category, title, excerpt, body, illustration, published_at")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  if (!data) return NextResponse.json({ error: "Artigo não encontrado." }, { status: 404, headers: CORS_HEADERS });
  return NextResponse.json({ article: data }, { headers: CORS_HEADERS });
}
