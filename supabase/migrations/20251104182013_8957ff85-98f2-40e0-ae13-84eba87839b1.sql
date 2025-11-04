-- Add new columns to customers table for company management
ALTER TABLE public.customers
ADD COLUMN first_name text,
ADD COLUMN last_name text,
ADD COLUMN customer_sub_type text;

-- Add index for faster lookups
CREATE INDEX idx_customers_customer_sub_type ON public.customers(customer_sub_type);
CREATE INDEX idx_customers_name ON public.customers(customer_name);