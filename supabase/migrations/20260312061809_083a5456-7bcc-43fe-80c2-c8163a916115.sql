ALTER TABLE public.default_models
  ADD COLUMN age_category text NOT NULL DEFAULT '20 – 30',
  ADD COLUMN body_type text NOT NULL DEFAULT 'Average',
  ADD COLUMN use_case text NOT NULL DEFAULT 'Fashion';