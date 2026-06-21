
-- 1) credits: drop user self-update policy (balance changes must go through deduct_credits SECURITY DEFINER function or service role)
DROP POLICY IF EXISTS "Users can update their own credits" ON public.credits;

-- 2) profiles: drop broad authenticated read policy that exposed email/phone of all users
DROP POLICY IF EXISTS "Authenticated users can view names" ON public.profiles;

-- Helper RPC for community/comments to display only safe public fields
CREATE OR REPLACE FUNCTION public.get_profile_names(_user_ids uuid[])
RETURNS TABLE(id uuid, full_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, full_name, avatar_url
  FROM public.profiles
  WHERE id = ANY(_user_ids);
$$;

GRANT EXECUTE ON FUNCTION public.get_profile_names(uuid[]) TO authenticated, anon;

-- 3) products storage bucket: drop broad authenticated upload/update policies; keep path-scoped ones and add admin override
DROP POLICY IF EXISTS "Allow authenticated uploads to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to products bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to products bucket" ON storage.objects;

CREATE POLICY "Users can update their own product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'products' AND (auth.uid())::text = (storage.foldername(name))[1])
WITH CHECK (bucket_id = 'products' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'products' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can manage products bucket"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'products' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'products' AND public.has_role(auth.uid(), 'admin'));

-- 4) scheduled_emails: restrict service-role catch-all to service_role only (was {public})
DROP POLICY IF EXISTS "Service role can manage scheduled emails" ON public.scheduled_emails;
CREATE POLICY "Service role can manage scheduled emails"
ON public.scheduled_emails
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 5) user_purchased_models: drop user-facing INSERT (purchases must come from confirm-model-purchase edge function using service role)
DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.user_purchased_models;
