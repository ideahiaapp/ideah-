-- Vincula cliente à anamnese que originou o cadastro
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS anamnese_id UUID REFERENCES public.anamneses(id) ON DELETE SET NULL;
