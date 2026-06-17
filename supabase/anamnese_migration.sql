-- ============================================================
-- IDEAh — Anamnese Migration
-- Executar no SQL Editor do Supabase
-- ============================================================

create table public.anamneses (
  id                    uuid default gen_random_uuid() primary key,
  therapist_id          uuid references public.profiles(id) on delete cascade not null,

  -- Dados pessoais
  email                 text not null,
  name                  text not null,
  phone                 text,
  cpf                   text,
  birth_date            date,
  emergency_contact     text,
  how_found             text,
  accepts_email         boolean default true,

  -- Saúde
  conditions            text[] default '{}',
  latex_allergy         boolean default false,
  oil_allergy           text,
  medication            text,

  -- Estado emocional / intenção
  emotional_state       text,
  body_pain             text,
  intention             text,
  sexual_discomfort     text,

  -- Consentimentos
  consent_nudity        boolean default false,
  consent_touch         boolean default false,
  consent_therapeutic   boolean default false,
  consent_payment       boolean default false,

  -- Status
  status                text default 'PENDING' not null,

  created_at            timestamptz default now() not null,
  updated_at            timestamptz default now() not null
);

create index anamneses_therapist_id_idx on public.anamneses(therapist_id);
create index anamneses_status_idx       on public.anamneses(status);

-- RLS: terapeuta só vê suas próprias anamneses
alter table public.anamneses enable row level security;

create policy "Terapeuta gerencia suas anamneses"
  on public.anamneses for all
  using (auth.uid() = therapist_id);

-- Permite insert público (cliente sem login)
create policy "Público pode submeter anamnese"
  on public.anamneses for insert
  with check (true);

-- Perfis: permite leitura pública do nome do terapeuta (para exibir na página da anamnese)
create policy "Leitura pública de perfil"
  on public.profiles for select
  using (true);
