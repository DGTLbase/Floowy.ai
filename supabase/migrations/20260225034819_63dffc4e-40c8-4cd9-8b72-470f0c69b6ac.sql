-- Allow admins to update any generation (e.g. set is_public = false)
CREATE POLICY "Admins can update all generations"
ON public.generations
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete any generation
CREATE POLICY "Admins can delete all generations"
ON public.generations
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete comments on any generation
CREATE POLICY "Admins can delete any comment"
ON public.generation_comments
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));
