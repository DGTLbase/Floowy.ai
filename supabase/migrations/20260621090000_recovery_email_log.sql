-- Tracking table for the €1 lifecycle email flows (A/B/C/D/E).
-- One row per (user, flow) guarantees each flow is sent at most once per user
-- and lets the scheduler dedupe / stop once a user has paid.

create table if not exists public.recovery_email_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  flow text not null, -- 'A' | 'B' | 'C' | 'E' (recovery) | 'D' (welcome)
  sent_at timestamptz not null default now(),
  unique (user_id, flow)
);

create index if not exists idx_recovery_email_log_user
  on public.recovery_email_log (user_id);

-- Edge functions use the service role; no public access.
alter table public.recovery_email_log enable row level security;
