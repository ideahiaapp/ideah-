-- Bases teóricas adquiridas pelo terapeuta-cliente no momento do cadastro
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS purchased_approaches text[] NOT NULL DEFAULT '{}';
