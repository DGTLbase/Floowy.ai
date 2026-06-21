-- Make email nullable temporarily during phone verification
ALTER TABLE public.profiles ALTER COLUMN email DROP NOT NULL;

-- Update the handle_new_user function to handle phone-first signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
  
  -- Grant tool access for free plan
  INSERT INTO public.user_tool_access (user_id, tool_name, has_access)
  VALUES 
    (NEW.id, 'fashion', true),
    (NEW.id, 'atmospheric', true),
    (NEW.id, 'idea-studio', true),
    (NEW.id, 'creator-studio', true),
    (NEW.id, 'fashion-2.0', false);
  
  RETURN NEW;
END;
$$;