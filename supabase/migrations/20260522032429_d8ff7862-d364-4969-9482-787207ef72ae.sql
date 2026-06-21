ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tool_walkthroughs_seen jsonb NOT NULL DEFAULT '{}'::jsonb;