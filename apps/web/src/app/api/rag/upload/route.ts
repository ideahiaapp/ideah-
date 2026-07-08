import { NextRequest, NextResponse } from "next/server";
import path from "path";
import { createCanvas } from "@napi-rs/canvas";
import { createWorker } from "tesseract.js";
import { chunkText, embedTexts, saveDocument, hashContent, findDuplicateDocument } from "@/lib/rag";
import { requireAdmin, AdminAuthError } from "@/lib/adminAuth";

export const maxDuration = 300; // OCR pode demorar em livros grandes

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse/lib/pdf-parse.js");
  const result = await pdfParse(buffer);
  return result.text?.trim() ?? "";
}

const MIN_CHARS_PER_PAGE = 20; // abaixo disso, consideramos a página "sem texto extraído"

// OCR local via Tesseract.js — sem filtro de conteúdo (não é IA generativa), ideal para
// bases teóricas que tratam de sexualidade/corpo, onde OCR via LLM pode recusar páginas.
async function ocrPDFWithTesseract(buffer: Buffer, wasmUrl: string): Promise<{ text: string; emptyPages: number[] }> {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");

  const pdfDoc = await pdfjsLib.getDocument({
    data: new Uint8Array(buffer),
    useSystemFonts: true,
    disableFontFace: true,
    wasmUrl, // necessário para o decodificador JBIG2 (scans PB) — pdf.js busca via fetch(), não como arquivo local
  }).promise;

  console.log(`[RAG OCR] Tesseract: ${pdfDoc.numPages} páginas`);

  const worker = await createWorker("por");
  const parts: string[] = [];
  const emptyPages: number[] = [];

  try {
    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext("2d");

      await page.render({
        canvasContext: context as unknown as CanvasRenderingContext2D,
        canvas: canvas as unknown as HTMLCanvasElement,
        viewport,
      }).promise;

      const imageBuffer = canvas.toBuffer("image/png");
      const { data } = await worker.recognize(imageBuffer);
      const pageText = data.text?.trim() ?? "";
      parts.push(pageText);

      if (pageText.length < MIN_CHARS_PER_PAGE) {
        emptyPages.push(i);
        console.warn(`[RAG OCR] página ${i}/${pdfDoc.numPages} sem texto extraído (possível falha de decodificação da imagem)`);
      } else {
        console.log(`[RAG OCR] página ${i}/${pdfDoc.numPages} processada`);
      }
    }
  } finally {
    await worker.terminate();
  }

  return { text: parts.join("\n\n"), emptyPages };
}

function formatPageRanges(pages: number[]): string {
  if (pages.length === 0) return "";
  const ranges: string[] = [];
  let start = pages[0];
  let prev = pages[0];
  for (let i = 1; i <= pages.length; i++) {
    const curr = pages[i];
    if (curr !== prev + 1) {
      ranges.push(start === prev ? `${start}` : `${start}-${prev}`);
      start = curr;
    }
    prev = curr;
  }
  return ranges.join(", ");
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
    const approach  = (formData.get("approach") as string | null) ?? "PSYCHOANALYSIS";
    const isGlobalReq = formData.get("isGlobal") === "true";

    if (!file || !therapistId) {
      return NextResponse.json({ error: "file e therapistId são obrigatórios." }, { status: 400 });
    }

    // Apenas admins podem subir para a base global
    if (isGlobalReq) {
      try {
        await requireAdmin(req);
      } catch (e) {
        if (e instanceof AdminAuthError) return NextResponse.json({ error: "Apenas administradores podem adicionar à base global." }, { status: 403 });
        throw e;
      }
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
    let emptyPages: number[] = [];

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const buffer = Buffer.from(await file.arrayBuffer());

      // Tenta extração direta primeiro (PDF digital)
      text = await extractTextFromPDF(buffer);

      // Se não extraiu texto, é PDF escaneado — usa OCR local (Tesseract.js)
      if (!text || text.length < 100) {
        const wasmUrl = path.join(path.dirname(require.resolve("pdfjs-dist/package.json")), "wasm").replace(/\\/g, "/") + "/";
        const ocrResult = await ocrPDFWithTesseract(buffer, wasmUrl);
        text = ocrResult.text;
        emptyPages = ocrResult.emptyPages;
        usedOCR = true;
      }
    } else {
      text = await file.text();
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "Não foi possível extrair texto do arquivo." }, { status: 422 });
    }

    // ── Verificação de duplicata ─────────────────────────────
    const contentHash = hashContent(text);
    const isDuplicate = await findDuplicateDocument({
      contentHash,
      approach,
      isGlobal: isGlobalReq,
      therapistId,
    });
    if (isDuplicate) {
      return NextResponse.json({ error: "Conteúdo já indexado." }, { status: 409 });
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
      contentHash,
    });

    return NextResponse.json({
      documentId,
      chunkCount: chunks.length,
      usedOCR,
      emptyPageCount: emptyPages.length,
      emptyPageRanges: formatPageRanges(emptyPages),
    });
  } catch (error) {
    console.error("RAG upload error:", error);
    const message = error instanceof Error ? error.message : "Erro interno";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
