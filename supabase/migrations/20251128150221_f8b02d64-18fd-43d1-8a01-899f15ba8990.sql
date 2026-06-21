-- Update sync_tool_access_for_plan to give all tools to all plans
CREATE OR REPLACE FUNCTION public.sync_tool_access_for_plan()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Delete existing tool access for this user
  DELETE FROM public.user_tool_access WHERE user_id = NEW.id;
  
  -- All plans get access to all main tools
  INSERT INTO public.user_tool_access (user_id, tool_name, has_access)
  VALUES 
    (NEW.id, 'fashion', true),
    (NEW.id, 'atmospheric', true),
    (NEW.id, 'idea-studio', true),
    (NEW.id, 'creator-studio', true),
    (NEW.id, 'fashion-2.0', false);
  
  RETURN NEW;
END;
$function$;