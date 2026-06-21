DELETE FROM flatlay_styles WHERE category_id='911e8496-15e5-4490-b049-1f5ccd94bf14';
DELETE FROM flatlay_subcategories WHERE category_id='911e8496-15e5-4490-b049-1f5ccd94bf14';
INSERT INTO flatlay_subcategories (id,category_id,name,slug,sort_order) VALUES
('55555555-5555-4555-8555-555555550001','911e8496-15e5-4490-b049-1f5ccd94bf14','Sunglasses','sunglasses',10),
('55555555-5555-4555-8555-555555550002','911e8496-15e5-4490-b049-1f5ccd94bf14','Bags','bags',20);
INSERT INTO flatlay_styles (category_id,subcategory_id,name,image_url,sort_order) VALUES
('911e8496-15e5-4490-b049-1f5ccd94bf14','55555555-5555-4555-8555-555555550001','Sunglasses','https://i.ibb.co/kg8K3zrD/accessories-sunglasses-sunglasses.png',10),
('911e8496-15e5-4490-b049-1f5ccd94bf14','55555555-5555-4555-8555-555555550001','Sunglasses 2','https://i.ibb.co/ymP6sFLV/accessories-sunglasses-sunglasses-2.png',20),
('911e8496-15e5-4490-b049-1f5ccd94bf14','55555555-5555-4555-8555-555555550001','Sunglasses 3','https://i.ibb.co/90gf2Bn/accessories-sunglasses-sunglasses-3.png',30),
('911e8496-15e5-4490-b049-1f5ccd94bf14','55555555-5555-4555-8555-555555550002','Tote Bag','https://i.ibb.co/WmsJ8yP/accessories-bags-tote-bag.png',40),
('911e8496-15e5-4490-b049-1f5ccd94bf14','55555555-5555-4555-8555-555555550002','Tote Bag 1','https://i.ibb.co/mCs4Krmb/accessories-bags-tote-bag-1.png',50),
('911e8496-15e5-4490-b049-1f5ccd94bf14','55555555-5555-4555-8555-555555550002','Backpack','https://i.ibb.co/RGzxC84X/accessories-bags-backpack.png',60),
('911e8496-15e5-4490-b049-1f5ccd94bf14','55555555-5555-4555-8555-555555550002','Structured Handbag','https://i.ibb.co/HmphLbt/accessories-bags-structured-handbag.png',70),
('911e8496-15e5-4490-b049-1f5ccd94bf14','55555555-5555-4555-8555-555555550002','Hobo Bag','https://i.ibb.co/HLSVVC2j/accessories-bags-hobo-bag.png',80);