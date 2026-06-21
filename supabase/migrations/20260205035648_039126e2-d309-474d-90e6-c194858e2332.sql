-- Add column to track if user has claimed knowledge base bonus
ALTER TABLE public.profiles 
ADD COLUMN knowledge_base_bonus_claimed boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.knowledge_base_bonus_claimed IS 'Tracks if user has claimed the 2 credit bonus for visiting the knowledge base';