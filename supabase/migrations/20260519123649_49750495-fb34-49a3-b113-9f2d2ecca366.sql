ALTER TABLE public.flatlay_styles
  ADD COLUMN IF NOT EXISTS output_type text NOT NULL DEFAULT 'flatlay';

ALTER TABLE public.flatlay_styles
  DROP CONSTRAINT IF EXISTS flatlay_styles_output_type_check;

ALTER TABLE public.flatlay_styles
  ADD CONSTRAINT flatlay_styles_output_type_check
  CHECK (output_type IN ('flatlay', 'halo_bust'));

CREATE INDEX IF NOT EXISTS idx_flatlay_styles_output_type
  ON public.flatlay_styles (output_type, category_id, subcategory_id, sort_order);