-- Consent capture for signup paths that cannot carry metadata into
-- handle_new_user — primarily Google OAuth.
--
-- supabase.auth.signInWithOAuth() has no user-metadata channel (its queryParams
-- go to the provider, not to Supabase), and the account is created during the
-- OAuth callback, so there is no moment before insert at which the app can
-- attach consent. Those users are therefore created with terms_accepted_at
-- NULL and must record consent immediately afterwards, via this function.
--
-- Why an RPC instead of a direct table update: the "Users can update their own
-- profile" policy lets the client write profiles directly, which would make the
-- acceptance timestamp client-asserted. Here now() is generated server-side, so
-- the recorded time is trustworthy as evidence.

CREATE OR REPLACE FUNCTION public.record_terms_acceptance(
  p_terms_version TEXT,
  p_privacy_version TEXT
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_existing timestamptz;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'record_terms_acceptance: not authenticated';
  END IF;

  SELECT terms_accepted_at INTO v_existing
  FROM public.profiles
  WHERE id = v_uid;

  -- Idempotent by design: the FIRST acceptance is the legally meaningful one.
  -- Re-running (double submit, retry, a second device) must never move the
  -- timestamp or relabel which document version was actually agreed to.
  IF v_existing IS NOT NULL THEN
    RETURN v_existing;
  END IF;

  UPDATE public.profiles
     SET terms_accepted_at = now(),
         terms_version     = p_terms_version,
         privacy_version   = p_privacy_version
   WHERE id = v_uid
  RETURNING terms_accepted_at INTO v_existing;

  RETURN v_existing;
END;
$function$;

REVOKE ALL ON FUNCTION public.record_terms_acceptance(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_terms_acceptance(TEXT, TEXT) TO authenticated;

COMMENT ON FUNCTION public.record_terms_acceptance(TEXT, TEXT) IS
  'Records the caller''s T&C + Privacy acceptance with a server-generated timestamp. Idempotent: never overwrites an existing acceptance. Used by OAuth signups and by the post-auth consent gate.';
