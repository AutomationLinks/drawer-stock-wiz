-- Create donations table to store all donation records
CREATE TABLE public.donations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  organization TEXT,
  amount NUMERIC NOT NULL,
  processing_fee NUMERIC DEFAULT 0,
  total_amount NUMERIC NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('one-time', 'monthly')),
  campaign TEXT NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Create policies for donations table (public read, restricted write)
CREATE POLICY "Allow public to read donations" 
ON public.donations 
FOR SELECT 
USING (true);

CREATE POLICY "Allow system to insert donations" 
ON public.donations 
FOR INSERT 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_donations_updated_at
BEFORE UPDATE ON public.donations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create page_views table to track website analytics
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_url TEXT NOT NULL,
  session_id TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Create policies for page_views table
CREATE POLICY "Allow public to insert page views" 
ON public.page_views 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public to read page views" 
ON public.page_views 
FOR SELECT 
USING (true);

-- Create indexes for better query performance
CREATE INDEX idx_donations_created_at ON public.donations(created_at DESC);
CREATE INDEX idx_donations_email ON public.donations(email);
CREATE INDEX idx_donations_status ON public.donations(status);
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at DESC);
CREATE INDEX idx_page_views_page_url ON public.page_views(page_url);