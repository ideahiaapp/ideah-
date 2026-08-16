-- Permite que um cliente seja cadastrado com mais de uma abordagem terapêutica
-- (dentre as que o terapeuta tem contratadas). Mantém as colunas antigas
-- "approach"/"approach_label" (primeira abordagem selecionada) para
-- compatibilidade com telas/relatórios que ainda leem só uma abordagem por
-- cliente. Execute no SQL Editor do Supabase.

alter table public.clients
  add column if not exists approaches text[] not null default '{}';

-- Preenche a partir do dado já existente, para clientes cadastrados antes desta mudança.
update public.clients
  set approaches = array[approach]
  where approach is not null and approaches = '{}';
