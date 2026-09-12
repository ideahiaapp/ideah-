import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/adminAuth";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/admin/institute-articles/[id] — um artigo (para edição)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const supabaseAdmin = serviceClient();

    const { data, error } = await supabaseAdmin
      .from("institute_articles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return NextResponse.json({ error: "Artigo não encontrado." }, { status: 404 });
    return NextResponse.json({ article: data }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 403 });
  }
}

// PATCH /api/admin/institute-articles/[id] — edita/publica/despublica
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const supabaseAdmin = serviceClient();

    const body = await req.json() as {
      title?: string; category?: string; excerpt?: string; body?: string;
      illustration?: string; published?: boolean;
    };

    const { data: current, error: currentErr } = await supabaseAdmin
      .from("institute_articles").select("published").eq("id", id).maybeSingle();
    if (currentErr) throw currentErr;
    if (!current) return NextResponse.json({ error: "Artigo não encontrado." }, { status: 404 });

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined)        update.title = body.title.trim();
    if (body.category !== undefined)     update.category = body.category.trim() || "Artigo";
    if (body.excerpt !== undefined)      update.excerpt = body.excerpt.trim();
    if (body.body !== undefined)         update.body = body.body.trim();
    if (body.illustration !== undefined) update.illustration = body.illustration.trim() || "circles";
    if (body.published !== undefined) {
      update.published = body.published;
      // Só carimba a primeira publicação; despublicar não apaga o histórico da data.
      if (body.published && !current.published) update.published_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin.from("institute_articles").update(update).eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE /api/admin/institute-articles/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin(req);
    const { id } = await params;
    const supabaseAdmin = serviceClient();

    const { error } = await supabaseAdmin.from("institute_articles").delete().eq("id", id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Erro interno";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
