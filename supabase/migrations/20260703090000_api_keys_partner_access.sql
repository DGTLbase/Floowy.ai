-- Partner API access: admin-provisioned keys with per-request pricing against
-- a prepaid credit balance. Keys are stored HASHED (sha256); the plaintext is
-- shown once at creation. All access goes through edge functions with the
-- service role — no client/RLS access to these tables.

CREATE TABLE IF NOT EXISTS public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash text NOT NULL UNIQUE,          -- sha256 hex of the full key
  key_prefix text NOT NULL,               -- e.g. flw_live_ab12… (display only)
  partner_name text NOT NULL,
  partner_email text,
  price_per_credit numeric(10,4) NOT NULL DEFAULT 0.20,  -- EUR, admin-set
  credits_balance integer NOT NULL DEFAULT 0,            -- prepaid, depletes per call
  allowed_tools text[] NOT NULL DEFAULT '{ambience}',
  status text NOT NULL DEFAULT 'active',  -- active | revoked
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  tool text NOT NULL,
  credits_charged integer NOT NULL DEFAULT 1,
  price_per_credit numeric(10,4) NOT NULL,  -- snapshot at call time
  request_id text,
  status text NOT NULL DEFAULT 'ok',        -- ok | error
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS api_usage_key_created_idx ON public.api_usage (api_key_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.api_credit_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
  credits integer NOT NULL,
  amount_eur numeric(10,2) NOT NULL,
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Service-role only: enable RLS with no policies so anon/authenticated see nothing.
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_credit_purchases ENABLE ROW LEVEL SECURITY;

-- Atomic top-up (admin, after the partner purchases credits).
CREATE OR REPLACE FUNCTION public.api_topup_credits(p_key_id uuid, p_credits integer)
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_balance integer;
BEGIN
  UPDATE public.api_keys
  SET credits_balance = credits_balance + p_credits
  WHERE id = p_key_id
  RETURNING credits_balance INTO v_balance;
  RETURN v_balance;
END;
$$;

-- Atomic per-call deduction: only succeeds if the key is active, the tool is
-- allowed, and there is balance. Returns the new balance or -1 if rejected.
CREATE OR REPLACE FUNCTION public.api_consume_credit(p_key_hash text, p_tool text, p_cost integer DEFAULT 1)
RETURNS TABLE (key_id uuid, new_balance integer, price numeric)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.api_keys k
  SET credits_balance = k.credits_balance - p_cost,
      last_used_at = now()
  WHERE k.key_hash = p_key_hash
    AND k.status = 'active'
    AND p_tool = ANY(k.allowed_tools)
    AND k.credits_balance >= p_cost
  RETURNING k.id, k.credits_balance, k.price_per_credit;
END;
$$;
