
-- For each duplicate name, keep the one with lowest sort_order
-- First, update the keeper's image_url if it's still using old path
UPDATE default_models keeper
SET image_url = dup.image_url, updated_at = now()
FROM default_models dup
WHERE keeper.name = dup.name
  AND keeper.sort_order < dup.sort_order
  AND keeper.image_url LIKE '/models/%'
  AND dup.image_url LIKE '%supabase%';

-- Now delete all duplicates (higher sort_order for each name)
DELETE FROM default_models
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY sort_order) as rn
    FROM default_models
  ) ranked
  WHERE rn > 1
);
