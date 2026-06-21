CREATE POLICY "Users can update their own generations"
ON public.generations
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);