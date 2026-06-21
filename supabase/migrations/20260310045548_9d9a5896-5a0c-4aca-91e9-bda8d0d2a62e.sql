
-- Update original models with the new image URLs from their "B" counterparts
-- Then delete all "B" duplicates

-- First, update originals with new images
UPDATE default_models orig
SET image_url = dup.image_url, updated_at = now()
FROM default_models dup
WHERE dup.name = orig.name || ' B'
  AND orig.name NOT LIKE '% B';

-- Handle "Rania 2" special case
UPDATE default_models SET image_url = (SELECT image_url FROM default_models WHERE name = 'Rania 2 B')
WHERE name = 'Rania 2' AND EXISTS (SELECT 1 FROM default_models WHERE name = 'Rania 2 B');

UPDATE default_models SET image_url = (SELECT image_url FROM default_models WHERE name = 'Valentina 2 B')
WHERE name = 'Valentina 2' AND EXISTS (SELECT 1 FROM default_models WHERE name = 'Valentina 2 B');

-- Delete all "B" duplicates
DELETE FROM default_models WHERE name LIKE '% B';
