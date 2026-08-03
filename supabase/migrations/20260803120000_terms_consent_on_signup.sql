-- Explicit Terms & Conditions + Privacy Policy consent, recorded at account
-- creation (GDPR / EU consumer law: consent must be explicit, unambiguous, and
-- provable per user).
--
-- Consent is captured in the signup form and passed through
-- supabase.auth.signUp(options.data), which lands in auth.users.raw_user_meta_data.
-- This trigger copies it onto the profile in the same transaction that creates
-- the account, so an account can never exist without its consent record — a
-- separate client-side write could fail or be skipped after the user is created.
--
-- The ACCEPTED-AT TIMESTAMP IS SERVER-GENERATED (now()), never taken from the
-- client: a client-supplied timestamp is neither trustworthy nor useful as
-- proof. The client only asserts *that* consent was given, plus which document
-- versions were shown (see src/content/legal.ts → version fields).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT,
  ADD COLUMN IF NOT EXISTS privacy_version TEXT;

COMMENT ON COLUMN public.profiles.terms_accepted_at IS
  'Server time at which the user explicitly accepted the T&C + Privacy Policy during signup. NULL = no recorded consent (pre-existing accounts, and OAuth signups until that flow captures consent too).';
COMMENT ON COLUMN public.profiles.terms_version IS
  'Version label of the Terms & Conditions shown at acceptance (e.g. "Version July 2026").';
COMMENT ON COLUMN public.profiles.privacy_version IS
  'Version label of the Privacy Policy shown at acceptance (e.g. "Version November 2025").';

-- Unchanged from the previous definition except for the three consent columns.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, phone, plan,
    terms_accepted_at, terms_version, privacy_version
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
    'free',
    -- String comparison, not a ::boolean cast: a malformed value must never
    -- raise and abort account creation.
    CASE WHEN NEW.raw_user_meta_data->>'terms_accepted' = 'true' THEN now() ELSE NULL END,
    CASE WHEN NEW.raw_user_meta_data->>'terms_accepted' = 'true'
         THEN NEW.raw_user_meta_data->>'terms_version' ELSE NULL END,
    CASE WHEN NEW.raw_user_meta_data->>'terms_accepted' = 'true'
         THEN NEW.raw_user_meta_data->>'privacy_version' ELSE NULL END
  );

  INSERT INTO public.credits (user_id, balance)
  VALUES (NEW.id, 10);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  INSERT INTO public.user_tool_access (user_id, tool_name, has_access)
  VALUES
    (NEW.id, 'fashion', true),
    (NEW.id, 'atmospheric', true),
    (NEW.id, 'idea-studio', true),
    (NEW.id, 'creator-studio', true),
    (NEW.id, 'fashion-2.0', true),
    (NEW.id, 'flatlay-studio', true),
    (NEW.id, 'ads_listing', true),
    (NEW.id, 'virtual-tour', true);

  RETURN NEW;
END;
$function$;
