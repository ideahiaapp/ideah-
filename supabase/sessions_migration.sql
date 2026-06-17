-- Tabela de sessões da agenda
create table public.sessions (
  id            uuid default gen_random_uuid() primary key,
  therapist_id  uuid references public.profiles(id) on delete cascade not null,
  client_id     uuid references public.clients(id) on delete cascade not null,
  date          date not null,
  start_time    time not null,
  duration      integer not null default 50, -- minutos
  status        text not null default 'confirmed'
                  check (status in ('confirmed','pending','cancelled','done')),
  notes         text,
  price         numeric(10,2),
  created_at    timestamptz default now() not null,
  updated_at    timestamptz default now() not null
);

-- RLS
alter table public.sessions enable row level security;

create policy "Terapeuta gerencia suas sessões"
  on public.sessions for all
  using  (auth.uid() = therapist_id)
  with check (auth.uid() = therapist_id);

-- Índices
create index sessions_therapist_date on public.sessions(therapist_id, date);
create index sessions_client_id      on public.sessions(client_id);
