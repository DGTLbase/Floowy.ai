-- Update the sync_tool_access_for_plan function to grant all tools to free plan
CREATE OR REPLACE FUNCTION public.sync_tool_access_for_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete existing tool access for this user
  DELETE FROM public.user_tool_access WHERE user_id = NEW.id;
  
  -- Free plan: All tools
  IF NEW.plan = 'free' THEN
    INSERT INTO public.user_tool_access (user_id, tool_name, has_access)
    VALUES 
      (NEW.id, 'fashion', true),
      (NEW.id, 'atmospheric', true),
      (NEW.id, 'idea-studio', true),
      (NEW.id, 'creator-studio', true),
      (NEW.id, 'bulk-mockup', true);
  
  -- Paid plans: All tools
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
$function$;