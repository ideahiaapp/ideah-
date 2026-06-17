-- ============================================================
-- IDEAh — Schema Supabase
-- Executar no SQL Editor do painel Supabase
-- ============================================================

-- ── Extensões ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Perfis de terapeuta ────────────────────────────────────
create table public.profiles (
  id         uuid references auth.users on delete cascade primary key,
  name       text,
  email      text,
  crp        text,
  created_at timestamptz default now() not null
);

-- ── Clientes (pacientes) ───────────────────────────────────
create table public.clients (
  id                 uuid default gen_random_uuid() primary key,
  therapist_id       uuid references public.profiles(id) on delete cascade not null,
  name               text not null,
  email              text,
  phone              text,
  birth_date         date,
  approach           text,
  approach_label     text,
  status             text default 'ACTIVE' not null,
  start_date         date,
  last_session       timestamptz,
  next_session       timestamptz,
  total_sessions     int default 0 not null,
  session_frequency  text,
  session_duration   int default 50 not null,
  initials           text,
  color              text,
  occupation         text,
  referral           text,
  main_demand        text,
  notes              text,
  emergency_contact  text,
  created_at         timestamptz default now() not null,
  updated_at         timestamptz default now() not null
);

-- ── Evoluções clínicas ─────────────────────────────────────
create table public.evolutions (
  id                uuid default gen_random_uuid() primary key,
  therapist_id      uuid references public.profiles(id) on delete cascade not null,
  client_id         uuid references public.clients(id) on delete cascade not null,
  session_date      date not null,
  content           text not null,
  hypothesis        text,
  interventions     text,
  next_session_plan text,
  mood              int check (mood between 1 and 5),
  ai_hypothesis     text,
  session_number    int,
  cfp_confirmed     boolean default false not null,
  created_at        timestamptz default now() not null,
  updated_at        timestamptz default now() not null
);

-- ── Sessões de supervisão ──────────────────────────────────
create table public.supervisions (
  id             uuid default gen_random_uuid() primary key,
  therapist_id   uuid references public.profiles(id) on delete cascade not null,
  client_id      uuid references public.clients(id) on delete set null,
  title          text not null,
  approach       text not null,
  messages_count int default 0 not null,
  created_at     timestamptz default now() not null,
  updated_at     timestamptz default now() not null
);

-- ── Mensagens de supervisão ────────────────────────────────
create table public.supervision_messages (
  id              uuid default gen_random_uuid() primary key,
  supervision_id  uuid references public.supervisions(id) on delete cascade not null,
  role            text not null check (role in ('user', 'assistant')),
  content         text not null,
  created_at      timestamptz default now() not null
);

-- ============================================================
-- Row Level Security — cada terapeuta só vê seus dados
-- ============================================================

alter table public.profiles            enable row level security;
alter table public.clients             enable row level security;
alter table public.evolutions          enable row level security;
alter table public.supervisions        enable row level security;
alter table public.supervision_messages enable row level security;

-- profiles
create policy "Terapeuta vê seu próprio perfil"
  on public.profiles for all
  using (auth.uid() = id);

-- clients
create policy "Terapeuta gerencia seus clientes"
  on public.clients for all
  using (auth.uid() = therapist_id);

-- evolutions
create policy "Terapeuta gerencia suas evoluções"
  on public.evolutions for all
  using (auth.uid() = therapist_id);

-- supervisions
create policy "Terapeuta gerencia suas supervisões"
  on public.supervisions for all
  using (auth.uid() = therapist_id);

-- supervision_messages: acesso via supervisão do terapeuta
create policy "Terapeuta acessa mensagens de suas supervisões"
  on public.supervision_messages for all
  using (
    exists (
      select 1 from public.supervisions s
      where s.id = supervision_id
        and s.therapist_id = auth.uid()
    )
  );

-- ============================================================
-- Trigger: criar perfil automaticamente ao fazer signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- Índices para performance
-- ============================================================

create index clients_therapist_id_idx       on public.clients(therapist_id);
create index evolutions_therapist_id_idx    on public.evolutions(therapist_id);
create index evolutions_client_id_idx       on public.evolutions(client_id);
create index supervisions_therapist_id_idx  on public.supervisions(therapist_id);
create index supervisions_client_id_idx     on public.supervisions(client_id);
create index sup_messages_supervision_idx   on public.supervision_messages(supervision_id);
