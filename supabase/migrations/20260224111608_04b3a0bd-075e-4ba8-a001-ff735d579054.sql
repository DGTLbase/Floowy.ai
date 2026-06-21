
CREATE TABLE public.knowledge_base_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tool_name TEXT NOT NULL UNIQUE,
  video_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_base_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view KB videos" ON public.knowledge_base_videos FOR SELECT USING (true);
CREATE POLICY "Admins can manage KB videos" ON public.knowledge_base_videos FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_kb_videos_updated_at BEFORE UPDATE ON public.knowledge_base_videos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
