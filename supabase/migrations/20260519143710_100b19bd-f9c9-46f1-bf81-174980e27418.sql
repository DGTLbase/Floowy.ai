ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ambience_walkthrough_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ambience_walkthrough_step smallint NOT NULL DEFAULT 0;