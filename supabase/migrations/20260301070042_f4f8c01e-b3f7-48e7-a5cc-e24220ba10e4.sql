
-- Create gallery_items table for admin-managed scrolling gallery
CREATE TABLE public.gallery_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  src_url text NOT NULL,
  alt text NOT NULL DEFAULT '',
  type text NOT NULL DEFAULT 'image',
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view visible gallery items (public landing page)
CREATE POLICY "Anyone can view visible gallery items"
ON public.gallery_items FOR SELECT
USING (is_visible = true);

-- Admins can do everything
CREATE POLICY "Admins can manage gallery items"
ON public.gallery_items FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_gallery_items_updated_at
BEFORE UPDATE ON public.gallery_items
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Seed with current hardcoded gallery items
INSERT INTO public.gallery_items (src_url, alt, type, sort_order, is_visible) VALUES
  ('https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/gallery/gallery-curly-girl.png', 'Lipstick application', 'image', 1, true),
  ('https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/gallery/gallery-jacket-jil.png', 'Jil Sander jacket', 'image', 2, true),
  ('https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/gallery/gallery-2.jpg', 'Luxury perfume', 'image', 3, true),
  ('https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/gallery/gallery-3.jpg', 'Fashion sneakers', 'image', 4, true),
  ('https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/gallery/gallery-fashion-runway.jpg', 'Fashion runway', 'image', 5, true),
  ('https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/gallery/gallery-4.jpg', 'Phone case styling', 'image', 6, true),
  ('https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/gallery/gallery-5.jpg', 'Gold bracelet', 'image', 7, true),
  ('https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/gallery/gallery-prime-hydration.png', 'Prime hydration ad', 'image', 8, true),
  ('https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/gallery/gallery-video-new.mp4', 'Product showcase', 'video', 9, true),
  ('https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/gallery/gallery-video-3.mp4', 'Creative showcase', 'video', 10, true),
  ('https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/gallery/gallery-8.jpg', 'Fashion dress', 'image', 11, true);
