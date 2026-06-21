-- Add parent_id column for reply threading
ALTER TABLE public.generation_comments
ADD COLUMN parent_id UUID REFERENCES public.generation_comments(id) ON DELETE CASCADE DEFAULT NULL;