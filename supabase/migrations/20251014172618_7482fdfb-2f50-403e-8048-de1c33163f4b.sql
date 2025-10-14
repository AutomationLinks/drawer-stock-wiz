-- Create inventory table with all necessary fields
CREATE TABLE public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name text NOT NULL,
  category text NOT NULL,
  status text DEFAULT 'Active',
  unit text DEFAULT 'pairs',
  opening_stock numeric DEFAULT 0,
  stock_on_hand numeric NOT NULL DEFAULT 0,
  item_type text DEFAULT 'Inventory',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (no auth required for inventory management)
CREATE POLICY "Allow public to read inventory"
  ON public.inventory FOR SELECT
  USING (true);

CREATE POLICY "Allow public to insert inventory"
  ON public.inventory FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public to update inventory"
  ON public.inventory FOR UPDATE
  USING (true);

CREATE POLICY "Allow public to delete inventory"
  ON public.inventory FOR DELETE
  USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_inventory_updated_at
BEFORE UPDATE ON public.inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster category lookups
CREATE INDEX idx_inventory_category ON public.inventory(category);
CREATE INDEX idx_inventory_status ON public.inventory(status);