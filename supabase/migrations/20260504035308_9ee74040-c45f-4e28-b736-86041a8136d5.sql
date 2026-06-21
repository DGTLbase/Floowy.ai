
CREATE TABLE public.flatlay_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.flatlay_style_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);

ALTER TABLE public.flatlay_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view flatlay subcategories"
ON public.flatlay_subcategories FOR SELECT USING (true);

CREATE POLICY "Admins manage flatlay subcategories"
ON public.flatlay_subcategories FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.flatlay_styles
  ADD COLUMN subcategory_id uuid REFERENCES public.flatlay_subcategories(id) ON DELETE SET NULL;

CREATE INDEX idx_flatlay_styles_subcategory ON public.flatlay_styles(subcategory_id);
CREATE INDEX idx_flatlay_subcategories_category ON public.flatlay_subcategories(category_id);
