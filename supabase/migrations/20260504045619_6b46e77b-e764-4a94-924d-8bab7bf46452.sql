DELETE FROM flatlay_styles WHERE category_id='d7c97cc4-5648-4452-b6cf-aa7ff22f9d45';
DELETE FROM flatlay_subcategories WHERE category_id='d7c97cc4-5648-4452-b6cf-aa7ff22f9d45';
INSERT INTO flatlay_subcategories (id, category_id, name, slug, sort_order) VALUES
('44444444-4444-4444-8444-444444440001','d7c97cc4-5648-4452-b6cf-aa7ff22f9d45','Necklaces','necklaces',10),
('44444444-4444-4444-8444-444444440002','d7c97cc4-5648-4452-b6cf-aa7ff22f9d45','Rings','rings',20),
('44444444-4444-4444-8444-444444440003','d7c97cc4-5648-4452-b6cf-aa7ff22f9d45','Bracelets','bracelets',30);