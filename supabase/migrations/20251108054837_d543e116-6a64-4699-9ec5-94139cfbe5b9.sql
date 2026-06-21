-- Insert missing tools
INSERT INTO public.tools (name, display_name, description, is_active, admin_only)
VALUES 
  ('fashion', 'Fashion Studio', 'AI-powered fashion photography with professional models wearing your products', true, false),
  ('creator', 'Creator Studio', 'Create authentic UGC-style videos with AI models showcasing your products', true, false),
  ('idea', 'Idea Studio', 'Transform reference images into product mockups with custom models and backgrounds', true, false)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  admin_only = EXCLUDED.admin_only,
  updated_at = now();