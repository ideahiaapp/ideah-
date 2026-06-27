-- Bases teóricas adquiridas por cada terapeuta
CREATE TABLE IF NOT EXISTS public.therapist_approaches (
  therapist_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approach      TEXT        NOT NULL,
  acquired_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (therapist_id, approach)
);

ALTER TABLE public.therapist_approaches DISABLE ROW LEVEL SECURITY;
