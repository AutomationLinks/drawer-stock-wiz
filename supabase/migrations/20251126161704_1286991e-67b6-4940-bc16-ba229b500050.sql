-- Add DELETE policy to volunteer_events table
CREATE POLICY "Allow public to delete volunteer events"
ON public.volunteer_events
FOR DELETE
USING (true);

-- Delete old 2025 events (before October 2025)
DELETE FROM public.volunteer_events
WHERE event_date < '2025-10-01';