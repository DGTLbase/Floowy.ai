DELETE FROM flatlay_styles WHERE category_id='c01ba083-c36d-42a3-8359-1b8a5ca582e9';
DELETE FROM flatlay_subcategories WHERE category_id='c01ba083-c36d-42a3-8359-1b8a5ca582e9';
INSERT INTO flatlay_subcategories (id, category_id, name, slug, sort_order) VALUES
('22222222-2222-4222-8222-222222220001','c01ba083-c36d-42a3-8359-1b8a5ca582e9','Underwear','underwear',10),
('22222222-2222-4222-8222-222222220002','c01ba083-c36d-42a3-8359-1b8a5ca582e9','Bras','bras',20),
('22222222-2222-4222-8222-222222220003','c01ba083-c36d-42a3-8359-1b8a5ca582e9','Lingerie','lingerie',30);