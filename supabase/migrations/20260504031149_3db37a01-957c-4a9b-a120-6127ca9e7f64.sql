
-- Categories
CREATE TABLE public.flatlay_style_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.flatlay_style_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view flatlay style categories" ON public.flatlay_style_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage flatlay style categories" ON public.flatlay_style_categories FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Curated styles
CREATE TABLE public.flatlay_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.flatlay_style_categories(id) ON DELETE CASCADE,
  name text NOT NULL,
  image_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.flatlay_styles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active flatlay styles" ON public.flatlay_styles FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage flatlay styles" ON public.flatlay_styles FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- User-uploaded reusable styles
CREATE TABLE public.flatlay_user_styles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  image_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.flatlay_user_styles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own flatlay styles" ON public.flatlay_user_styles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert own flatlay styles" ON public.flatlay_user_styles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own flatlay styles" ON public.flatlay_user_styles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete own flatlay styles" ON public.flatlay_user_styles FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Admins view all flatlay user styles" ON public.flatlay_user_styles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed standard categories
INSERT INTO public.flatlay_style_categories (name, slug, sort_order) VALUES
  ('Tops', 'tops', 10),
  ('Bottoms', 'bottoms', 20),
  ('Dresses', 'dresses', 30),
  ('Outerwear', 'outerwear', 40),
  ('Sweaters', 'sweaters', 50),
  ('Suit', 'suit', 60),
  ('Underwear / Bikini', 'underwear', 70),
  ('Socks', 'socks', 80),
  ('Hats', 'hats', 90),
  ('Jewelry', 'jewelry', 100),
  ('Accessories', 'accessories', 110);
