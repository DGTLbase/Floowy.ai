DELETE FROM public.flatlay_styles 
WHERE subcategory_id IN (SELECT id FROM public.flatlay_subcategories WHERE category_id=(SELECT id FROM public.flatlay_style_categories WHERE name='Dresses'));
DELETE FROM public.flatlay_subcategories 
WHERE category_id=(SELECT id FROM public.flatlay_style_categories WHERE name='Dresses');

INSERT INTO public.flatlay_subcategories (category_id, name, slug, sort_order)
SELECT c.id, v.n, v.s, v.so
FROM public.flatlay_style_categories c
CROSS JOIN (VALUES ('Casual','casual',1),('Maxi','maxi',2),('Mini','mini',3)) AS v(n, s, so)
WHERE c.name='Dresses';