-- Create volunteer_events table
CREATE TABLE public.volunteer_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  location TEXT NOT NULL,
  location_address TEXT NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 10,
  slots_filled INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create volunteer_signups table
CREATE TABLE public.volunteer_signups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.volunteer_events(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.volunteer_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.volunteer_signups ENABLE ROW LEVEL SECURITY;

-- Create policies for volunteer_events (public read)
CREATE POLICY "Allow public to read volunteer events"
ON public.volunteer_events
FOR SELECT
USING (true);

CREATE POLICY "Allow public to insert volunteer events"
ON public.volunteer_events
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow public to update volunteer events"
ON public.volunteer_events
FOR UPDATE
USING (true);

-- Create policies for volunteer_signups (public can insert and read their own)
CREATE POLICY "Allow public to read volunteer signups"
ON public.volunteer_signups
FOR SELECT
USING (true);

CREATE POLICY "Allow public to insert volunteer signups"
ON public.volunteer_signups
FOR INSERT
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_volunteer_events_updated_at
BEFORE UPDATE ON public.volunteer_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to update slots_filled when signup is added
CREATE OR REPLACE FUNCTION public.update_event_slots()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.volunteer_events
    SET slots_filled = slots_filled + NEW.quantity
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.volunteer_events
    SET slots_filled = slots_filled - OLD.quantity
    WHERE id = OLD.event_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic slot count updates
CREATE TRIGGER update_event_slots_on_signup
AFTER INSERT OR DELETE ON public.volunteer_signups
FOR EACH ROW
EXECUTE FUNCTION public.update_event_slots();