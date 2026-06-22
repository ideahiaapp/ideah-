import { NextRequest, NextResponse } from "next/server";
import { listDocuments, listGlobalDocuments, deleteDocument, deleteGlobalDocument } from "@/lib/rag";

const ADMIN_EMAILS = ["carlos.magno@gmail.com", "betinha.potter@gmail.com", "elimarcia.philos@gmail.com"];

export async function GET(req: NextRequest) {
  try {
    const therapistId   = req.nextUrl.searchParams.get("therapistId");
    const globalOnly    = req.nextUrl.searchParams.get("global") === "true";
    const adminEmail    = req.headers.get("x-admin-email")?.toLowerCase().trim();

    if (globalOnly) {
      if (!ADMIN_EMAILS.includes(adminEmail ?? "")) {
        return NextResponse.json({ error: "Acesso negado." }, { status: 403 });
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
    const adminEmail = req.headers.get("x-admin-email")?.toLowerCase().trim();

    if (!documentId) {
      return NextResponse.json({ error: "documentId obrigatório." }, { status: 400 });
    }

    if (isGlobal) {
      if (!ADMIN_EMAILS.includes(adminEmail ?? "")) {
        return NextResponse.json({ error: "Apenas administradores podem remover documentos globais." }, { status: 403 });
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
