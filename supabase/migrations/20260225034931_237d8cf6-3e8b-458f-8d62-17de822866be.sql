-- Allow admins to delete any likes (needed when deleting a generation)
CREATE POLICY "Admins can delete any like"
ON public.generation_likes
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'::app_role));
