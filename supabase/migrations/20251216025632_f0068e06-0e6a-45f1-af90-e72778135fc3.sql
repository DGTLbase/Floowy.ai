-- Allow users to insert their own cancellation feedback
CREATE POLICY "Users can submit cancellation feedback"
ON public.cancellation_feedback
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own feedback
CREATE POLICY "Users can view their own feedback"
ON public.cancellation_feedback
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to view all feedback
CREATE POLICY "Admins can view all feedback"
ON public.cancellation_feedback
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));