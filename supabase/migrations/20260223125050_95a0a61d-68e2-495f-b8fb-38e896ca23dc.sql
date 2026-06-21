
-- Add is_public flag to generations for community feature
ALTER TABLE public.generations ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Add tool_name to track which tool was used
ALTER TABLE public.generations ADD COLUMN tool_name text;

-- Allow anyone to view public generations (for Community feed)
CREATE POLICY "Anyone can view public generations"
ON public.generations
FOR SELECT
USING (is_public = true);

-- Index for efficient community queries
CREATE INDEX idx_generations_public ON public.generations (is_public, created_at DESC) WHERE is_public = true;
