-- Adiciona upload de imagem de capa aos artigos do site institucional, e cria
-- o bucket de Storage onde essas imagens ficam guardadas.
-- Execute no SQL Editor do Supabase, DEPOIS de institute_articles_migration.sql.

alter table public.institute_articles
  add column if not exists image_url text;

-- Bucket público (leitura livre — são imagens de capa de artigos públicos).
-- Escrita só acontece via API do Paideia com a service role key, que ignora RLS,
-- então não é necessária nenhuma policy de INSERT/UPDATE aqui.
insert into storage.buckets (id, name, public)
values ('institute-article-images', 'institute-article-images', true)
on conflict (id) do nothing;
