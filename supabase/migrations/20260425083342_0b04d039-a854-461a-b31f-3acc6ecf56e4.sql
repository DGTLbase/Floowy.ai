-- ============ case_categories ============
CREATE TABLE public.case_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.case_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view case categories"
  ON public.case_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage case categories"
  ON public.case_categories FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER trg_case_categories_updated
  BEFORE UPDATE ON public.case_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ cases ============
CREATE TABLE public.cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  client_name text NOT NULL,
  subtitle text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  header_bg_color text NOT NULL DEFAULT '#1DB954',
  client_logo_url text,
  hero_image_url text,
  category_id uuid REFERENCES public.case_categories(id) ON DELETE SET NULL,

  -- Block 1
  intro_text text NOT NULL DEFAULT '',
  -- Block 2: array of { value, label }
  stats jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Block 3
  problem_text text NOT NULL DEFAULT '',
  -- Block 4
  solution_text text NOT NULL DEFAULT '',
  -- Block 5
  comparison_left_label text NOT NULL DEFAULT 'Before Floowy',
  comparison_left_image_url text,
  comparison_right_label text NOT NULL DEFAULT 'With Floowy',
  comparison_right_image_url text,
  -- Block 6
  quote_text text NOT NULL DEFAULT '',
  quote_attribution text NOT NULL DEFAULT '',
  -- Block 7
  key_results jsonb NOT NULL DEFAULT '[]'::jsonb,

  -- SEO
  meta_title text,
  meta_description text,
  meta_keywords text,
  og_image_url text,

  is_published boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published cases"
  ON public.cases FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage cases"
  ON public.cases FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_cases_published ON public.cases(is_published, published_at DESC);
CREATE INDEX idx_cases_category ON public.cases(category_id);

CREATE TRIGGER trg_cases_updated
  BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Seed categories ============
INSERT INTO public.case_categories (name, slug, sort_order) VALUES
  ('Retail',              'retail',              10),
  ('E-commerce',          'ecommerce',           20),
  ('Fashion',             'fashion',             30),
  ('Cosmetics & Beauty',  'cosmetics-beauty',    40),
  ('Food & Beverage',     'food-beverage',       50),
  ('Home & Living',       'home-living',         60),
  ('Electronics',         'electronics',         70),
  ('Other',               'other',               99);

-- ============ Seed Welhof ============
INSERT INTO public.cases (
  slug, client_name, subtitle, tags, header_bg_color,
  client_logo_url, hero_image_url, category_id,
  intro_text, stats, problem_text, solution_text,
  comparison_left_label, comparison_left_image_url,
  comparison_right_label, comparison_right_image_url,
  quote_text, quote_attribution, key_results,
  meta_title, meta_description, meta_keywords,
  is_published, published_at
)
SELECT
  'welhof',
  'Welhof',
  'Boosting conversion rates with AI generated Atmosphere Photos',
  ARRAY['Case Study', 'Retail'],
  '#1DB954',
  NULL, NULL,
  (SELECT id FROM public.case_categories WHERE slug = 'retail'),
  E'Welhof, a fast-growing retailer in home appliances and electronics, wanted to improve the visual quality and emotional appeal of its online product presentation. Their product pages were informative but lacked the visual atmosphere needed to inspire customers to take action.\n\nBy implementing Floowy.ai''s Ambience Studio, Welhof was able to create more engaging visuals that resonated emotionally with their customers and better reflected the feeling of using their products.',
  '[{"value":"+22%","label":"Conversion Rate"},{"value":"+22%","label":"Orders"},{"value":"+40%","label":"ROAS"}]'::jsonb,
  'Welhof''s product pages were informative but lacked the visual atmosphere needed to inspire customers to take action. Standard product photography felt flat and disconnected from the lifestyle their customers aspired to.',
  'With Ambience Studio, the Floowy.ai team worked closely with Welhof to design visuals that matched their brand identity and product categories. By replacing standard product images with AI-generated ambience photos, Welhof could quickly test and optimize creative concepts across campaigns, landing pages and ads, all without the need for traditional photo shoots or studio setups.',
  'Before Floowy', NULL,
  'With Floowy', NULL,
  'The AI-generated ambience photos brought warmth and emotion to our online store. Customers now connect more easily with our products, and we clearly see that in our results.',
  'Welhof Marketing Team',
  '["Save production time and costs","Quickly A/B test new visuals","Maintain consistent branding across all campaigns","Reduce the environmental impact of traditional photography"]'::jsonb,
  'Welhof AI content case showing scalable content output | Floowy',
  'See how Welhof improved marketing visuals using AI. This AI content case shows faster production, better consistency and strong creative results.',
  'Welhof AI case study, AI atmosphere photos case, retail AI content',
  true, now();
