-- Create partners table
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address_line_1 TEXT,
  address_line_2 TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT NOT NULL,
  country TEXT DEFAULT 'USA',
  latitude NUMERIC,
  longitude NUMERIC,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_partners_postal_code ON public.partners(postal_code);
CREATE INDEX idx_partners_active ON public.partners(active);
CREATE INDEX idx_partners_name ON public.partners(name);

-- Enable Row Level Security
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for public access
CREATE POLICY "Allow public to read active partners"
  ON public.partners
  FOR SELECT
  USING (active = true);

CREATE POLICY "Allow public to insert partners"
  ON public.partners
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public to update partners"
  ON public.partners
  FOR UPDATE
  USING (true);

CREATE POLICY "Allow public to delete partners"
  ON public.partners
  FOR DELETE
  USING (true);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();