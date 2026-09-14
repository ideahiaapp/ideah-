-- Adiciona a fonte (nome do documento) ao retorno da busca RAG, para que a IA
-- possa sempre informar de qual material veio cada citação/referência.
-- Execute no SQL Editor do Supabase, DEPOIS das migrações rag_* anteriores.

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
  is_global   boolean,
  source      text
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rc.content,
    1 - (rc.embedding <=> query_embedding) AS similarity,
    rc.is_global,
    rd.name AS source
  FROM rag_chunks rc
  JOIN rag_documents rd ON rd.id = rc.document_id
  WHERE
    -- chunks do próprio terapeuta OU base global
    (rc.therapist_id = therapist_uuid OR rc.is_global = TRUE)
    -- filtro de abordagem (opcional — base global ignora filtro)
    AND (
      filter_approach IS NULL
      OR rc.is_global = TRUE
      OR rd.approach = filter_approach
    )
    AND 1 - (rc.embedding <=> query_embedding) >= min_similarity
  ORDER BY rc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
