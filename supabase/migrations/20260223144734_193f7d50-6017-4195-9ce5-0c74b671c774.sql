-- Create table for generation likes
CREATE TABLE public.generation_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  generation_id uuid NOT NULL REFERENCES public.generations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(generation_id, user_id)
);

-- Enable RLS
ALTER TABLE public.generation_likes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view all likes" ON public.generation_likes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can like" ON public.generation_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own" ON public.generation_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.generation_likes;
