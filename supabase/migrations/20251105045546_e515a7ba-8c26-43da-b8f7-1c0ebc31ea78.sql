-- Add plan column to profiles table
ALTER TABLE profiles ADD COLUMN plan TEXT NOT NULL DEFAULT 'free';

-- Update the handle_new_user function to set default tool access
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, plan)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    'free'
  );
  
  INSERT INTO public.credits (user_id, balance)
  VALUES (NEW.id, 3);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Grant default access to fashion and atmospheric tools
  INSERT INTO public.user_tool_access (user_id, tool_name, has_access)
  VALUES 
    (NEW.id, 'fashion', true),
    (NEW.id, 'atmospheric', true);
  
  RETURN NEW;
END;
$$;