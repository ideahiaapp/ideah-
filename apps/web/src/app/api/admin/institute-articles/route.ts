import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/adminAuth";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function slugify(title: string): string {
  return title
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

// GET /api/admin/institute-articles — lista todos (publicados e rascunhos)
export async function GET(req: NextRequest) {
  try {
    await requireAdmin(req);
    const supabaseAdmin = serviceClient();

    const { data, error } = await supabaseAdmin
      .from("institute_articles")
      .select("id, slug, category, title, excerpt, illustration, published, published_at, created_by, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json({ articles: data ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}

// POST /api/admin/institute-articles — cria um novo artigo
export async function POST(req: NextRequest) {
  try {
    const adminEmail = await requireAdmin(req);
    const supabaseAdmin = serviceClient();

    const body = await req.json() as {
      title?: string; category?: string; excerpt?: string; body?: string;
      illustration?: string; published?: boolean;
    };
    if (!body.title?.trim() || !body.excerpt?.trim() || !body.body?.trim()) {
      return NextResponse.json({ error: "Título, resumo e texto são obrigatórios." }, { status: 400 });
    }

    const baseSlug = slugify(body.title);
    let slug = baseSlug;
    for (let i = 2; i < 50; i++) {
      const { data: existing } = await supabaseAdmin
        .from("institute_articles").select("id").eq("slug", slug).maybeSingle();
      if (!existing) break;
      slug = `${baseSlug}-${i}`;
    }

    const published = !!body.published;
    const { data, error } = await supabaseAdmin
      .from("institute_articles")
      .insert({
        slug,
        title: body.title.trim(),
        category: body.category?.trim() || "Artigo",
        excerpt: body.excerpt.trim(),
        body: body.body.trim(),
        illustration: body.illustration?.trim() || "circles",
        published,
        published_at: published ? new Date().toISOString() : null,
        created_by: adminEmail,
      })
      .select("id, slug")
      .single();

    if (error) throw error;
    return NextResponse.json({ ok: true, id: data.id, slug: data.slug });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
