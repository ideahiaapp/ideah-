import { createClient } from "@supabase/supabase-js";

const VOYAGE_API = "https://api.voyageai.com/v1/embeddings";
const CHUNK_SIZE = 1800;
const CHUNK_OVERLAP = 150;

/* ── Chunking ──────────────────────────────────────────── */

export function chunkText(text: string): string[] {
  // Normaliza quebras de linha
  const clean = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  const chunks: string[] = [];
  let start = 0;

  while (start < clean.length) {
    const end = Math.min(start + CHUNK_SIZE, clean.length);
    const chunk = clean.slice(start, end).trim();
    if (chunk.length > 80) chunks.push(chunk);
    if (end >= clean.length) break;
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }

  return chunks;
}

/* ── Voyage AI embeddings ──────────────────────────────── */

export async function embedTexts(
  texts: string[],
  voyageKey: string
): Promise<number[][]> {
  // Voyage aceita até 128 inputs por request
  const BATCH = 128;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH);
    const res = await fetch(VOYAGE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${voyageKey}`,
      },
      body: JSON.stringify({ input: batch, model: "voyage-3" }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Voyage AI error (${res.status}): ${err}`);
    }

    const data = await res.json();
    allEmbeddings.push(...data.data.map((d: { embedding: number[] }) => d.embedding));
  }

  return allEmbeddings;
}

/* ── Supabase (service role — bypass RLS no server) ──── */

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY não configurada no .env.local");
  return createClient(url, key);
}

/* ── Busca vetorial ────────────────────────────────────── */

export async function searchChunks(
  query: string,
  therapistId: string,
  voyageKey: string,
  topK = 5,
  approach?: string
): Promise<string[]> {
  const [embedding] = await embedTexts([query], voyageKey);
  const supabase = serviceClient();

  const { data, error } = await supabase.rpc("search_rag_chunks", {
    query_embedding: embedding,
    therapist_uuid: therapistId,
    match_count: topK,
    min_similarity: 0.35,
    filter_approach: approach ?? null,
  });

  if (error) throw new Error(`Busca RAG: ${error.message}`);

  return (data as { content: string }[]).map((d) => d.content);
}

/* ── Persistir documento + chunks ─────────────────────── */

export async function saveDocument(params: {
  therapistId: string;
  name: string;
  sizeBytes: number;
  chunks: string[];
  embeddings: number[][];
  approach: string;
  isGlobal?: boolean;
}): Promise<string> {
  const supabase = serviceClient();

  const { data: doc, error: docErr } = await supabase
    .from("rag_documents")
    .insert({
      therapist_id: params.therapistId,
      name: params.name,
      size_bytes: params.sizeBytes,
      chunk_count: params.chunks.length,
      approach: params.approach,
      is_global: params.isGlobal ?? false,
    })
    .select("id")
    .single();

  if (docErr || !doc) throw new Error(`Criar documento: ${docErr?.message}`);

  const BATCH = 50;
  for (let i = 0; i < params.chunks.length; i += BATCH) {
    const rows = params.chunks.slice(i, i + BATCH).map((content, j) => ({
      document_id: doc.id,
      therapist_id: params.therapistId,
      content,
      embedding: params.embeddings[i + j],
      chunk_index: i + j,
      is_global: params.isGlobal ?? false,
    }));

    const { error: chunkErr } = await supabase.from("rag_chunks").insert(rows);
    if (chunkErr) throw new Error(`Inserir chunks: ${chunkErr.message}`);
  }

  return doc.id;
}

/* ── Listar documentos (global ou por terapeuta) ──────── */

export async function listDocuments(therapistId: string) {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("rag_documents")
    .select("id, name, size_bytes, chunk_count, approach, is_global, created_at")
    .eq("therapist_id", therapistId)
    .order("approach")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listGlobalDocuments() {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("rag_documents")
    .select("id, name, size_bytes, chunk_count, approach, created_at")
    .eq("is_global", true)
    .order("approach")
    .order("name");

  if (error) throw new Error(error.message);
  return data ?? [];
}

/* ── Deletar documento ────────────────────────────────── */

export async function deleteDocument(documentId: string, therapistId: string) {
  const supabase = serviceClient();
  const { error } = await supabase
    .from("rag_documents")
    .delete()
    .eq("id", documentId)
    .eq("therapist_id", therapistId);

  if (error) throw new Error(error.message);
}

export async function deleteGlobalDocument(documentId: string) {
  const supabase = serviceClient();
  const { error } = await supabase
    .from("rag_documents")
    .delete()
    .eq("id", documentId)
    .eq("is_global", true);

  if (error) throw new Error(error.message);
}
