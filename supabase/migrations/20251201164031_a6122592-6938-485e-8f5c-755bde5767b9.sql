CREATE TABLE public.cancellation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reason TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX idx_cancellation_feedback_user_id ON public.cancellation_feedback(user_id);
CREATE INDEX idx_cancellation_feedback_created_at ON public.cancellation_feedback(created_at DESC);