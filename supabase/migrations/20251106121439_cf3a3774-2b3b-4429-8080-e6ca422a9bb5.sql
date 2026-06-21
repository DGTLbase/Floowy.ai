-- Create table to track IP addresses for account creation
CREATE TABLE IF NOT EXISTS public.user_ip_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  ip_address text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_ip_tracking ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own IP records
CREATE POLICY "Users can view their own IP records"
ON public.user_ip_tracking
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Service role can manage IP records
CREATE POLICY "Service role can manage IP records"
ON public.user_ip_tracking
FOR ALL
USING (true)
WITH CHECK (true);

-- Create index for faster IP lookups
CREATE INDEX idx_user_ip_tracking_ip_address ON public.user_ip_tracking(ip_address);
CREATE INDEX idx_user_ip_tracking_user_id ON public.user_ip_tracking(user_id);