-- Add pricing column to inventory table
ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS price_per_unit NUMERIC DEFAULT 2.00;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);

-- Update existing Bombas items to $10
UPDATE inventory 
SET price_per_unit = 10.00 
WHERE category IN ('Bombas Socks', 'Bombas Underwear') 
   OR item_name ILIKE '%bombas%';

-- Update all other items to $2
UPDATE inventory 
SET price_per_unit = 2.00 
WHERE price_per_unit IS NULL
   OR (category NOT IN ('Bombas Socks', 'Bombas Underwear') 
       AND item_name NOT ILIKE '%bombas%');

-- Add pricing columns to inventory_transactions
ALTER TABLE inventory_transactions
ADD COLUMN IF NOT EXISTS value_per_unit NUMERIC,
ADD COLUMN IF NOT EXISTS total_value NUMERIC;

-- Update the deduct_inventory_on_invoice_fulfillment trigger to include pricing
CREATE OR REPLACE FUNCTION public.deduct_inventory_on_invoice_fulfillment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  item RECORD;
  item_price NUMERIC;
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.status != 'fulfilled' AND NEW.status = 'fulfilled') THEN
    FOR item IN 
      SELECT ii.inventory_id, ii.item_name, ii.quantity, i.price_per_unit
      FROM public.invoice_items ii
      JOIN public.inventory i ON ii.inventory_id = i.id
      WHERE ii.invoice_id = NEW.id
    LOOP
      -- Deduct from inventory
      UPDATE public.inventory
      SET stock_on_hand = stock_on_hand - item.quantity
      WHERE id = item.inventory_id;
      
      -- Get price (default to 2.00 if not set)
      item_price := COALESCE(item.price_per_unit, 2.00);
      
      -- Log transaction with pricing
      INSERT INTO public.inventory_transactions (
        inventory_id, item_name, category, quantity_change,
        stock_after, transaction_type, value_per_unit, total_value
      )
      SELECT 
        item.inventory_id,
        i.item_name,
        i.category,
        -item.quantity,
        i.stock_on_hand,
        'invoice',
        item_price,
        item_price * item.quantity
      FROM public.inventory i
      WHERE i.id = item.inventory_id;
    END LOOP;
    
    NEW.fulfilled_at = now();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update the deduct_inventory_on_fulfillment trigger for sales orders
CREATE OR REPLACE FUNCTION public.deduct_inventory_on_fulfillment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  quantity_diff numeric;
  item_price numeric;
BEGIN
  IF (TG_OP = 'UPDATE' AND OLD.quantity_fulfilled != NEW.quantity_fulfilled AND NEW.inventory_id IS NOT NULL) THEN
    quantity_diff := NEW.quantity_fulfilled - OLD.quantity_fulfilled;
    
    -- Get price from inventory
    SELECT COALESCE(price_per_unit, 2.00) INTO item_price
    FROM public.inventory
    WHERE id = NEW.inventory_id;
    
    -- Deduct from inventory
    UPDATE public.inventory
    SET stock_on_hand = stock_on_hand - quantity_diff
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
      -quantity_diff,
      i.stock_on_hand,
      'sales_order',
      item_price,
      item_price * quantity_diff
    FROM public.inventory i
    WHERE i.id = NEW.inventory_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update log_inventory_change trigger to include pricing
CREATE OR REPLACE FUNCTION public.log_inventory_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  quantity_diff numeric;
  trans_type text;
  item_price numeric;
BEGIN
  -- Get price (default to 2.00)
  item_price := COALESCE(NEW.price_per_unit, 2.00);
  
  IF (TG_OP = 'INSERT') THEN
    -- New item added
    INSERT INTO public.inventory_transactions (
      inventory_id, item_name, category, quantity_change, 
      stock_after, transaction_type, value_per_unit, total_value
    ) VALUES (
      NEW.id, NEW.item_name, NEW.category, NEW.stock_on_hand,
      NEW.stock_on_hand, 'initial', item_price, item_price * NEW.stock_on_hand
    );
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    quantity_diff := NEW.stock_on_hand - OLD.stock_on_hand;
    
    IF quantity_diff != 0 THEN
      IF quantity_diff > 0 THEN
        trans_type := 'addition';
      ELSE
        trans_type := 'removal';
      END IF;
      
      INSERT INTO public.inventory_transactions (
        inventory_id, item_name, category, quantity_change,
        stock_after, transaction_type, value_per_unit, total_value
      ) VALUES (
        NEW.id, NEW.item_name, NEW.category, quantity_diff,
        NEW.stock_on_hand, trans_type, item_price, item_price * ABS(quantity_diff)
      );
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;