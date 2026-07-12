-- Cadastros pendentes de pagamento — a conta real (auth.users) só é criada
-- quando o webhook da Greenn confirma o pagamento (ver /api/webhooks/greenn).
-- Execute no SQL Editor do Supabase.

create table if not exists public.pending_registrations (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  email              text not null unique,
  password_encrypted text not null,
  approaches         text[] not null default '{}',
  category           text not null default 'individual',
  billing            text not null default 'monthly',
  status             text not null default 'pending', -- pending | completed | expired
  created_at         timestamptz not null default now()
);

alter table public.pending_registrations disable row level security;

create index if not exists pending_registrations_email_idx on public.pending_registrations(email);
