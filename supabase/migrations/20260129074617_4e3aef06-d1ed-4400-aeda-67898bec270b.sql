-- Update handle_new_user function to include flatlay-studio access for all new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile with phone number (email may be null initially for phone-first signup)
  INSERT INTO public.profiles (id, email, full_name, phone, plan)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, NEW.raw_user_meta_data->>'email', ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.phone, NEW.raw_user_meta_data->>'phone'),
    'free'
  );
  
  -- Add initial credits
  INSERT INTO public.credits (user_id, balance)
  VALUES (NEW.id, 3);
  
  -- Assign user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Grant tool access for free plan (including flatlay-studio for all users)
  INSERT INTO public.user_tool_access (user_id, tool_name, has_access)
  VALUES 
    (NEW.id, 'fashion', true),
    (NEW.id, 'atmospheric', true),
    (NEW.id, 'idea-studio', true),
    (NEW.id, 'creator-studio', true),
    (NEW.id, 'fashion-2.0', false),
    (NEW.id, 'flatlay-studio', true);
  
  RETURN NEW;
END;
$function$;

-- Update sync_tool_access_for_plan function to include flatlay-studio access
CREATE OR REPLACE FUNCTION public.sync_tool_access_for_plan()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete existing tool access for this user
  DELETE FROM public.user_tool_access WHERE user_id = NEW.id;
  
  -- All plans get access to all main tools (including flatlay-studio)
  INSERT INTO public.user_tool_access (user_id, tool_name, has_access)
  VALUES 
    (NEW.id, 'fashion', true),
    (NEW.id, 'atmospheric', true),
    (NEW.id, 'idea-studio', true),
    (NEW.id, 'creator-studio', true),
    (NEW.id, 'fashion-2.0', false),
    (NEW.id, 'flatlay-studio', true);
  
  RETURN NEW;
END;
$function$;