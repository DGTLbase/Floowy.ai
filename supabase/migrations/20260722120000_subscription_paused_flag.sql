-- Track a paused subscription distinctly from a canceled/free one.
-- When a user pauses billing (Stripe pause_collection), their plan is set to
-- 'free' so existing tier gating revokes access, and this flag records that the
-- downgrade is a *pause* (resumable) rather than a cancellation. Reactivation
-- clears it and restores the plan from the Stripe price.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS subscription_paused BOOLEAN NOT NULL DEFAULT false;
