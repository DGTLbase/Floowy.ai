DELETE FROM flatlay_styles WHERE category_id='c6e2e49e-46ee-4f67-891f-2bc0022aa882';
DELETE FROM flatlay_subcategories WHERE category_id='c6e2e49e-46ee-4f67-891f-2bc0022aa882';
INSERT INTO flatlay_subcategories (id, category_id, name, slug, sort_order) VALUES
('33333333-3333-4333-8333-333333330001','c6e2e49e-46ee-4f67-891f-2bc0022aa882','Caps','caps',10),
('33333333-3333-4333-8333-333333330002','c6e2e49e-46ee-4f67-891f-2bc0022aa882','Beanies','beanies',20);