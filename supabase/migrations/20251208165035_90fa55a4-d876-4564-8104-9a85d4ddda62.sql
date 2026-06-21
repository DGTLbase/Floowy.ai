-- Fix profiles table security by adding INSERT policy
-- Only authenticated users can create their own profile record (id must match auth.uid())

CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);