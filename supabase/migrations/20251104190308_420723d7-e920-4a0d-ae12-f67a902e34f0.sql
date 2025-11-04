-- Add new columns to donations table
ALTER TABLE public.donations
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS coupon_code TEXT,
ADD COLUMN IF NOT EXISTS is_test_mode BOOLEAN DEFAULT false;

-- Add indexes for filtering
CREATE INDEX IF NOT EXISTS idx_donations_frequency ON public.donations(frequency);
CREATE INDEX IF NOT EXISTS idx_donations_is_test_mode ON public.donations(is_test_mode);
CREATE INDEX IF NOT EXISTS idx_donations_coupon_code ON public.donations(coupon_code);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON public.donations(created_at);

-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL,
  min_amount NUMERIC DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for coupons
CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons(active);

-- Enable RLS on coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if exists and recreate
DROP POLICY IF EXISTS "Allow public to read active coupons" ON public.coupons;
CREATE POLICY "Allow public to read active coupons" 
ON public.coupons FOR SELECT 
USING (active = true AND (expires_at IS NULL OR expires_at > now()));

-- Insert sample coupons
INSERT INTO public.coupons (code, discount_type, discount_value, active) VALUES
  ('SAVE10', 'percentage', 10, true),
  ('SAVE20', 'percentage', 20, true),
  ('WELCOME', 'percentage', 15, true),
  ('THANKYOU', 'fixed', 5, true)
ON CONFLICT (code) DO NOTHING;

-- Enable realtime on donations table
ALTER TABLE public.donations REPLICA IDENTITY FULL;