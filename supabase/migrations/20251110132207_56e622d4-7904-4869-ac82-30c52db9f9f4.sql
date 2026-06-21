-- Add missing columns to profiles table if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='onboarding_completed') THEN
    ALTER TABLE public.profiles ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='website') THEN
    ALTER TABLE public.profiles ADD COLUMN website TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
    ALTER TABLE public.profiles ADD COLUMN role TEXT;
  END IF;
END $$;

-- Create onboarding_data table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.onboarding_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  company_website TEXT,
  company_size TEXT,
  creatives_tested TEXT,
  monthly_ad_spend TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on onboarding_data
ALTER TABLE public.onboarding_data ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for onboarding_data if they don't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'onboarding_data' AND policyname = 'Users can view their own onboarding data') THEN
    CREATE POLICY "Users can view their own onboarding data"
      ON public.onboarding_data FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'onboarding_data' AND policyname = 'Users can insert their own onboarding data') THEN
    CREATE POLICY "Users can insert their own onboarding data"
      ON public.onboarding_data FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'onboarding_data' AND policyname = 'Users can update their own onboarding data') THEN
    CREATE POLICY "Users can update their own onboarding data"
      ON public.onboarding_data FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Add trigger for updated_at on onboarding_data if it doesn't exist
DROP TRIGGER IF EXISTS set_onboarding_data_updated_at ON public.onboarding_data;
CREATE TRIGGER set_onboarding_data_updated_at
  BEFORE UPDATE ON public.onboarding_data
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();