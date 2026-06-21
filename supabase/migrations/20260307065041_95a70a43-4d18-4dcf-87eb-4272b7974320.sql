
CREATE TABLE public.default_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_url text NOT NULL,
  gender text NOT NULL DEFAULT 'female',
  ethnicity text NOT NULL DEFAULT 'European',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.default_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active default models"
  ON public.default_models FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage default models"
  ON public.default_models FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.default_models;
ALTER PUBLICATION supabase_realtime ADD TABLE public.custom_models;
