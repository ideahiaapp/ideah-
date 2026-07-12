-- Adiciona abordagem teórica utilizada e duração da supervisão (em segundos) na evolução.
-- Execute no SQL Editor do Supabase.

alter table public.evolutions
  add column if not exists approach text,
  add column if not exists duration_seconds integer;
