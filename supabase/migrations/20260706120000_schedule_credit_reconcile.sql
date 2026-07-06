-- Scheduled safety net: run reconcile-missing-credits hourly so any conversion the
-- Stripe webhook misses is repaired automatically. The reconcile function is SAFE
-- (only credits accounts with total_credits_used == 0 and balance below plan, and
-- is idempotent per billing period), so running it on a schedule cannot refund or
-- double-credit real users.
--
-- SETUP (run ONCE in the Supabase SQL editor before/after this migration — do NOT
-- commit the key). Store the CURRENT service-role key in Vault so pg_net can
-- authenticate. Re-run this whenever the service-role key is rotated:
--
--   select vault.create_secret('<SERVICE_ROLE_KEY>', 'reconcile_service_key');
--   -- to rotate later:
--   -- select vault.update_secret(
--   --   (select id from vault.secrets where name = 'reconcile_service_key'),
--   --   '<NEW_SERVICE_ROLE_KEY>');

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Idempotent (re)scheduling: drop any prior job of the same name first.
do $$
begin
  perform cron.unschedule('reconcile-missing-credits-hourly');
exception when others then
  null; -- job didn't exist yet
end $$;

select cron.schedule(
  'reconcile-missing-credits-hourly',
  '7 * * * *',  -- hourly, at :07
  $$
  select net.http_post(
    url := 'https://wjihknoszyjwmpotsnda.supabase.co/functions/v1/reconcile-missing-credits?apply=true',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization',
        'Bearer ' || (select decrypted_secret
                        from vault.decrypted_secrets
                       where name = 'reconcile_service_key')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $$
);
