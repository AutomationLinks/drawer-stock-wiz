-- Create table for storing additional attendee names for group signups
CREATE TABLE public.volunteer_signup_attendees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signup_id UUID NOT NULL REFERENCES public.volunteer_signups(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.volunteer_signup_attendees ENABLE ROW LEVEL SECURITY;

-- Allow public to read attendees
CREATE POLICY "Allow public to read attendees" 
ON public.volunteer_signup_attendees 
FOR SELECT USING (true);

-- Allow public to insert attendees
CREATE POLICY "Allow public to insert attendees" 
ON public.volunteer_signup_attendees 
FOR INSERT WITH CHECK (true);