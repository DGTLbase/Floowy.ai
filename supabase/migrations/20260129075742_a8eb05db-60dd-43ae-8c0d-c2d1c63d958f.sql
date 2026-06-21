-- Add stripe_price_id column to custom_models
ALTER TABLE public.custom_models ADD COLUMN IF NOT EXISTS stripe_price_id text;

-- Update each model with its corresponding Stripe price ID
UPDATE public.custom_models SET stripe_price_id = 'price_1ShAmJKbAjgJzP4OhyxOaHcY' WHERE id = '1c7c8687-56e7-41c8-875e-57cafc9b3263'; -- Aaliyah
UPDATE public.custom_models SET stripe_price_id = 'price_1ShAmLKbAjgJzP4OfWYe9d2t' WHERE id = 'c96e5d09-d84f-4e73-85cd-12616202262b'; -- Elena
UPDATE public.custom_models SET stripe_price_id = 'price_1ShAmNKbAjgJzP4OkCkVkKUy' WHERE id = '213dd3b8-c1aa-4179-b13a-fde15238f28e'; -- Isabella
UPDATE public.custom_models SET stripe_price_id = 'price_1ShAmPKbAjgJzP4OXf9bBfSF' WHERE id = '6f3e77fd-adc7-4fa8-b351-ad975b9a639b'; -- Luna
UPDATE public.custom_models SET stripe_price_id = 'price_1ShAmRKbAjgJzP4OGrFyMTOK' WHERE id = 'b6eaa42b-8f78-4734-9a4f-496dec720067'; -- Maya
UPDATE public.custom_models SET stripe_price_id = 'price_1ShAmTKbAjgJzP4OUhwLcDPk' WHERE id = '7c769727-c61b-411e-85d8-b0f64831765e'; -- Naomi
UPDATE public.custom_models SET stripe_price_id = 'price_1ShAmVKbAjgJzP4OCZPQ0xJr' WHERE id = 'b6184606-93b6-439c-85c2-0c7871dcaffe'; -- Priya
UPDATE public.custom_models SET stripe_price_id = 'price_1ShAmXKbAjgJzP4O4LPIwdNo' WHERE id = '2a5abd0e-9543-42df-b663-b2e23f7a0c29'; -- Sophia
UPDATE public.custom_models SET stripe_price_id = 'price_1ShAmZKbAjgJzP4OL1OC6Wpw' WHERE id = '4011cdd7-1c8f-4a55-ba9b-e5d49d79ea7b'; -- Victoria
UPDATE public.custom_models SET stripe_price_id = 'price_1ShAmbKbAjgJzP4OHFVbfJJ4' WHERE id = '3b4dd340-ac64-467a-a0b2-1aee7332c997'; -- Zara