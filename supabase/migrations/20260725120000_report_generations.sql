-- Report generation (Scraper Report Briefing v1).
-- Tracks each "Create Insights Report" / "Create Contentplan" request: the plan
-- and price that applied, the source scrape, the resulting PDF, and success/
-- failure. Credits are charged ONLY on successful completion (the generate-report
-- edge function never deducts before the PDF exists), so a failed generation
-- costs nothing and no explicit refund is needed — the "auto-refund on failure"
-- requirement is satisfied by charge-on-success.
--
-- Bundle window (Professional): the 5-minute discounted-second-report price is
-- derived at request time by looking up the most recent COMPLETED report of the
-- OTHER type for the same user + project (its completed_at is the "first
-- purchase" moment). No separate timestamp column is required.

CREATE TABLE IF NOT EXISTS public.report_generations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  report_type       TEXT NOT NULL CHECK (report_type IN ('insights', 'contentplan')),
  status            TEXT NOT NULL DEFAULT 'processing'
                      CHECK (status IN ('processing', 'completed', 'failed')),

  -- Source scrape (which project / run the report is built from).
  project_id        UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  scrape_run_id     UUID REFERENCES public.scrape_runs(id) ON DELETE SET NULL,
  scrape_source     TEXT,                       -- e.g. "tiktok", "meta_ads"

  -- Form input.
  brand_name        TEXT NOT NULL,
  website_url       TEXT NOT NULL,

  -- Pricing (the price actually charged; only meaningful once status='completed').
  credits_charged   INTEGER NOT NULL DEFAULT 0,
  is_bundle_price   BOOLEAN NOT NULL DEFAULT false, -- true when the 5-credit window price applied

  -- Output.
  pdf_url           TEXT,                        -- public/download URL of the rendered PDF
  pdf_path          TEXT,                        -- storage object path
  generation_id     UUID REFERENCES public.generations(id) ON DELETE SET NULL,
  claude_message_id TEXT,                        -- Anthropic message id (audit)

  error             TEXT,

  -- Double-submit protection: a client-supplied key that dedupes retries of the
  -- same request within a scrape session.
  idempotency_key   TEXT,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at      TIMESTAMPTZ
);

-- One in-flight/settled row per (user, idempotency_key): a double submit reuses
-- the existing row instead of charging twice.
CREATE UNIQUE INDEX IF NOT EXISTS report_generations_idem_uidx
  ON public.report_generations (user_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- Fast lookup for the bundle-window price check (latest completed report of a
-- given type for a user + project).
CREATE INDEX IF NOT EXISTS report_generations_bundle_idx
  ON public.report_generations (user_id, project_id, report_type, completed_at DESC);

-- List a user's reports (My Generations / history).
CREATE INDEX IF NOT EXISTS report_generations_user_idx
  ON public.report_generations (user_id, created_at DESC);

ALTER TABLE public.report_generations ENABLE ROW LEVEL SECURITY;

-- Users can read their own reports; writes go through the service-role edge
-- function (which bypasses RLS), so no insert/update policy is granted.
DROP POLICY IF EXISTS "report_generations_select_own" ON public.report_generations;
CREATE POLICY "report_generations_select_own"
  ON public.report_generations FOR SELECT
  USING (auth.uid() = user_id);
