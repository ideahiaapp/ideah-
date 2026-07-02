-- Adiciona coluna approach na tabela anamneses
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS approach TEXT;
