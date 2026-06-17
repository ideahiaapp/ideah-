/**
 * OCR para PDFs escaneados — desabilitado em produção por limitações de build.
 * Para habilitar: implementar via API externa (ex: Google Document AI).
 */
export async function ocrPdf(_pdfBuffer: Buffer): Promise<string> {
  throw new Error(
    "Este PDF parece ser um scan. Por enquanto só são suportados PDFs com texto selecionável. Suporte a PDFs escaneados em breve."
  );
}
