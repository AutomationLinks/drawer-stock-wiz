-- Create invoices table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'draft',
  subtotal NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice_items table
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  inventory_id UUID NOT NULL REFERENCES public.inventory(id) ON DELETE RESTRICT,
  item_name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  price NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for invoices
CREATE POLICY "Allow public to read invoices" 
ON public.invoices 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public to insert invoices" 
ON public.invoices 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public to update invoices" 
ON public.invoices 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public to delete invoices" 
ON public.invoices 
FOR DELETE 
USING (true);

-- Create RLS policies for invoice_items
CREATE POLICY "Allow public to read invoice items" 
ON public.invoice_items 
FOR SELECT 
USING (true);

CREATE POLICY "Allow public to insert invoice items" 
ON public.invoice_items 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Allow public to update invoice items" 
ON public.invoice_items 
FOR UPDATE 
USING (true);

CREATE POLICY "Allow public to delete invoice items" 
ON public.invoice_items 
FOR DELETE 
USING (true);

-- Create function to generate invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_number INTEGER;
  invoice_num TEXT;
BEGIN
  -- Get the highest invoice number and increment
  SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM 5) AS INTEGER)), 0) + 1
  INTO next_number
  FROM public.invoices;
  
  -- Format as INV-000001
  invoice_num := 'INV-' || LPAD(next_number::TEXT, 6, '0');
  
  RETURN invoice_num;
END;
$$;

-- Create trigger to auto-generate invoice number
CREATE OR REPLACE FUNCTION public.set_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := public.generate_invoice_number();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_invoice_number_trigger
BEFORE INSERT ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.set_invoice_number();

-- Create trigger to update invoice totals
CREATE OR REPLACE FUNCTION public.update_invoice_totals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  invoice_subtotal NUMERIC;
BEGIN
  -- Calculate totals for the invoice
  SELECT COALESCE(SUM(total), 0)
  INTO invoice_subtotal
  FROM public.invoice_items
  WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  -- Update invoice totals
  UPDATE public.invoices
  SET 
    subtotal = invoice_subtotal,
    total = invoice_subtotal,
    updated_at = now()
  WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER update_invoice_totals_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.invoice_items
FOR EACH ROW
EXECUTE FUNCTION public.update_invoice_totals();

-- Create trigger to deduct inventory on invoice fulfillment
CREATE OR REPLACE FUNCTION public.deduct_inventory_on_invoice_fulfillment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  item RECORD;
BEGIN
  -- Only process when status changes to 'fulfilled'
  IF (TG_OP = 'UPDATE' AND OLD.status != 'fulfilled' AND NEW.status = 'fulfilled') THEN
    -- Loop through all invoice items
    FOR item IN 
      SELECT inventory_id, item_name, quantity
      FROM public.invoice_items
      WHERE invoice_id = NEW.id
    LOOP
      -- Deduct from inventory
      UPDATE public.inventory
      SET stock_on_hand = stock_on_hand - item.quantity
      WHERE id = item.inventory_id;
      
      -- Log transaction
      INSERT INTO public.inventory_transactions (
        inventory_id, item_name, category, quantity_change,
        stock_after, transaction_type
      )
      SELECT 
        item.inventory_id,
        i.item_name,
        i.category,
        -item.quantity,
        i.stock_on_hand,
        'invoice'
      FROM public.inventory i
      WHERE i.id = item.inventory_id;
    END LOOP;
    
    -- Update fulfilled timestamp
    NEW.fulfilled_at = now();
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER deduct_inventory_on_invoice_fulfillment_trigger
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.deduct_inventory_on_invoice_fulfillment();

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();