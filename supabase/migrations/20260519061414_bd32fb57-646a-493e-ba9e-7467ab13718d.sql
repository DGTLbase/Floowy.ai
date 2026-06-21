ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS walkthrough_completed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS walkthrough_step smallint NOT NULL DEFAULT 0;