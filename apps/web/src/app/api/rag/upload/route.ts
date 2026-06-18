import { NextRequest, NextResponse } from "next/server";
import { chunkText, embedTexts, saveDocument } from "@/lib/rag";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const voyageKey = process.env.VOYAGE_API_KEY;
    if (!voyageKey) {
      return NextResponse.json(
        { error: "VOYAGE_API_KEY não configurada no servidor." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const therapistId = formData.get("therapistId") as string | null;
    const approach = (formData.get("approach") as string | null) ?? "PSYCHOANALYSIS";

    if (!file || !therapistId) {
      return NextResponse.json({ error: "file e therapistId são obrigatórios." }, { status: 400 });
    }

    const allowedTypes = ["application/pdf", "text/plain"];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".txt")) {
      return NextResponse.json({ error: "Apenas PDF e TXT são suportados." }, { status: 400 });
    }

    const MAX_SIZE = 200 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Arquivo muito grande. Máximo: 200MB." }, { status: 400 });
    }

    // ── Extração de texto ─────────────────────────────────
    let text = "";

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const buffer = Buffer.from(await file.arrayBuffer());
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse/lib/pdf-parse.js");
      const result = await pdfParse(buffer);
      text = result.text?.trim() ?? "";

      if (!text) {
        return NextResponse.json(
          { error: "Este PDF parece ser um scan. Por enquanto só são suportados PDFs com texto selecionável. Suporte a PDFs escaneados em breve." },
          { status: 422 }
        );
      }
    } else {
      text = await file.text();
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: "Não foi possível extrair texto do arquivo." },
        { status: 422 }
      );
    }

    // ── Chunking ──────────────────────────────────────────
    const chunks = chunkText(text);
    if (chunks.length === 0) {
      return NextResponse.json({ error: "Texto muito curto para indexar." }, { status: 422 });
    }

    // ── Embeddings ────────────────────────────────────────
    const embeddings = await embedTexts(chunks, voyageKey);

    // ── Persistência ──────────────────────────────────────
    const documentId = await saveDocument({
      therapistId,
      name: file.name,
      sizeBytes: file.size,
      chunks,
      embeddings,
      approach,
    });

    return NextResponse.json({ documentId, chunkCount: chunks.length });
  } catch (error) {
    console.error("RAG upload error:", error);
    const message = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
