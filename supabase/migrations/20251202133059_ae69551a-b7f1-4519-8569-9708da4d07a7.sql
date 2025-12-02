-- Modify the trigger function to ADD to inventory instead of subtract
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
    
    -- ADD to inventory (changed from subtract)
    UPDATE public.inventory
    SET stock_on_hand = stock_on_hand + quantity_diff
    WHERE id = NEW.inventory_id;
    
    -- Log transaction with positive quantity (incoming)
    INSERT INTO public.inventory_transactions (
      inventory_id, item_name, category, quantity_change,
      stock_after, transaction_type, value_per_unit, total_value
    )
    SELECT 
      NEW.inventory_id,
      i.item_name,
      i.category,
      quantity_diff,
      i.stock_on_hand,
      'incoming_sales_order',
      item_price,
      item_price * quantity_diff
    FROM public.inventory i
    WHERE i.id = NEW.inventory_id;
  END IF;
  
  RETURN NEW;
END;
$function$;