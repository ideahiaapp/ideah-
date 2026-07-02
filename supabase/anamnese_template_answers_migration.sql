-- Adiciona coluna para respostas dinâmicas do template de anamnese
ALTER TABLE anamneses ADD COLUMN IF NOT EXISTS template_answers JSONB;
