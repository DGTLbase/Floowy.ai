
CREATE TABLE public.scheduled_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  recipient_emails JSONB NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.admin_accounts(id)
);

ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage scheduled emails"
ON public.scheduled_emails
FOR ALL
USING (true)
WITH CHECK (true);

CREATE INDEX idx_scheduled_emails_status_scheduled_at 
ON public.scheduled_emails (status, scheduled_at);
