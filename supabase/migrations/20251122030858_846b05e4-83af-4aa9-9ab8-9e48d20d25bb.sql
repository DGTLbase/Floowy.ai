-- Create batch processing tables for bulk mockup generator
CREATE TABLE IF NOT EXISTS public.batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  tool_name TEXT NOT NULL DEFAULT 'bulk_fashion',
  status TEXT NOT NULL DEFAULT 'pending',
  total_count INTEGER NOT NULL,
  completed_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS public.batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.batch_jobs(id) ON DELETE CASCADE,
  product_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  result_url TEXT,
  order_index INTEGER NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.batch_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batch_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for batch_jobs
CREATE POLICY "Users can view their own batch jobs"
  ON public.batch_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own batch jobs"
  ON public.batch_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own batch jobs"
  ON public.batch_jobs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for batch_items
CREATE POLICY "Users can view their own batch items"
  ON public.batch_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.batch_jobs
      WHERE batch_jobs.id = batch_items.batch_id
      AND batch_jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create batch items"
  ON public.batch_items
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.batch_jobs
      WHERE batch_jobs.id = batch_items.batch_id
      AND batch_jobs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update batch items"
  ON public.batch_items
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.batch_jobs
      WHERE batch_jobs.id = batch_items.batch_id
      AND batch_jobs.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_batch_jobs_user_id ON public.batch_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_batch_jobs_status ON public.batch_jobs(status);
CREATE INDEX IF NOT EXISTS idx_batch_items_batch_id ON public.batch_items(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_items_status ON public.batch_items(status);

-- Create trigger for updated_at
CREATE TRIGGER update_batch_jobs_updated_at
  BEFORE UPDATE ON public.batch_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for progress tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.batch_jobs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.batch_items;