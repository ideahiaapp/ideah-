-- Registro de aceite do Termo de Participação no Programa-Piloto e Confidencialidade.
-- Cada linha é o aceite de uma versão do termo por um usuário — histórico preservado
-- (não é upsert por usuário só), como pede o próprio termo (item 18: "versão do Termo aceita").
-- Execute no SQL Editor do Supabase.

create table if not exists public.pilot_term_acceptances (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  email        text not null,
  name         text,
  term_version text not null,
  accepted_at  timestamptz not null default now(),
  unique (user_id, term_version)
);

alter table public.pilot_term_acceptances enable row level security;

create policy "self_read" on public.pilot_term_acceptances
  for select using (auth.uid() = user_id);

create policy "self_insert" on public.pilot_term_acceptances
  for insert with check (auth.uid() = user_id);

create index if not exists pilot_term_acceptances_user_idx on public.pilot_term_acceptances(user_id);
