-- ============================================================
-- IDEAh — RAG Migration
-- Executar no SQL Editor do painel Supabase APÓS o schema.sql
-- ============================================================

-- ── Extensão pgvector ──────────────────────────────────────
create extension if not exists vector;

-- ── Documentos enviados pelo terapeuta ────────────────────
create table public.rag_documents (
  id           uuid default gen_random_uuid() primary key,
  therapist_id uuid references public.profiles(id) on delete cascade not null,
  name         text not null,
  size_bytes   int  default 0,
  chunk_count  int  default 0,
  created_at   timestamptz default now() not null
);

-- ── Chunks com embedding ──────────────────────────────────
create table public.rag_chunks (
  id           uuid default gen_random_uuid() primary key,
  document_id  uuid references public.rag_documents(id) on delete cascade not null,
  therapist_id uuid references public.profiles(id) on delete cascade not null,
  content      text not null,
  embedding    vector(1024),
  chunk_index  int  not null,
  created_at   timestamptz default now() not null
);

-- ── Índices ──────────────────────────────────────────────
create index rag_documents_therapist_idx on public.rag_documents(therapist_id);
create index rag_chunks_therapist_idx    on public.rag_chunks(therapist_id);
create index rag_chunks_document_idx     on public.rag_chunks(document_id);

-- Índice vetorial (ivfflat — bom para até ~1M chunks)
create index rag_chunks_embedding_idx on public.rag_chunks
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ── RLS ──────────────────────────────────────────────────
alter table public.rag_documents enable row level security;
alter table public.rag_chunks    enable row level security;

create policy "Terapeuta gerencia seus documentos RAG"
  on public.rag_documents for all
  using (auth.uid() = therapist_id);

create policy "Terapeuta acessa seus chunks RAG"
  on public.rag_chunks for all
  using (auth.uid() = therapist_id);

-- ── Função de busca vetorial ──────────────────────────────
create or replace function search_rag_chunks(
  query_embedding vector(1024),
  therapist_uuid  uuid,
  match_count     int default 5,
  min_similarity  float default 0.35
)
returns table (
  id          uuid,
  content     text,
  document_id uuid,
  similarity  float
)
language sql stable
as $$
  select
    rc.id,
    rc.content,
    rc.document_id,
    1 - (rc.embedding <=> query_embedding) as similarity
  from public.rag_chunks rc
  where rc.therapist_id = therapist_uuid
    and 1 - (rc.embedding <=> query_embedding) >= min_similarity
  order by rc.embedding <=> query_embedding
  limit match_count;
$$;
