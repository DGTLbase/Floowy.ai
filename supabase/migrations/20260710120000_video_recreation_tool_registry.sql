-- Register the Video Recreation Studio in the admin tools registry.
-- admin_only = true keeps it out of any public/user-facing DB listing; it's only
-- surfaced in Admin > Tools. The public Home tile is separately gated to the
-- allowlist (canAccessVideoRecreation), so regular users don't see it yet.
INSERT INTO public.tools (name, display_name, description, is_active, admin_only)
VALUES
  ('video-recreation', 'Video Recreation Studio', 'Transform an existing video with chip-selected AI edits — scene, product, lighting, style & time of day.', true, true)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  admin_only = EXCLUDED.admin_only,
  updated_at = now();
