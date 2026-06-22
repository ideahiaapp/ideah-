import { NextRequest, NextResponse } from "next/server";
import { chunkText, embedTexts, saveDocument } from "@/lib/rag";

export const maxDuration = 300; // OCR pode demorar em livros grandes

const ADMIN_EMAILS = ["carlos.magno@gmail.com", "betinha.potter@gmail.com", "elimarcia.philos@gmail.com"];

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse.js");
  const result = await pdfParse(buffer);
  return result.text?.trim() ?? "";
}

async function ocrPDFWithClaude(buffer: Buffer, anthropicKey: string): Promise<string> {
  // Converte PDF para base64 e envia para Claude com visão
  const base64 = buffer.toString("base64");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": anthropicKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "document",
              source: {
                type: "base64",
                media_type: "application/pdf",
                data: base64,
              },
            },
            {
              type: "text",
              text: "Extraia todo o texto deste documento PDF escaneado. Retorne apenas o texto extraído, sem comentários, formatações extras ou explicações. Preserve parágrafos e estrutura do texto original.",
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OCR via Claude falhou (${response.status}): ${err}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text?.trim() ?? "";
}

export async function POST(req: NextRequest) {
  try {
    const voyageKey = process.env.VOYAGE_API_KEY;
    if (!voyageKey) {
      return NextResponse.json({ error: "VOYAGE_API_KEY não configurada no servidor." }, { status: 500 });
    }

    const formData  = await req.formData();
    const file      = formData.get("file") as File | null;
    const therapistId = formData.get("therapistId") as string | null;
    const uploaderEmail = (formData.get("uploaderEmail") as string | null)?.toLowerCase().trim();
    const approach  = (formData.get("approach") as string | null) ?? "PSYCHOANALYSIS";
    const isGlobalReq = formData.get("isGlobal") === "true";

    if (!file || !therapistId) {
      return NextResponse.json({ error: "file e therapistId são obrigatórios." }, { status: 400 });
    }

    // Apenas admins podem subir para a base global
    if (isGlobalReq && !ADMIN_EMAILS.includes(uploaderEmail ?? "")) {
      return NextResponse.json({ error: "Apenas administradores podem adicionar à base global." }, { status: 403 });
    }

    const allowedTypes = ["application/pdf", "text/plain"];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith(".txt")) {
      return NextResponse.json({ error: "Apenas PDF e TXT são suportados." }, { status: 400 });
    }

    const MAX_SIZE = 200 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Arquivo muito grande. Máximo: 200MB." }, { status: 400 });
    }

    // ── Extração de texto ──────────────────────────────────
    let text = "";
    let usedOCR = false;

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const buffer = Buffer.from(await file.arrayBuffer());

      // Tenta extração direta primeiro (PDF digital)
      text = await extractTextFromPDF(buffer);

      // Se não extraiu texto, é PDF escaneado — usa OCR via Claude
      if (!text || text.length < 100) {
        const anthropicKey = process.env.ANTHROPIC_API_KEY;
        if (!anthropicKey) {
          return NextResponse.json(
            { error: "PDF escaneado detectado mas ANTHROPIC_API_KEY não está configurada para OCR." },
            { status: 422 }
          );
        }
        text = await ocrPDFWithClaude(buffer, anthropicKey);
        usedOCR = true;
      }
    } else {
      text = await file.text();
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "Não foi possível extrair texto do arquivo." }, { status: 422 });
    }

    // ── Chunking ───────────────────────────────────────────
    const chunks = chunkText(text);
    if (chunks.length === 0) {
      return NextResponse.json({ error: "Texto muito curto para indexar." }, { status: 422 });
    }

    // ── Embeddings ─────────────────────────────────────────
    const embeddings = await embedTexts(chunks, voyageKey);

    // ── Persistência ───────────────────────────────────────
    const documentId = await saveDocument({
      therapistId,
      name: file.name,
      sizeBytes: file.size,
      chunks,
      embeddings,
      approach,
      isGlobal: isGlobalReq,
    });

    return NextResponse.json({ documentId, chunkCount: chunks.length, usedOCR });
  } catch (error) {
    console.error("RAG upload error:", error);
    const message = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
