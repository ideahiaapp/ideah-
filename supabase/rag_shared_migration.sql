-- Recria search_rag_chunks sem filtro por terapeuta
-- Todos os documentos ficam disponíveis para todos os terapeutas
DROP FUNCTION IF EXISTS search_rag_chunks(vector, uuid, int, float, text);
DROP FUNCTION IF EXISTS search_rag_chunks(vector(1024), uuid, int, float, text);

CREATE OR REPLACE FUNCTION search_rag_chunks(
  query_embedding  vector(1024),
  therapist_uuid   uuid,          -- mantido na assinatura para compatibilidade, ignorado
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
    -- sem filtro por terapeuta: todos os documentos são compartilhados
    (
      filter_approach IS NULL
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
