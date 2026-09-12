-- Artigos do site institucional (seção "Publicações Recentes"), publicáveis por
-- qualquer admin do Paideia pelo painel /dashboard/institute-articles.
-- Execute no SQL Editor do Supabase.

create table if not exists public.institute_articles (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  category      text not null default 'Artigo',
  title         text not null,
  excerpt       text not null,
  -- Texto simples: linhas em branco separam parágrafos; uma linha começando
  -- com "## " vira subtítulo (h2). Sem negrito/links/imagens no meio do texto.
  body          text not null,
  illustration  text not null default 'circles',
  published     boolean not null default false,
  published_at  timestamptz,
  created_by    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.institute_articles enable row level security;

-- Leitura pública só de artigos publicados (defesa extra — o acesso real do site
-- institucional passa pela API do Paideia com service role, não direto no Supabase).
create policy "public_read_published" on public.institute_articles
  for select using (published = true);

create index if not exists institute_articles_published_idx
  on public.institute_articles (published, published_at desc);
