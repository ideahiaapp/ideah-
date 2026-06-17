-- Adiciona coluna approach em rag_documents
-- Executar no SQL Editor do Supabase

alter table public.rag_documents
  add column if not exists approach text not null default 'PSYCHOANALYSIS';

create index if not exists rag_documents_approach_idx on public.rag_documents(approach);
create index if not exists rag_chunks_approach_idx    on public.rag_chunks(therapist_id, document_id);

-- Atualiza a função de busca para filtrar por abordagem (opcional)
create or replace function search_rag_chunks(
  query_embedding vector(1024),
  therapist_uuid  uuid,
  match_count     int     default 5,
  min_similarity  float   default 0.35,
  filter_approach text    default null
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
  join public.rag_documents rd on rd.id = rc.document_id
  where rc.therapist_id = therapist_uuid
    and 1 - (rc.embedding <=> query_embedding) >= min_similarity
    and (filter_approach is null or rd.approach = filter_approach)
  order by rc.embedding <=> query_embedding
  limit match_count;
$$;
