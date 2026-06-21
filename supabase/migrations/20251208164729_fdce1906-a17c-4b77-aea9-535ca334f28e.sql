-- Fix user_ip_tracking RLS policies to prevent public exposure of sensitive data

-- Drop the overly permissive policy that allows unrestricted access
DROP POLICY IF EXISTS "Service role can manage IP records" ON public.user_ip_tracking;

-- The existing "Users can view their own IP records" policy is already correct (SELECT with auth.uid() = user_id)
-- We just need to ensure no public access exists

-- Add policy for INSERT - only authenticated users can insert their own records
CREATE POLICY "Users can insert their own IP records"
ON public.user_ip_tracking
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Add policy for UPDATE - only authenticated users can update their own records
CREATE POLICY "Users can update their own IP records"
ON public.user_ip_tracking
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add policy for DELETE - only authenticated users can delete their own records
CREATE POLICY "Users can delete their own IP records"
ON public.user_ip_tracking
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);