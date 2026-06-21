-- Create custom_models table for marketplace models
CREATE TABLE public.custom_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  image_url text NOT NULL,
  price_cents integer NOT NULL DEFAULT 5000, -- €50 in cents
  gender text NOT NULL DEFAULT 'female', -- 'male' or 'female'
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user_purchased_models table to track ownership
CREATE TABLE public.user_purchased_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id uuid NOT NULL REFERENCES public.custom_models(id) ON DELETE CASCADE,
  stripe_payment_intent_id text,
  purchased_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, model_id)
);

-- Enable RLS
ALTER TABLE public.custom_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchased_models ENABLE ROW LEVEL SECURITY;

-- RLS policies for custom_models (public read, admin write)
CREATE POLICY "Anyone can view active models"
  ON public.custom_models FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage models"
  ON public.custom_models FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS policies for user_purchased_models
CREATE POLICY "Users can view their purchased models"
  ON public.user_purchased_models FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases"
  ON public.user_purchased_models FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create updated_at trigger for custom_models
CREATE TRIGGER update_custom_models_updated_at
  BEFORE UPDATE ON public.custom_models
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();