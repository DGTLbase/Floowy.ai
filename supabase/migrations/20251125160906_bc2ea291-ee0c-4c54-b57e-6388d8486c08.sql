-- Function to sync tool access based on user plan
CREATE OR REPLACE FUNCTION public.sync_tool_access_for_plan()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Delete existing tool access for this user
  DELETE FROM public.user_tool_access WHERE user_id = NEW.id;
  
  -- Free plan: Only fashion and atmospheric
  IF NEW.plan = 'free' THEN
    INSERT INTO public.user_tool_access (user_id, tool_name, has_access)
    VALUES 
      (NEW.id, 'fashion', true),
      (NEW.id, 'atmospheric', true);
  
  -- Paid plans: All tools except fashion tool 2.0
  ELSE
    INSERT INTO public.user_tool_access (user_id, tool_name, has_access)
    VALUES 
      (NEW.id, 'fashion', true),
      (NEW.id, 'atmospheric', true),
      (NEW.id, 'idea-studio', true),
      (NEW.id, 'creator-studio', true),
      (NEW.id, 'bulk-mockup', true);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update handle_new_user to use the new sync function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  
  -- Grant tool access based on plan (default is free)
  INSERT INTO public.user_tool_access (user_id, tool_name, has_access)
  VALUES 
    (NEW.id, 'fashion', true),
    (NEW.id, 'atmospheric', true);
  
  RETURN NEW;
END;
$$;

-- Create trigger to sync tool access when plan changes
DROP TRIGGER IF EXISTS on_profile_plan_change ON public.profiles;
CREATE TRIGGER on_profile_plan_change
  AFTER UPDATE OF plan ON public.profiles
  FOR EACH ROW
  WHEN (OLD.plan IS DISTINCT FROM NEW.plan)
  EXECUTE FUNCTION public.sync_tool_access_for_plan();

-- Update existing paid users to have access to all tools
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id, plan FROM public.profiles 
    WHERE plan IN ('starter', 'professional', 'enterprise')
  LOOP
    -- Delete existing tool access
    DELETE FROM public.user_tool_access WHERE user_id = user_record.id;
    
    -- Grant all tools except fashion tool 2.0
    INSERT INTO public.user_tool_access (user_id, tool_name, has_access)
    VALUES 
      (user_record.id, 'fashion', true),
      (user_record.id, 'atmospheric', true),
      (user_record.id, 'idea-studio', true),
      (user_record.id, 'creator-studio', true),
      (user_record.id, 'bulk-mockup', true);
  END LOOP;
END $$;