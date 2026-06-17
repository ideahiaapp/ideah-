import { NextRequest, NextResponse } from "next/server";
import { listDocuments, deleteDocument } from "@/lib/rag";

export async function GET(req: NextRequest) {
  try {
    const therapistId = req.nextUrl.searchParams.get("therapistId");
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
    const { documentId, therapistId } = await req.json();
    if (!documentId || !therapistId) {
      return NextResponse.json({ error: "documentId e therapistId obrigatórios." }, { status: 400 });
    }
    await deleteDocument(documentId, therapistId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
