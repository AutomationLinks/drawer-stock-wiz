-- Bulk update all existing sales orders to closed/paid/fulfilled status
-- This is a one-time migration to mark historical orders as complete

UPDATE public.sales_orders
SET 
  order_status = 'closed',
  payment_status = 'paid',
  shipment_status = 'fulfilled',
  updated_at = now()
WHERE order_status = 'open' 
  AND payment_status = 'unpaid' 
  AND shipment_status = 'unfulfilled';

-- Add comment for documentation
COMMENT ON TABLE public.sales_orders IS 'Sales orders table. Historical orders bulk updated to closed/paid/fulfilled on 2025-01-04.';