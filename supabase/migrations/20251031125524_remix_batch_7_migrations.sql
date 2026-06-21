
-- Migration: 20251031071533
-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert roles"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update roles"
  ON public.user_roles FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete roles"
  ON public.user_roles FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Create credits table
CREATE TABLE public.credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on credits
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;

-- RLS policies for credits
CREATE POLICY "Users can view their own credits"
  ON public.credits FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all credits"
  ON public.credits FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert credits"
  ON public.credits FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update credits"
  ON public.credits FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create generations table
CREATE TABLE public.generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  prompt TEXT NOT NULL,
  original_image_url TEXT NOT NULL,
  generated_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on generations
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

-- RLS policies for generations
CREATE POLICY "Users can view their own generations"
  ON public.generations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generations"
  ON public.generations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all generations"
  ON public.generations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('products', 'products', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('generated', 'generated', false);

-- Storage policies for products bucket
CREATE POLICY "Users can upload their own product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'products' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own product images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'products' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for generated bucket
CREATE POLICY "Users can view their own generated images"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'generated' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "System can insert generated images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'generated');

-- Trigger to create profile and credits on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );
  
  INSERT INTO public.credits (user_id, balance)
  VALUES (NEW.id, 3);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credits_updated_at
  BEFORE UPDATE ON public.credits
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251031074126
-- Make products bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'products';

-- Create RLS policy for products bucket to allow authenticated users to upload
CREATE POLICY "Users can upload to products bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'products');

-- Create RLS policy for products bucket to allow public access
CREATE POLICY "Public can view products"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'products');

-- Migration: 20251031091350
-- Allow users to update their own credits
CREATE POLICY "Users can update their own credits"
ON public.credits
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Migration: 20251031092025
-- Create tool access table
CREATE TABLE public.user_tool_access (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tool_name TEXT NOT NULL,
  has_access BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, tool_name)
);

-- Enable RLS
ALTER TABLE public.user_tool_access ENABLE ROW LEVEL SECURITY;

-- Users can view their own tool access
CREATE POLICY "Users can view their own tool access"
ON public.user_tool_access
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all tool access
CREATE POLICY "Admins can view all tool access"
ON public.user_tool_access
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert tool access
CREATE POLICY "Admins can insert tool access"
ON public.user_tool_access
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update tool access
CREATE POLICY "Admins can update tool access"
ON public.user_tool_access
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete tool access
CREATE POLICY "Admins can delete tool access"
ON public.user_tool_access
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_tool_access_updated_at
BEFORE UPDATE ON public.user_tool_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251031110723
-- Create admin_accounts table (separate from users)
CREATE TABLE public.admin_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on admin_accounts
ALTER TABLE public.admin_accounts ENABLE ROW LEVEL SECURITY;

-- Admins can view their own account
CREATE POLICY "Admins can view their own account"
ON public.admin_accounts
FOR SELECT
USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Admins can update their own account
CREATE POLICY "Admins can update their own account"
ON public.admin_accounts
FOR UPDATE
USING (email = current_setting('request.jwt.claims', true)::json->>'email');

-- Create admin_sessions table for session management
CREATE TABLE public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.admin_accounts(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on admin_sessions
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX idx_admin_sessions_token ON public.admin_sessions(token);
CREATE INDEX idx_admin_sessions_expires ON public.admin_sessions(expires_at);

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION public.cleanup_expired_admin_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.admin_sessions
  WHERE expires_at < now();
END;
$$;

-- Trigger to update updated_at on admin_accounts
CREATE TRIGGER update_admin_accounts_updated_at
BEFORE UPDATE ON public.admin_accounts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Migration: 20251031110958
-- Add RLS policies for admin_sessions table
CREATE POLICY "Service role can manage admin sessions"
ON public.admin_sessions
FOR ALL
USING (true)
WITH CHECK (true);

-- Note: Admin sessions are managed server-side via edge functions
-- Users and regular admins should not have direct access to this table;

-- Migration: 20251031123446
-- Create tools table
CREATE TABLE public.tools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read tools
CREATE POLICY "Tools are viewable by everyone"
ON public.tools
FOR SELECT
USING (true);

-- Only admins can manage tools
CREATE POLICY "Admins can insert tools"
ON public.tools
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update tools"
ON public.tools
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete tools"
ON public.tools
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert initial tools
INSERT INTO public.tools (name, display_name, description) VALUES
  ('atmospheric', 'Atmospheric Photo Generator', 'Transform products into stunning atmospheric photos with AI-powered effects'),
  ('ugc', 'UGC Photo Generator', 'Create authentic user-generated content style photos for products');

-- Add trigger for updated_at
CREATE TRIGGER update_tools_updated_at
BEFORE UPDATE ON public.tools
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
