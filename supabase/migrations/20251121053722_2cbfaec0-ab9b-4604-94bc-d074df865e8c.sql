-- Create a function to send welcome email after user signup
CREATE OR REPLACE FUNCTION public.send_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_first_name TEXT;
BEGIN
  -- Extract first name from user metadata
  user_first_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Call the edge function to send welcome email
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
    ),
    body := jsonb_build_object(
      'email', NEW.email,
      'firstName', user_first_name
    )
  );

  RETURN NEW;
END;
$$;

-- Create trigger to send welcome email after user creation
DROP TRIGGER IF EXISTS send_welcome_email_trigger ON auth.users;
CREATE TRIGGER send_welcome_email_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_email();

-- Store Supabase URL and service role key in app settings
DO $$
BEGIN
  -- Only set if not already set
  PERFORM set_config('app.settings.supabase_url', 'https://fjzifykgvdsownlscgct.supabase.co', false);
  PERFORM set_config('app.settings.supabase_service_role_key', current_setting('service_role.jwt_secret', true), false);
END $$;