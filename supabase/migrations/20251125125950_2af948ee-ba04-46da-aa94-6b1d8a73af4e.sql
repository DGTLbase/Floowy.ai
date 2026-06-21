-- Disable failing HTTP call in send_welcome_email to prevent signup errors
CREATE OR REPLACE FUNCTION public.send_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Welcome email sending temporarily disabled because required configuration
  -- parameters (app.settings.supabase_url, app.settings.supabase_service_role_key)
  -- are not available in this environment.
  -- This no-op implementation prevents "database error saving new user" during signup.
  RETURN NEW;
END;
$function$;