-- Uso de IA por terapeuta + limites configuráveis por plano

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'trial';

CREATE TABLE IF NOT EXISTS plan_limits (
  plan                 TEXT PRIMARY KEY,
  monthly_token_limit  BIGINT NOT NULL,
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO plan_limits (plan, monthly_token_limit) VALUES
  ('trial',  200000),
  ('pro',    2000000),
  ('clinic', 8000000)
ON CONFLICT (plan) DO NOTHING;

CREATE TABLE IF NOT EXISTS ai_usage_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id   UUID NOT NULL,
  provider       TEXT NOT NULL,
  model          TEXT,
  feature        TEXT NOT NULL,
  input_tokens   INTEGER NOT NULL DEFAULT 0,
  output_tokens  INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_usage_log_therapist_month_idx
  ON ai_usage_log (therapist_id, created_at);

-- Lista de administradores (fonte única de verdade, substitui ADMIN_EMAILS hardcoded no código)
CREATE TABLE IF NOT EXISTS admins (
  email       TEXT PRIMARY KEY,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO admins (email) VALUES
  ('carlos.magno@gmail.com'),
  ('betinha.potter@gmail.com'),
  ('elimarcia.philos@gmail.com'),
  ('ideahiaapp@gmail.com')
ON CONFLICT (email) DO NOTHING;

ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Usuários autenticados podem ler a lista (usada apenas para exibir/ocultar UI no cliente;
-- a autorização real das rotas admin é feita no servidor via requireAdmin(), que verifica
-- o token de sessão com o Supabase Auth antes de consultar esta tabela).
CREATE POLICY "authenticated users can read admins" ON admins
  FOR SELECT TO authenticated USING (true);
