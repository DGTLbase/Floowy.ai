-- Update the handle_new_user function to include fashion-2.0 tool access
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, plan)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'free'
  );
  
  -- Add initial credits
  INSERT INTO public.credits (user_id, balance)
  VALUES (NEW.id, 3);
  
  -- Assign user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Grant tool access for free plan (all tools)
  INSERT INTO public.user_tool_access (user_id, tool_name, has_access)
  VALUES 
    (NEW.id, 'fashion', true),
    (NEW.id, 'fashion-2.0', false),
    (NEW.id, 'atmospheric', true),
    (NEW.id, 'idea-studio', true),
    (NEW.id, 'creator-studio', true),
    (NEW.id, 'bulk-mockup', true);
  
  RETURN NEW;
END;
$function$;

-- Update sync_tool_access_for_plan function to include fashion-2.0
CREATE OR REPLACE FUNCTION public.sync_tool_access_for_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete existing tool access for this user
  DELETE FROM public.user_tool_access WHERE user_id = NEW.id;
  
  -- All plans: Grant access to all tools
  INSERT INTO public.user_tool_access (user_id, tool_name, has_access)
  VALUES 
    (NEW.id, 'fashion', true),
    (NEW.id, 'fashion-2.0', false),
    (NEW.id, 'atmospheric', true),
    (NEW.id, 'idea-studio', true),
    (NEW.id, 'creator-studio', true),
    (NEW.id, 'bulk-mockup', true);
  
  RETURN NEW;
END;
$function$;