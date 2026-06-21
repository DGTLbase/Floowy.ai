
CREATE TABLE IF NOT EXISTS public.industry_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  industry_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category_id uuid REFERENCES public.case_categories(id) ON DELETE SET NULL,
  header_bg_color text NOT NULL DEFAULT '#1DB954',
  hero_image_url text,
  meta_title text,
  meta_description text,
  meta_keywords text,
  og_image_url text,
  intro_title text NOT NULL DEFAULT '',
  intro_body text NOT NULL DEFAULT '',
  recognition_title text NOT NULL DEFAULT 'Sound familiar?',
  recognition_bullets jsonb NOT NULL DEFAULT '[]'::jsonb,
  solution_title text NOT NULL DEFAULT 'How Floowy solves this',
  solution_body text NOT NULL DEFAULT '',
  cases_section_title text NOT NULL DEFAULT 'See how other brands use Floowy',
  case_1_id uuid REFERENCES public.cases(id) ON DELETE SET NULL,
  case_2_id uuid REFERENCES public.cases(id) ON DELETE SET NULL,
  case_3_id uuid REFERENCES public.cases(id) ON DELETE SET NULL,
  faq_section_title text NOT NULL DEFAULT 'Frequently asked questions',
  faq_items jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.industry_pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published industry pages"
  ON public.industry_pages FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage industry pages"
  ON public.industry_pages FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_industry_pages_updated_at
  BEFORE UPDATE ON public.industry_pages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.case_categories (name, slug, sort_order)
SELECT v.name, v.slug, v.sort_order
FROM (VALUES
  ('Retail', 'retail', 1),
  ('Fashion', 'fashion', 3),
  ('Cosmetics & Beauty', 'cosmetics-beauty', 4),
  ('Food & Beverage', 'food-beverage', 5),
  ('Home & Living', 'home-living', 6),
  ('Electronics', 'electronics', 7),
  ('Other', 'other', 99)
) AS v(name, slug, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.case_categories cc
  WHERE cc.slug = v.slug OR cc.name = v.name
);
