-- Adiciona horário da sessão como coluna própria (antes só existia session_date).
-- Facilita consulta/ordenação por horário nas evoluções.
-- Execute no SQL Editor do Supabase.

alter table public.evolutions
  add column if not exists session_time time;
