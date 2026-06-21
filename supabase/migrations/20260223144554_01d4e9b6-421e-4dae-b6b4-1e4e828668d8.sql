-- Allow authenticated users to read full_name from any profile (for community display)
CREATE POLICY "Authenticated users can view names"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated');
