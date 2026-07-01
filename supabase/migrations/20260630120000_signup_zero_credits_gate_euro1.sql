-- Gate the 10 trial credits behind the €1 payment.
--
-- Previously handle_new_user() granted 10 credits to every registration — a
-- leftover from the removed free tier. That let anyone sign up and receive the
-- trial credits without paying. New users now start at 0 credits; the 10 trial
-- credits are set only after the €1 charge (confirm-euro1 -> credits.balance = 10),
-- and plan credits are set by the Stripe webhook on subscription.
--
-- Only the credits grant changes (10 -> 0); profile, roles and tool access are
-- unchanged.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, plan)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
    'free'
  );

  -- No free credits on signup. Credits are granted only after payment
  -- (€1 offer via confirm-euro1, or a plan via the Stripe webhook).
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
