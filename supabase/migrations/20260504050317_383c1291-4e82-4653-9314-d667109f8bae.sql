INSERT INTO flatlay_style_categories (id,name,slug,sort_order) VALUES ('66666666-6666-4666-8666-666666660000','Footwear','footwear',110) ON CONFLICT (id) DO NOTHING;
INSERT INTO flatlay_subcategories (id,category_id,name,slug,sort_order) VALUES
('66666666-6666-4666-8666-666666660001','66666666-6666-4666-8666-666666660000','Boots','boots',10),
('66666666-6666-4666-8666-666666660002','66666666-6666-4666-8666-666666660000','Sneakers','sneakers',20),
('66666666-6666-4666-8666-666666660003','66666666-6666-4666-8666-666666660000','Sandals','sandals',30),
('66666666-6666-4666-8666-666666660004','66666666-6666-4666-8666-666666660000','Slip-ons','slip-ons',40);
INSERT INTO flatlay_styles (category_id,subcategory_id,name,image_url,sort_order) VALUES
('66666666-6666-4666-8666-666666660000','66666666-6666-4666-8666-666666660001','Ankle Boots','https://i.ibb.co/3544gpP1/footwear-boots-ankle-boots.png',10),
('66666666-6666-4666-8666-666666660000','66666666-6666-4666-8666-666666660001','Ankle Boots 2','https://i.ibb.co/mVwJmM39/footwear-boots-ankle-boots-2.png',20),
('66666666-6666-4666-8666-666666660000','66666666-6666-4666-8666-666666660001','Heeled Ankle Boots','https://i.ibb.co/0jxqM0X4/footwear-boots-heeled-ankle-boots.png',30),
('66666666-6666-4666-8666-666666660000','66666666-6666-4666-8666-666666660001','Chelsea Boots','https://i.ibb.co/kg9Vt6QY/footwear-boots-chelsea-boots.png',40),
('66666666-6666-4666-8666-666666660000','66666666-6666-4666-8666-666666660001','Knee High Boots','https://i.ibb.co/xVK56RK/footwear-boots-knee-high-boots.png',50),
('66666666-6666-4666-8666-666666660000','66666666-6666-4666-8666-666666660002','Canvas Sneakers','https://i.ibb.co/hxqhYWGV/footwear-sneakers-canvas-sneakers.png',60),
('66666666-6666-4666-8666-666666660000','66666666-6666-4666-8666-666666660002','Low Top Sneakers','https://i.ibb.co/MyGhdLxX/footwear-sneakers-low-top-sneakers.png',70),
('66666666-6666-4666-8666-666666660000','66666666-6666-4666-8666-666666660002','Athletic Sneakers','https://i.ibb.co/TMG05S5p/footwear-sneakers-athletic-sneakers.png',80),
('66666666-6666-4666-8666-666666660000','66666666-6666-4666-8666-666666660002','Athletic Sneakers 2','https://i.ibb.co/V5BRDyc/footwear-sneakers-athletic-sneakers-2.png',90),
('66666666-6666-4666-8666-666666660000','66666666-6666-4666-8666-666666660003','Sandals','https://i.ibb.co/k2nh3JLq/footwear-sandals-sandals.png',100),
('66666666-6666-4666-8666-666666660000','66666666-6666-4666-8666-666666660003','Slide Sandals','https://i.ibb.co/rfR1Ypt7/footwear-sandals-slide-sandals.png',110),
('66666666-6666-4666-8666-666666660000','66666666-6666-4666-8666-666666660003','Heeled Sandals','https://i.ibb.co/MkdCKbks/footwear-sandals-heeled-sandals.png',120),
('66666666-6666-4666-8666-666666660000','66666666-6666-4666-8666-666666660004','Clogs','https://i.ibb.co/5XjThpK3/footwear-slip-ons-clogs.png',130),
('66666666-6666-4666-8666-666666660000','66666666-6666-4666-8666-666666660004','Mules','https://i.ibb.co/RkT8FX7Y/footwear-slip-ons-mules.png',140);