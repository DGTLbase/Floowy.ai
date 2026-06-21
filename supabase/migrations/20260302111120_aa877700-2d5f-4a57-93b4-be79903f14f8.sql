
-- Add permissive SELECT policy for admin users to view scheduled emails
CREATE POLICY "Admins can view scheduled emails"
ON public.scheduled_emails
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
