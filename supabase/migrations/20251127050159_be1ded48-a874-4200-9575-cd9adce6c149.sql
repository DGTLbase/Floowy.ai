-- Add phone column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS phone text UNIQUE;

-- Add phone column to user_ip_tracking for additional verification
ALTER TABLE public.user_ip_tracking
ADD COLUMN IF NOT EXISTS phone text;

-- Create index for phone lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_user_ip_tracking_phone ON public.user_ip_tracking(phone);