-- Daricha Sundari · Iniciação e Qualificação em Terapêutica Tântrica
-- Captura de interesse da apresentação web (tracking de funil + leads).
--
-- Rode este arquivo no projeto Supabase dedicado a esta apresentação
-- (SQL Editor do Supabase, ou `supabase db push` se preferir migrations).

create table if not exists public.daricha_events (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  session_id   text not null,
  event_type   text not null check (event_type in ('start', 'slide_view', 'cta_click')),
  slide_index  integer not null,
  slide_id     text not null,
  url          text,
  referrer     text,
  device       text,
  user_agent   text,
  name         text
);

create index if not exists daricha_events_created_at_idx on public.daricha_events (created_at);
create index if not exists daricha_events_session_idx on public.daricha_events (session_id);
create index if not exists daricha_events_type_idx on public.daricha_events (event_type);

alter table public.daricha_events enable row level security;

-- Qualquer visitante (chave anon) pode registrar seus próprios eventos de navegação.
drop policy if exists "daricha_events_public_insert" on public.daricha_events;
create policy "daricha_events_public_insert"
  on public.daricha_events
  for insert
  to anon
  with check (true);

-- Ninguém lê pela chave anon — a leitura do painel /interessados usa a
-- service role key, só disponível no servidor (nunca no navegador).
drop policy if exists "daricha_events_no_public_select" on public.daricha_events;
create policy "daricha_events_no_public_select"
  on public.daricha_events
  for select
  to anon
  using (false);
