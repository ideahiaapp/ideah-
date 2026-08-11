-- Tabela de respostas da Pesquisa de Satisfação (Validação do MVP)
CREATE TABLE IF NOT EXISTS satisfaction_survey_responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id  UUID REFERENCES auth.users(id),
  therapist_name  TEXT,
  therapist_email TEXT,
  answers       JSONB NOT NULL,
  platform      TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
