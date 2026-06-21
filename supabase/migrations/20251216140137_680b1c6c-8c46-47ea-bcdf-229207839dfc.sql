-- Remove phone column from user_ip_tracking table
-- Phone numbers are already stored in profiles table with proper RLS
-- This eliminates the unnecessary sensitive data exposure risk

ALTER TABLE public.user_ip_tracking DROP COLUMN IF EXISTS phone;