-- 1. Adiciona flag de base global nos documentos e chunks
ALTER TABLE public.rag_documents ADD COLUMN IF NOT EXISTS is_global BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE public.rag_chunks    ADD COLUMN IF NOT EXISTS is_global BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Remove a função antiga e recria com suporte a base global
DROP FUNCTION IF EXISTS search_rag_chunks(vector, uuid, int, float, text);
DROP FUNCTION IF EXISTS search_rag_chunks(vector(1024), uuid, int, float, text);

CREATE OR REPLACE FUNCTION search_rag_chunks(
  query_embedding  vector(1024),
  therapist_uuid   uuid,
  match_count      int     DEFAULT 5,
  min_similarity   float   DEFAULT 0.35,
  filter_approach  text    DEFAULT NULL
)
RETURNS TABLE (
  content     text,
  similarity  float,
  is_global   boolean
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.content,
    1 - (rc.embedding <=> query_embedding) AS similarity,
    rc.is_global
  FROM rag_chunks rc
  WHERE
    -- chunks do próprio terapeuta OU base global
    (rc.therapist_id = therapist_uuid OR rc.is_global = TRUE)
    -- filtro de abordagem (opcional — base global ignora filtro)
    AND (
      filter_approach IS NULL
      OR rc.is_global = TRUE
      OR EXISTS (
        SELECT 1 FROM rag_documents rd
        WHERE rd.id = rc.document_id AND rd.approach = filter_approach
      )
    )
    AND 1 - (rc.embedding <=> query_embedding) >= min_similarity
  ORDER BY rc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
