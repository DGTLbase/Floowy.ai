INSERT INTO public.cases (
  slug, client_name, subtitle, tags, header_bg_color,
  category_id, intro_text, stats, problem_text, solution_text,
  comparison_left_label, comparison_right_label,
  quote_text, quote_attribution, key_results,
  meta_title, meta_description, meta_keywords,
  is_published, published_at
)
SELECT
  'reloadbase',
  'ReloadBase',
  'Boosting engagement with AI-powered UGC videos',
  ARRAY['Case Study','E-commerce']::text[],
  '#1DB954',
  (SELECT id FROM public.case_categories WHERE slug='ecommerce'),
  E'ReloadBase is a fast-growing e-commerce platform that sells digital products such as prepaid credit, gift cards and top-ups. With thousands of online transactions every week, the company wanted to improve its social ad performance by creating content that felt more authentic and personal, content that connected directly with everyday users.\n\nBy using Floowy.ai''s Creator Studio, ReloadBase transformed its paid social strategy. The team was able to produce high-performing UGC-style videos that blended seamlessly into users'' social feeds while showcasing the brand''s convenience, trust and digital-first identity.',
  '[
    {"value":"+14%","label":"Conversion rate"},
    {"value":"+14%","label":"Orders"},
    {"value":"+38%","label":"ROAS"}
  ]'::jsonb,
  'ReloadBase needed authentic, high-performing social ad content that connected with everyday users and stood out in crowded feeds, without the cost and time of producing traditional UGC videos at scale.',
  E'Floowy.ai worked with ReloadBase to create ad concepts that clearly showcased their product in action. Using Creator Studio, ReloadBase produced UGC-style videos that showed how easy it is to top up or buy prepaid credit within seconds.\n\nEach video focused on the simplicity, speed and security of the service, making it easy for customers to understand the value of the platform. The team tested several variations and optimized campaigns based on real-time results.',
  'Before',
  'After',
  'The AI-generated UGC videos captured exactly what matters to our customers: trust and simplicity.',
  'ReloadBase Marketing Team',
  '["Produce authentic, high-performing videos at scale","Reduce production time and costs","Quickly test creative variations across channels","Improve conversion and return on ad spend"]'::jsonb,
  'Reloadbase AI content case improving visual creation | Floowy',
  'View the Reloadbase AI content case to learn how AI helped create consistent visuals for marketing and campaigns with faster production speed.',
  'Reloadbase AI case study, UGC video case study, ecommerce AI content',
  true,
  now()
WHERE NOT EXISTS (SELECT 1 FROM public.cases WHERE slug='reloadbase');