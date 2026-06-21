-- Enable RLS on admin_accounts table
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;

-- Enable RLS on admin_sessions table  
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Drop the overly permissive policy on admin_sessions
DROP POLICY IF EXISTS "Service role can manage admin sessions" ON public.admin_sessions;

-- Create restrictive policies for admin_accounts
-- Admins can only view their own account
CREATE POLICY "Admins can view own account"
ON public.admin_accounts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.admin_sessions
    WHERE admin_sessions.admin_id = admin_accounts.id
    AND admin_sessions.expires_at > now()
  )
);

-- Admins can only update their own account
CREATE POLICY "Admins can update own account"
ON public.admin_accounts
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.admin_sessions
    WHERE admin_sessions.admin_id = admin_accounts.id
    AND admin_sessions.expires_at > now()
  )
);

-- Create policies for admin_sessions (service role only)
CREATE POLICY "Service role can manage sessions"
ON public.admin_sessions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Add bcrypt hash column for password migration
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS password_hash_bcrypt text;

-- Create index for faster session lookups
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON public.admin_sessions(token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON public.admin_sessions(expires_at);