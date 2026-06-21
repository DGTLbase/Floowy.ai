-- Update sync_tool_access_for_plan to properly tier tool access based on plan
CREATE OR REPLACE FUNCTION public.sync_tool_access_for_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete existing tool access for this user
  DELETE FROM public.user_tool_access WHERE user_id = NEW.id;
  
  -- Free plan: Fashion and Atmospheric only
  IF NEW.plan = 'free' THEN
    INSERT INTO public.user_tool_access (user_id, tool_name, has_access)
    VALUES 
      (NEW.id, 'fashion', true),
      (NEW.id, 'atmospheric', true),
      (NEW.id, 'idea-studio', false),
      (NEW.id, 'creator-studio', false),
      (NEW.id, 'fashion-2.0', false);
  
  -- Starter plan: Fashion and Atmospheric
  ELSIF NEW.plan = 'starter' THEN
    INSERT INTO public.user_tool_access (user_id, tool_name, has_access)
    VALUES 
      (NEW.id, 'fashion', true),
      (NEW.id, 'atmospheric', true),
      (NEW.id, 'idea-studio', false),
      (NEW.id, 'creator-studio', false),
      (NEW.id, 'fashion-2.0', false);
  
  -- Professional plan: Adds Idea Studio (Product Photos)
  ELSIF NEW.plan = 'professional' THEN
    INSERT INTO public.user_tool_access (user_id, tool_name, has_access)
    VALUES 
      (NEW.id, 'fashion', true),
      (NEW.id, 'atmospheric', true),
      (NEW.id, 'idea-studio', true),
      (NEW.id, 'creator-studio', false),
      (NEW.id, 'fashion-2.0', false);
  
  -- Enterprise plan: All tools including Creator Studio
  ELSIF NEW.plan = 'enterprise' THEN
    INSERT INTO public.user_tool_access (user_id, tool_name, has_access)
    VALUES 
      (NEW.id, 'fashion', true),
      (NEW.id, 'atmospheric', true),
      (NEW.id, 'idea-studio', true),
      (NEW.id, 'creator-studio', true),
      (NEW.id, 'fashion-2.0', false);
  
  -- Default: Same as free plan
  ELSE
    INSERT INTO public.user_tool_access (user_id, tool_name, has_access)
    VALUES 
      (NEW.id, 'fashion', true),
      (NEW.id, 'atmospheric', true),
      (NEW.id, 'idea-studio', false),
      (NEW.id, 'creator-studio', false),
      (NEW.id, 'fashion-2.0', false);
  END IF;
  
  RETURN NEW;
END;
$function$;