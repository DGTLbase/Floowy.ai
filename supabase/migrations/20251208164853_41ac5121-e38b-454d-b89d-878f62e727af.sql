-- Fix password_reset_tokens RLS policies - this table should only be accessed via service role

-- Drop the overly permissive policy that allows unrestricted access
DROP POLICY IF EXISTS "Service role can manage password reset tokens" ON public.password_reset_tokens;

-- No user-facing policies needed - this table is accessed only by edge functions using service role key
-- The service role bypasses RLS entirely, so authenticated users cannot access these tokens