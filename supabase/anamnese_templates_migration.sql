-- Tabela de templates de anamnese por abordagem terapêutica
CREATE TABLE IF NOT EXISTS anamnese_templates (
  approach    TEXT PRIMARY KEY,
  content     TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
