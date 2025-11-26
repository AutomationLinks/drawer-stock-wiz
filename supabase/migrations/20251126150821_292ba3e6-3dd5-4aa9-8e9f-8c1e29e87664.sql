-- Phase 4: Incoming Donations System
-- Create incoming_donations table
CREATE TABLE IF NOT EXISTS public.incoming_donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  donation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create incoming_donation_items table
CREATE TABLE IF NOT EXISTS public.incoming_donation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donation_id UUID REFERENCES public.incoming_donations(id) ON DELETE CASCADE,
  inventory_id UUID REFERENCES public.inventory(id) ON DELETE SET NULL,
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.incoming_donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incoming_donation_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for incoming_donations
CREATE POLICY "Allow public to read incoming donations"
  ON public.incoming_donations FOR SELECT
  USING (true);

CREATE POLICY "Allow public to insert incoming donations"
  ON public.incoming_donations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public to update incoming donations"
  ON public.incoming_donations FOR UPDATE
  USING (true);

CREATE POLICY "Allow public to delete incoming donations"
  ON public.incoming_donations FOR DELETE
  USING (true);

-- RLS Policies for incoming_donation_items
CREATE POLICY "Allow public to read incoming donation items"
  ON public.incoming_donation_items FOR SELECT
  USING (true);

CREATE POLICY "Allow public to insert incoming donation items"
  ON public.incoming_donation_items FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public to update incoming donation items"
  ON public.incoming_donation_items FOR UPDATE
  USING (true);

CREATE POLICY "Allow public to delete incoming donation items"
  ON public.incoming_donation_items FOR DELETE
  USING (true);

-- Database trigger to auto-increment inventory when donation items are added
CREATE OR REPLACE FUNCTION public.update_inventory_on_incoming_donation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item_price NUMERIC;
BEGIN
  IF NEW.inventory_id IS NOT NULL THEN
    -- Get price from inventory
    SELECT COALESCE(price_per_unit, 2.00) INTO item_price
    FROM public.inventory
    WHERE id = NEW.inventory_id;
    
    -- Add to inventory stock
    UPDATE public.inventory
    SET stock_on_hand = stock_on_hand + NEW.quantity
    WHERE id = NEW.inventory_id;
    
    -- Log transaction with pricing
    INSERT INTO public.inventory_transactions (
      inventory_id, item_name, category, quantity_change,
      stock_after, transaction_type, value_per_unit, total_value
    )
    SELECT 
      NEW.inventory_id,
      i.item_name,
      i.category,
      NEW.quantity,
      i.stock_on_hand,
      'incoming_donation',
      item_price,
      item_price * NEW.quantity
    FROM public.inventory i
    WHERE i.id = NEW.inventory_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_incoming_donation_inventory
AFTER INSERT ON public.incoming_donation_items
FOR EACH ROW EXECUTE FUNCTION public.update_inventory_on_incoming_donation();

-- Phase 5: Event Ticket Sales Integration
-- Add ticket fields to volunteer_events table
ALTER TABLE public.volunteer_events 
ADD COLUMN IF NOT EXISTS ticket_price NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS requires_payment BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ticket_purchase_url TEXT DEFAULT NULL;