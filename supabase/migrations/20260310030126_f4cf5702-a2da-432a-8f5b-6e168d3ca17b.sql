
-- Deactivate all existing custom models
UPDATE custom_models SET is_active = false;

-- Insert new premium models
INSERT INTO custom_models (name, image_url, gender, price_cents, is_active) VALUES
('Adrian', 'https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/custom-models/Adrian-2.png', 'male', 1995, true),
('Aiko', 'https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/custom-models/Aiko.png', 'female', 1995, true),
('Kenji', 'https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/custom-models/Kenji-2.png', 'male', 1995, true),
('Layla', 'https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/custom-models/Layla-2.png', 'female', 1995, true),
('Lucas', 'https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/custom-models/Lucas-5.png', 'male', 1995, true),
('Malik', 'https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/custom-models/Malik.png', 'male', 1995, true),
('Maya', 'https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/custom-models/Maya.png', 'female', 1995, true),
('Omar', 'https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/custom-models/Omar-2.png', 'male', 1995, true),
('Sophie', 'https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/custom-models/Sophie.png', 'female', 1995, true),
('Zuri', 'https://fjzifykgvdsownlscgct.supabase.co/storage/v1/object/public/products/custom-models/Zuri.png', 'female', 1995, true);
