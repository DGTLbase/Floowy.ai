-- Hourly cron that runs the €1 non-payer recovery sequence (check-recovery-emails
-- sends flows A/B/C/E at 24h/48h/7d/30d). Flow D is triggered on payment, not here.
--
-- Uses the public anon key only to pass the Functions gateway (the function itself
-- uses the service role internally via its own env), so no Vault secret is needed.

create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('recovery-emails-hourly')
where exists (select 1 from cron.job where jobname = 'recovery-emails-hourly');

select cron.schedule(
  'recovery-emails-hourly',
  '0 * * * *', -- top of every hour
  $$
  select net.http_post(
    url := 'https://wjihknoszyjwmpotsnda.supabase.co/functions/v1/check-recovery-emails',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqaWhrbm9zenlqd21wb3RzbmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzQyNTYsImV4cCI6MjA5NzAxMDI1Nn0.s8HRjZxX8OBKwrJ4d2fpAiryKz8n27AlxQGV3hkUHjs',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqaWhrbm9zenlqd21wb3RzbmRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE0MzQyNTYsImV4cCI6MjA5NzAxMDI1Nn0.s8HRjZxX8OBKwrJ4d2fpAiryKz8n27AlxQGV3hkUHjs'
    ),
    body := '{}'::jsonb
  );
  $$
);
