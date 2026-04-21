CREATE POLICY "Allow public to delete volunteer signups"
ON public.volunteer_signups
FOR DELETE
USING (true);