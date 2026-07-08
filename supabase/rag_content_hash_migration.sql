-- Adiciona hash de conteúdo em rag_documents para detectar duplicatas
-- Executar no SQL Editor do Supabase

alter table public.rag_documents
  add column if not exists content_hash text;

create index if not exists rag_documents_content_hash_idx on public.rag_documents(content_hash);
