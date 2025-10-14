-- Create inventory transactions table to track all changes
CREATE TABLE public.inventory_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id uuid NOT NULL REFERENCES public.inventory(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  category text NOT NULL,
  quantity_change numeric NOT NULL,
  stock_after numeric NOT NULL,
  transaction_type text NOT NULL, -- 'addition', 'removal', 'adjustment', 'initial'
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Allow public to read transactions"
  ON public.inventory_transactions FOR SELECT
  USING (true);

CREATE POLICY "Allow public to insert transactions"
  ON public.inventory_transactions FOR INSERT
  WITH CHECK (true);

-- Create index for faster date range queries
CREATE INDEX idx_transactions_created_at ON public.inventory_transactions(created_at DESC);
CREATE INDEX idx_transactions_category ON public.inventory_transactions(category);

-- Create function to log inventory changes
CREATE OR REPLACE FUNCTION public.log_inventory_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  quantity_diff numeric;
  trans_type text;
BEGIN
  IF (TG_OP = 'INSERT') THEN
    -- New item added
    INSERT INTO public.inventory_transactions (
      inventory_id, item_name, category, quantity_change, 
      stock_after, transaction_type
    ) VALUES (
      NEW.id, NEW.item_name, NEW.category, NEW.stock_on_hand,
      NEW.stock_on_hand, 'initial'
    );
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Stock changed
    quantity_diff := NEW.stock_on_hand - OLD.stock_on_hand;
    
    IF quantity_diff != 0 THEN
      -- Determine transaction type
      IF quantity_diff > 0 THEN
        trans_type := 'addition';
      ELSE
        trans_type := 'removal';
      END IF;
      
      INSERT INTO public.inventory_transactions (
        inventory_id, item_name, category, quantity_change,
        stock_after, transaction_type
      ) VALUES (
        NEW.id, NEW.item_name, NEW.category, quantity_diff,
        NEW.stock_on_hand, trans_type
      );
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger to automatically log changes
CREATE TRIGGER track_inventory_changes
AFTER INSERT OR UPDATE ON public.inventory
FOR EACH ROW
EXECUTE FUNCTION public.log_inventory_change();