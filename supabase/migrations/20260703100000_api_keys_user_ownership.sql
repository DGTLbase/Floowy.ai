-- API keys belong to users; API access is a Professional/Enterprise perk.
-- Admin can create a key for any user; pro/enterprise users can create their own.
ALTER TABLE public.api_keys ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE INDEX IF NOT EXISTS api_keys_user_idx ON public.api_keys (user_id);
