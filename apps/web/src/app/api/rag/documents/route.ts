import { NextRequest, NextResponse } from "next/server";
import { listDocuments, listGlobalDocuments, deleteDocument, deleteGlobalDocument } from "@/lib/rag";
import { requireAdmin, AdminAuthError } from "@/lib/adminAuth";

export async function GET(req: NextRequest) {
  try {
    const therapistId   = req.nextUrl.searchParams.get("therapistId");
    const globalOnly    = req.nextUrl.searchParams.get("global") === "true";

    if (globalOnly) {
      try {
        await requireAdmin(req);
      } catch (e) {
        if (e instanceof AdminAuthError) return NextResponse.json({ error: e.message }, { status: 403 });
        throw e;
      }
      const docs = await listGlobalDocuments();
      return NextResponse.json({ documents: docs });
    }

    if (!therapistId) {
      return NextResponse.json({ error: "therapistId obrigatório." }, { status: 400 });
    }
    const docs = await listDocuments(therapistId);
    return NextResponse.json({ documents: docs });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { documentId, therapistId, isGlobal } = await req.json();

    if (!documentId) {
      return NextResponse.json({ error: "documentId obrigatório." }, { status: 400 });
    }

    if (isGlobal) {
      try {
        await requireAdmin(req);
      } catch (e) {
        if (e instanceof AdminAuthError) return NextResponse.json({ error: "Apenas administradores podem remover documentos globais." }, { status: 403 });
        throw e;
      }
      await deleteGlobalDocument(documentId);
    } else {
      if (!therapistId) {
        return NextResponse.json({ error: "therapistId obrigatório." }, { status: 400 });
      }
      await deleteDocument(documentId, therapistId);
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
