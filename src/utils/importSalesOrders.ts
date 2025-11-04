import { supabase } from "@/integrations/supabase/client";
import { parseCSV, validateRequiredColumns, parseDate, parseNumber, ParsedCSVRow } from "./csvParser";

const BATCH_SIZE = 50;

const REQUIRED_COLUMNS = [
  "SalesOrder Number",
  "Order Date",
  "Customer Name",
  "Item Name",
  "QuantityOrdered",
];

interface CustomerMap {
  [key: string]: string; // customer_name -> uuid
}

interface SalesOrderMap {
  [key: string]: string; // sales_order_number -> uuid
}

type ProgressCallback = (current: number, total: number, successful: number, failed: number) => void;

export const importSalesOrdersFromCSV = async (
  file: File,
  onProgress?: ProgressCallback
) => {
  const errors: string[] = [];
  let successCount = 0;
  let failedCount = 0;

  try {
    // Parse CSV
    const rows = await parseCSV(file);
    
    if (rows.length === 0) {
      return { success: false, successCount: 0, errors: ['CSV file is empty'] };
    }

    // Validate first row has required columns
    const validationError = validateRequiredColumns(rows[0], REQUIRED_COLUMNS);
    if (validationError) {
      return { success: false, successCount: 0, errors: [validationError] };
    }

    // Step 1: Create/match customers
    const customerMap = await createOrMatchCustomers(rows, errors);

    // Step 2: Group rows by sales order number
    const orderGroups = groupRowsByOrder(rows);
    const totalOrders = Object.keys(orderGroups).length;

    // Step 3: Process orders in batches
    const orderNumbers = Object.keys(orderGroups);
    const salesOrderMap: SalesOrderMap = {};
    
    for (let i = 0; i < orderNumbers.length; i += BATCH_SIZE) {
      const batch = orderNumbers.slice(i, i + BATCH_SIZE);
      
      for (const orderNumber of batch) {
        try {
          const orderRows = orderGroups[orderNumber];
          const orderId = await createSalesOrder(orderRows[0], customerMap, errors);
          
          if (orderId) {
            salesOrderMap[orderNumber] = orderId;
            
            // Create order items
            await createSalesOrderItems(orderId, orderRows, errors);
            successCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          failedCount++;
          errors.push(`Order ${orderNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        if (onProgress) {
          onProgress(i + batch.indexOf(orderNumber) + 1, totalOrders, successCount, failedCount);
        }
      }
    }

    return {
      success: successCount > 0,
      successCount,
      errors,
    };
  } catch (error) {
    console.error('Import error:', error);
    return {
      success: false,
      successCount: 0,
      errors: [error instanceof Error ? error.message : 'Unknown error occurred'],
    };
  }
};

const createOrMatchCustomers = async (rows: ParsedCSVRow[], errors: string[]): Promise<CustomerMap> => {
  const customerMap: CustomerMap = {};
  const uniqueCustomers = new Map<string, ParsedCSVRow>();

  // Extract unique customers
  rows.forEach(row => {
    const customerName = row["Customer Name"];
    if (customerName && !uniqueCustomers.has(customerName)) {
      uniqueCustomers.set(customerName, row);
    }
  });

  // Check existing customers
  const { data: existingCustomers } = await supabase
    .from('customers')
    .select('id, customer_name')
    .in('customer_name', Array.from(uniqueCustomers.keys()));

  existingCustomers?.forEach(customer => {
    customerMap[customer.customer_name] = customer.id;
  });

  // Create new customers
  const newCustomers: any[] = [];
  for (const [customerName, row] of uniqueCustomers) {
    if (!customerMap[customerName]) {
      newCustomers.push({
        customer_id: row["Customer ID"] || `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        customer_name: customerName,
        email: row["Email"] || null,
        phone: row["Phone"] || null,
        billing_address: row["Billing Address"] || null,
        shipping_address: row["Shipping Address"] || null,
      });
    }
  }

  if (newCustomers.length > 0) {
    const { data: createdCustomers, error } = await supabase
      .from('customers')
      .insert(newCustomers)
      .select('id, customer_name');

    if (error) {
      errors.push(`Error creating customers: ${error.message}`);
    } else {
      createdCustomers?.forEach(customer => {
        customerMap[customer.customer_name] = customer.id;
      });
    }
  }

  return customerMap;
};

const groupRowsByOrder = (rows: ParsedCSVRow[]): { [orderNumber: string]: ParsedCSVRow[] } => {
  const groups: { [orderNumber: string]: ParsedCSVRow[] } = {};
  
  rows.forEach(row => {
    const orderNumber = row["SalesOrder Number"];
    if (orderNumber) {
      if (!groups[orderNumber]) {
        groups[orderNumber] = [];
      }
      groups[orderNumber].push(row);
    }
  });
  
  return groups;
};

const createSalesOrder = async (
  row: ParsedCSVRow,
  customerMap: CustomerMap,
  errors: string[]
): Promise<string | null> => {
  const customerName = row["Customer Name"];
  const customerId = customerMap[customerName];

  if (!customerId) {
    errors.push(`Order ${row["SalesOrder Number"]}: Customer not found`);
    return null;
  }

  const orderDate = parseDate(row["Order Date"]);
  if (!orderDate) {
    errors.push(`Order ${row["SalesOrder Number"]}: Invalid order date`);
    return null;
  }

  const orderData = {
    sales_order_number: row["SalesOrder Number"],
    customer_id: customerId,
    order_date: orderDate.toISOString().split('T')[0],
    expected_shipment_date: parseDate(row["Expected Shipment Date"])?.toISOString().split('T')[0] || null,
    order_status: mapStatus(row["Status"]) || 'open',
    invoice_status: mapInvoiceStatus(row["Invoice Status"] || row["Invoice"]) || 'not_invoiced',
    payment_status: mapPaymentStatus(row["Payment Status"] || row["Payment"]) || 'unpaid',
    shipment_status: mapShipmentStatus(row["Shipment Status"] || row["Shipment"]) || 'unfulfilled',
    sales_channel: row["Sales Channel"] || null,
    template_name: row["Template Name"] || null,
    currency_code: row["Currency Code"] || 'USD',
    exchange_rate: parseNumber(row["Exchange Rate"]) || 1.0,
    discount_type: row["Discount Type"] || 'none',
    is_discount_before_tax: row["Is Discount Before Tax"]?.toLowerCase() === 'true',
    entity_discount_amount: parseNumber(row["Entity Discount Amount"]) || 0,
    entity_discount_percent: parseNumber(row["Entity Discount Percent"]) || 0,
    subtotal: parseNumber(row["SubTotal"]) || 0,
    total: parseNumber(row["Total"]) || 0,
    shipping_charge: parseNumber(row["Shipping Charge"]) || 0,
    adjustment: parseNumber(row["Adjustment"]) || 0,
    adjustment_description: row["Adjustment Description"] || null,
    payment_terms: row["Payment Terms"] || null,
    payment_terms_label: row["Payment Terms Label"] || null,
    source: row["Source"] || null,
    notes: row["Notes"] || null,
  };

  const { data, error } = await supabase
    .from('sales_orders')
    .insert(orderData)
    .select('id')
    .single();

  if (error) {
    errors.push(`Order ${row["SalesOrder Number"]}: ${error.message}`);
    return null;
  }

  return data.id;
};

const createSalesOrderItems = async (
  salesOrderId: string,
  rows: ParsedCSVRow[],
  errors: string[]
): Promise<void> => {
  const items = rows.map(row => ({
    sales_order_id: salesOrderId,
    item_name: row["Item Name"],
    product_id: row["Product ID"] || null,
    sku: row["SKU"] || null,
    account: row["Account"] || null,
    item_description: row["Item Description"] || null,
    quantity_ordered: parseNumber(row["QuantityOrdered"]) || 0,
    quantity_invoiced: parseNumber(row["QuantityInvoiced"]) || 0,
    quantity_packed: parseNumber(row["QuantityPacked"]) || 0,
    quantity_fulfilled: parseNumber(row["QuantityFulfilled"]) || 0,
    quantity_cancelled: parseNumber(row["QuantityCancelled"]) || 0,
    usage_unit: row["Usage unit"] || 'pairs',
    item_price: parseNumber(row["Item Price"]) || 0,
    discount: parseNumber(row["Discount"]) || 0,
    discount_amount: parseNumber(row["Discount Amount"]) || 0,
    item_total: parseNumber(row["Item Total"]) || 0,
  }));

  const { error } = await supabase
    .from('sales_order_items')
    .insert(items);

  if (error) {
    errors.push(`Order items for ${rows[0]["SalesOrder Number"]}: ${error.message}`);
  }
};

// Status mapping helpers
const mapStatus = (status: string): string => {
  const s = status?.toLowerCase() || '';
  if (s.includes('closed')) return 'closed';
  if (s.includes('cancel')) return 'cancelled';
  if (s.includes('draft')) return 'draft';
  return 'open';
};

const mapInvoiceStatus = (status: string): string => {
  const s = status?.toLowerCase() || '';
  if (s.includes('invoiced') && !s.includes('not')) return 'invoiced';
  if (s.includes('partial')) return 'partially_invoiced';
  return 'not_invoiced';
};

const mapPaymentStatus = (status: string): string => {
  const s = status?.toLowerCase() || '';
  if (s.includes('paid') && !s.includes('un')) return 'paid';
  if (s.includes('partial')) return 'partially_paid';
  return 'unpaid';
};

const mapShipmentStatus = (status: string): string => {
  const s = status?.toLowerCase() || '';
  if (s.includes('fulfilled') && !s.includes('un')) return 'fulfilled';
  if (s.includes('partial')) return 'partially_fulfilled';
  return 'unfulfilled';
};
