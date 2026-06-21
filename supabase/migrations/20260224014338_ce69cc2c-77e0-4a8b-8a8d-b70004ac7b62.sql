
-- Create comments table for community gallery
CREATE TABLE public.generation_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id UUID NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.generation_comments ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can view comments on public generations
CREATE POLICY "Anyone can view comments on public generations"
ON public.generation_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.generations g
    WHERE g.id = generation_comments.generation_id AND g.is_public = true
  )
);

-- Authenticated users can insert their own comments
CREATE POLICY "Users can insert their own comments"
ON public.generation_comments
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.generation_comments
FOR DELETE
USING (auth.uid() = user_id);
