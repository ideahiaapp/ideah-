-- Tabela para armazenar prompts de abordagem editáveis pelo admin
CREATE TABLE IF NOT EXISTS public.approach_prompts (
  approach    TEXT        PRIMARY KEY,
  prompt      TEXT        NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Sem RLS (acesso via service role no servidor)
ALTER TABLE public.approach_prompts DISABLE ROW LEVEL SECURITY;
