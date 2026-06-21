INSERT INTO public.tools (name, display_name, description, is_active, admin_only)
VALUES ('flatlay_studio', 'Flatlay Studio', 'Reference-based product flatlay generator', true, true)
ON CONFLICT (name) DO UPDATE SET 
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  admin_only = EXCLUDED.admin_only;