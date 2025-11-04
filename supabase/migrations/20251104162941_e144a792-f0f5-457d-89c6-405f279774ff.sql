-- Create customers table
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id text UNIQUE NOT NULL,
  customer_name text NOT NULL,
  email text,
  phone text,
  billing_address text,
  shipping_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create sales_orders table
CREATE TABLE public.sales_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_order_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE NOT NULL,
  order_date date NOT NULL,
  expected_shipment_date date,
  order_status text NOT NULL DEFAULT 'open',
  invoice_status text NOT NULL DEFAULT 'not_invoiced',
  payment_status text NOT NULL DEFAULT 'unpaid',
  shipment_status text NOT NULL DEFAULT 'unfulfilled',
  sales_channel text,
  template_name text,
  currency_code text NOT NULL DEFAULT 'USD',
  exchange_rate numeric NOT NULL DEFAULT 1.0,
  discount_type text NOT NULL DEFAULT 'none',
  is_discount_before_tax boolean NOT NULL DEFAULT false,
  entity_discount_amount numeric NOT NULL DEFAULT 0,
  entity_discount_percent numeric NOT NULL DEFAULT 0,
  subtotal numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  shipping_charge numeric NOT NULL DEFAULT 0,
  adjustment numeric NOT NULL DEFAULT 0,
  adjustment_description text,
  payment_terms text,
  payment_terms_label text,
  source text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create sales_order_items table
CREATE TABLE public.sales_order_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sales_order_id uuid REFERENCES public.sales_orders(id) ON DELETE CASCADE NOT NULL,
  inventory_id uuid REFERENCES public.inventory(id) ON DELETE SET NULL,
  item_name text NOT NULL,
  product_id text,
  sku text,
  account text,
  item_description text,
  quantity_ordered numeric NOT NULL DEFAULT 0,
  quantity_invoiced numeric NOT NULL DEFAULT 0,
  quantity_packed numeric NOT NULL DEFAULT 0,
  quantity_fulfilled numeric NOT NULL DEFAULT 0,
  quantity_cancelled numeric NOT NULL DEFAULT 0,
  usage_unit text NOT NULL DEFAULT 'pairs',
  item_price numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  discount_amount numeric NOT NULL DEFAULT 0,
  item_total numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for customers
CREATE POLICY "Allow public to read customers" ON public.customers FOR SELECT USING (true);
CREATE POLICY "Allow public to insert customers" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public to update customers" ON public.customers FOR UPDATE USING (true);
CREATE POLICY "Allow public to delete customers" ON public.customers FOR DELETE USING (true);

-- RLS Policies for sales_orders
CREATE POLICY "Allow public to read sales orders" ON public.sales_orders FOR SELECT USING (true);
CREATE POLICY "Allow public to insert sales orders" ON public.sales_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public to update sales orders" ON public.sales_orders FOR UPDATE USING (true);
CREATE POLICY "Allow public to delete sales orders" ON public.sales_orders FOR DELETE USING (true);

-- RLS Policies for sales_order_items
CREATE POLICY "Allow public to read sales order items" ON public.sales_order_items FOR SELECT USING (true);
CREATE POLICY "Allow public to insert sales order items" ON public.sales_order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public to update sales order items" ON public.sales_order_items FOR UPDATE USING (true);
CREATE POLICY "Allow public to delete sales order items" ON public.sales_order_items FOR DELETE USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_orders_updated_at
  BEFORE UPDATE ON public.sales_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sales_order_items_updated_at
  BEFORE UPDATE ON public.sales_order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to auto-update sales order statuses based on items
CREATE OR REPLACE FUNCTION public.update_sales_order_statuses()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_ordered numeric;
  total_invoiced numeric;
  total_fulfilled numeric;
BEGIN
  -- Calculate totals for the sales order
  SELECT 
    COALESCE(SUM(quantity_ordered), 0),
    COALESCE(SUM(quantity_invoiced), 0),
    COALESCE(SUM(quantity_fulfilled), 0)
  INTO total_ordered, total_invoiced, total_fulfilled
  FROM public.sales_order_items
  WHERE sales_order_id = COALESCE(NEW.sales_order_id, OLD.sales_order_id);

  -- Update invoice status
  IF total_invoiced = 0 THEN
    UPDATE public.sales_orders
    SET invoice_status = 'not_invoiced'
    WHERE id = COALESCE(NEW.sales_order_id, OLD.sales_order_id);
  ELSIF total_invoiced >= total_ordered THEN
    UPDATE public.sales_orders
    SET invoice_status = 'invoiced'
    WHERE id = COALESCE(NEW.sales_order_id, OLD.sales_order_id);
  ELSE
    UPDATE public.sales_orders
    SET invoice_status = 'partially_invoiced'
    WHERE id = COALESCE(NEW.sales_order_id, OLD.sales_order_id);
  END IF;

  -- Update shipment status
  IF total_fulfilled = 0 THEN
    UPDATE public.sales_orders
    SET shipment_status = 'unfulfilled'
    WHERE id = COALESCE(NEW.sales_order_id, OLD.sales_order_id);
  ELSIF total_fulfilled >= total_ordered THEN
    UPDATE public.sales_orders
    SET shipment_status = 'fulfilled'
    WHERE id = COALESCE(NEW.sales_order_id, OLD.sales_order_id);
  ELSE
    UPDATE public.sales_orders
    SET shipment_status = 'partially_fulfilled'
    WHERE id = COALESCE(NEW.sales_order_id, OLD.sales_order_id);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Trigger to update sales order statuses when items change
CREATE TRIGGER update_order_statuses_on_item_change
  AFTER INSERT OR UPDATE OR DELETE ON public.sales_order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_sales_order_statuses();

-- Function to deduct inventory when items are fulfilled
CREATE OR REPLACE FUNCTION public.deduct_inventory_on_fulfillment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quantity_diff numeric;
BEGIN
  -- Only process if quantity_fulfilled changed and inventory_id exists
  IF (TG_OP = 'UPDATE' AND OLD.quantity_fulfilled != NEW.quantity_fulfilled AND NEW.inventory_id IS NOT NULL) THEN
    quantity_diff := NEW.quantity_fulfilled - OLD.quantity_fulfilled;
    
    -- Deduct from inventory
    UPDATE public.inventory
    SET stock_on_hand = stock_on_hand - quantity_diff
    WHERE id = NEW.inventory_id;
    
    -- Log transaction
    INSERT INTO public.inventory_transactions (
      inventory_id, item_name, category, quantity_change,
      stock_after, transaction_type
    )
    SELECT 
      NEW.inventory_id,
      i.item_name,
      i.category,
      -quantity_diff,
      i.stock_on_hand,
      'sales_order'
    FROM public.inventory i
    WHERE i.id = NEW.inventory_id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger to deduct inventory on fulfillment
CREATE TRIGGER deduct_inventory_on_item_fulfillment
  AFTER UPDATE ON public.sales_order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.deduct_inventory_on_fulfillment();

-- Insert example customer
INSERT INTO public.customers (customer_id, customer_name, billing_address)
VALUES ('CUST-001', 'Doc''s Recovery House', 'Doc''s Recovery House');

-- Insert example sales order SO-00628
INSERT INTO public.sales_orders (
  sales_order_number, customer_id, order_date, order_status,
  invoice_status, payment_status, shipment_status, payment_terms,
  subtotal, total
)
SELECT 
  'SO-00628',
  id,
  '2025-10-13'::date,
  'closed',
  'invoiced',
  'paid',
  'fulfilled',
  'Due on Receipt',
  0,
  0
FROM public.customers WHERE customer_id = 'CUST-001';

-- Insert sales order items for SO-00628
INSERT INTO public.sales_order_items (
  sales_order_id, item_name, quantity_ordered, quantity_invoiced,
  quantity_packed, quantity_fulfilled, usage_unit, item_price, item_total
)
SELECT 
  so.id,
  items.item_name,
  items.quantity,
  items.quantity,
  0,
  items.quantity,
  'pairs',
  0,
  0
FROM public.sales_orders so
CROSS JOIN (VALUES
  ('Mens Bombas UW - XS/S', 30),
  ('Mens Bombas UW M/L', 30),
  ('Mens Bombas UW XL/2XL', 30),
  ('Womens Bombas UW - XS/S', 30),
  ('Womens Bombas UW M/L', 30),
  ('Womens Bombas UW XL/2XL', 30),
  ('mens underwear-small', 18),
  ('mens underwear-medium', 24),
  ('mens underwear-large', 24),
  ('mens underwear-XL', 18),
  ('mens underwear-2XL', 15),
  ('mens underwear-3XL', 9),
  ('womens underwear-small', 24),
  ('womens underwear-medium', 24),
  ('womens underwear-large', 30),
  ('womens underwear-XL', 30),
  ('womens underwear-2-3XL', 30),
  ('womens underwear-4XL-5XL', 15),
  ('womens socks', 45),
  ('mens socks', 45)
) AS items(item_name, quantity)
WHERE so.sales_order_number = 'SO-00628';