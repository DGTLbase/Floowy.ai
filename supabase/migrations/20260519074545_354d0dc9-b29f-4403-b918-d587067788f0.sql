
CREATE TABLE IF NOT EXISTS public.email_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  flow_key text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, flow_key)
);

CREATE INDEX IF NOT EXISTS email_sends_user_idx ON public.email_sends(user_id);
CREATE INDEX IF NOT EXISTS email_sends_flow_idx ON public.email_sends(flow_key);

ALTER TABLE public.email_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all email sends"
  ON public.email_sends FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role manages email sends"
  ON public.email_sends FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
