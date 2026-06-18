-- Tabela de perfis de terapeutas autorizados
CREATE TABLE IF NOT EXISTS public.therapist_profiles (
  user_id    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.therapist_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "self_read" ON public.therapist_profiles
  FOR SELECT USING (auth.uid() = user_id);

-- Migra todos os usuários existentes para não bloquear quem já tem conta
INSERT INTO public.therapist_profiles (user_id, email)
SELECT id, email
FROM auth.users
WHERE email IS NOT NULL
ON CONFLICT DO NOTHING;
