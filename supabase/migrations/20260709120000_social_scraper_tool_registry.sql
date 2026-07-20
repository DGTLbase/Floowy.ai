-- Register the Social Scraper tool in the admin tools registry.
-- admin_only = true keeps it out of any public/user-facing listing; it is only
-- surfaced in the Admin > Tools tab (the public Home grid is hardcoded and does
-- not include it), so it stays hidden from regular users until we launch it.
INSERT INTO public.tools (name, display_name, description, is_active, admin_only)
VALUES
  ('social-scraper', 'Social Scraper', 'Scrape and AI-analyze top-performing TikTok & Instagram posts by keyword, hashtag, or profile.', true, true)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  admin_only = EXCLUDED.admin_only,
  updated_at = now();
