-- Add notes column to customers for company import
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS notes text NULL;