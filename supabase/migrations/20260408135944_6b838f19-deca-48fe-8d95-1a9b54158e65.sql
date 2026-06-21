CREATE TABLE public.credit_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount integer NOT NULL,
  balance_after integer NOT NULL,
  action_type text NOT NULL DEFAULT 'manual',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_history_user_id ON public.credit_history(user_id);
CREATE INDEX idx_credit_history_created_at ON public.credit_history(created_at DESC);

ALTER TABLE public.credit_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all credit history"
  ON public.credit_history FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role can insert credit history"
  ON public.credit_history FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view their own credit history"
  ON public.credit_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);