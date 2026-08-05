-- Restore the zero-credit signup gate.
--
-- REGRESSION BEING FIXED
-- 20260630120000_signup_zero_credits_gate_euro1.sql changed the signup grant
-- from 10 credits to 0, so the trial credits sit behind the €1 payment.
-- 20260803120000_terms_consent_on_signup.sql then rewrote handle_new_user() to
-- add the consent columns, but rebuilt its body from the OLDER 20260529160725
-- definition and so silently reinstated `VALUES (NEW.id, 10)`. Since that
-- migration was applied, every registration has again received 10 free credits
-- without paying.
--
-- This is the same function with the grant back at 0 and the consent columns
-- kept. Nothing else changes: profile, roles and tool access are identical.
--
-- The 10 trial credits are still granted after the €1 charge (confirm-euro1
-- sets credits.balance = 10) and plan credits by the Stripe webhook, so this
-- only removes the unpaid grant.

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

  -- 0, NOT 10. The trial credits are gated behind the €1 payment.
  INSERT INTO public.credits (user_id, balance)
  VALUES (NEW.id, 0);

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
