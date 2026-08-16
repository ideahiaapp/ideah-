-- Suporte a cadastros pendentes originados do login com Google: a conta
-- (auth.users) já existe nesse caso (criada no momento do OAuth), então não há
-- senha para guardar — só falta vincular therapist_profiles/therapist_approaches
-- quando o pagamento for confirmado. Ver completePendingRegistration.ts.
-- Execute no SQL Editor do Supabase.

alter table public.pending_registrations
  add column if not exists user_id uuid references auth.users(id);

alter table public.pending_registrations
  alter column password_encrypted drop not null;
