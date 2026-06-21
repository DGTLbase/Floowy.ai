DO $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id
  FROM public.profiles
  WHERE email = 'jefcgealon@gmail.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Profile not found for jefcgealon@gmail.com';
  END IF;

  UPDATE public.user_tool_access
  SET has_access = true,
      updated_at = now()
  WHERE user_id = v_user_id
    AND tool_name = 'fashion-2.0';

  IF NOT FOUND THEN
    INSERT INTO public.user_tool_access (user_id, tool_name, has_access)
    VALUES (v_user_id, 'fashion-2.0', true);
  END IF;
END $$;