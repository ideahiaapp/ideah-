/**
 * OCR fallback for scanned PDFs.
 * Uses pdfjs-dist to render each page to a canvas, then Tesseract.js (WASM) for text extraction.
 * Zero native binary dependencies — canvas package ships prebuilt binaries.
 */

const SCALE = 2.0;    // ~300 DPI — good balance between accuracy and speed
const LANG  = "por";  // Portuguese; Tesseract downloads the traineddata on first use

class NodeCanvasFactory {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  private createCanvas = require("canvas").createCanvas as (w: number, h: number) => import("canvas").Canvas;

  create(width: number, height: number) {
    const canvas  = this.createCanvas(width, height);
    const context = canvas.getContext("2d");
    return { canvas, context };
  }

  reset(pair: { canvas: import("canvas").Canvas }, width: number, height: number) {
    pair.canvas.width  = width;
    pair.canvas.height = height;
  }

  destroy(pair: { canvas: import("canvas").Canvas }) {
    pair.canvas.width  = 0;
    pair.canvas.height = 0;
  }
}

export async function ocrPdf(pdfBuffer: Buffer): Promise<string> {
  // Dynamic requires keep Next.js build happy with native modules
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfjsLib = require("pdfjs-dist/legacy/build/pdf.js");
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createWorker } = require("tesseract.js");

  const canvasFactory = new NodeCanvasFactory();

  const pdf = await pdfjsLib.getDocument({
    data:           new Uint8Array(pdfBuffer),
    canvasFactory,
    verbosity:      0,
  }).promise;

  const worker = await createWorker(LANG, 1, { logger: () => {} });

  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page     = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: SCALE });
    const pair     = canvasFactory.create(viewport.width, viewport.height);

    await page.render({
      canvasContext: pair.context,
      viewport,
      canvasFactory,
    }).promise;

    const imageBuffer = pair.canvas.toBuffer("image/png");
    canvasFactory.destroy(pair);

    const { data } = await worker.recognize(imageBuffer);
    if (data.text.trim()) pageTexts.push(data.text.trim());
  }

  await worker.terminate();

  return pageTexts.join("\n\n");
}
