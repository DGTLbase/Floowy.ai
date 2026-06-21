-- Add admin_only field to tools table
ALTER TABLE public.tools ADD COLUMN IF NOT EXISTS admin_only boolean NOT NULL DEFAULT false;

-- Insert new admin-only tool
INSERT INTO public.tools (name, display_name, description, is_active, admin_only)
VALUES (
  'product-studio',
  'Product Studio',
  'Advanced product visualization tool for creating professional product shots with custom backgrounds and lighting',
  true,
  true
)
ON CONFLICT (name) DO NOTHING;

-- Create admin_users table for team management
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  last_active timestamp with time zone,
  UNIQUE(user_id)
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_users
CREATE POLICY "Admins can view all admin users"
  ON public.admin_users
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert admin users"
  ON public.admin_users
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update admin users"
  ON public.admin_users
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete admin users"
  ON public.admin_users
  FOR DELETE
  USING (has_role(auth.uid(), 'admin'));