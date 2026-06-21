DELETE FROM flatlay_styles WHERE category_id='2710c981-9e7f-4daa-8683-0f34212c31b4';
DELETE FROM flatlay_subcategories WHERE category_id='2710c981-9e7f-4daa-8683-0f34212c31b4';
INSERT INTO flatlay_subcategories (id, category_id, name, slug, sort_order) VALUES
('11111111-1111-4111-8111-111111110001','2710c981-9e7f-4daa-8683-0f34212c31b4','Blazers','blazers',10),
('11111111-1111-4111-8111-111111110002','2710c981-9e7f-4daa-8683-0f34212c31b4','Vests','vests',20);