-- Persistent log of Stripe-webhook processing errors that were acknowledged (200)
-- to avoid Stripe's redelivery retry loop (the "continuous loop" on plan change /
-- retention-discount / downgrade). Surfaces the rare transient failure instead of
-- it living only in ephemeral function logs.
--
-- NOTE: credit-specific misses are ALSO auto-repaired hourly by the existing
-- reconcile-missing-credits cron, so those self-heal regardless of this table.

create table if not exists public.webhook_failures (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source text not null,          -- which webhook function produced the error
  event_type text,               -- Stripe event type (e.g. customer.subscription.updated)
  event_id text,                 -- Stripe event id, for dedupe / lookup in the Stripe dashboard
  error text,                    -- error message
  resolved boolean not null default false
);

alter table public.webhook_failures enable row level security;

-- No public policy: the edge functions write via the service role (which bypasses
-- RLS), and the row set is inspected via the service role / SQL editor / admin.
-- Normal end users can never read it.

create index if not exists webhook_failures_created_at_idx
  on public.webhook_failures (created_at desc);

create index if not exists webhook_failures_unresolved_idx
  on public.webhook_failures (created_at desc)
  where resolved = false;
