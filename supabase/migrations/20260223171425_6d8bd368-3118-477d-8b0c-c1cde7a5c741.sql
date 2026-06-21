
-- Add a credits_used column to track total credits consumed
ALTER TABLE public.credits ADD COLUMN IF NOT EXISTS total_credits_used integer NOT NULL DEFAULT 0;
