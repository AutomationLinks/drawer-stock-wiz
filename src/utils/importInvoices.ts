import { supabase } from "@/integrations/supabase/client";
import { parseCSV, validateRequiredColumns, parseDate, ParsedCSVRow } from "./csvParser";

const BATCH_SIZE = 50;

const REQUIRED_COLUMNS = [
  "Invoice Number",
  "Invoice Date",
  "Customer Name",
  "Item Name",
  "Quantity",
];

interface CustomerMap {
  [key: string]: string; // customer_name -> uuid
}

interface InvoiceMap {
  [key: string]: string; // invoice_number -> uuid
}

type ProgressCallback = (current: number, total: number, successful: number, failed: number) => void;

export const importInvoicesFromCSV = async (
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

    // Step 2: Group rows by invoice number
    const invoiceGroups = groupRowsByInvoice(rows);
    const totalInvoices = Object.keys(invoiceGroups).length;

    // Step 3: Process invoices in batches
    const invoiceNumbers = Object.keys(invoiceGroups);
    const invoiceMap: InvoiceMap = {};
    
    for (let i = 0; i < invoiceNumbers.length; i += BATCH_SIZE) {
      const batch = invoiceNumbers.slice(i, i + BATCH_SIZE);
      
      for (const invoiceNumber of batch) {
        try {
          const invoiceRows = invoiceGroups[invoiceNumber];
          const invoiceId = await createInvoice(invoiceRows[0], customerMap, errors);
          
          if (invoiceId) {
            invoiceMap[invoiceNumber] = invoiceId;
            
            // Create invoice items
            await createInvoiceItems(invoiceId, invoiceRows, errors);
            successCount++;
          } else {
            failedCount++;
          }
        } catch (error) {
          failedCount++;
          errors.push(`Invoice ${invoiceNumber}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        if (onProgress) {
          onProgress(i + batch.indexOf(invoiceNumber) + 1, totalInvoices, successCount, failedCount);
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
        customer_id: `CUST-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        customer_name: customerName,
        email: row["Customer Email"] || null,
        phone: row["Customer Phone"] || null,
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

const groupRowsByInvoice = (rows: ParsedCSVRow[]): { [invoiceNumber: string]: ParsedCSVRow[] } => {
  const groups: { [invoiceNumber: string]: ParsedCSVRow[] } = {};
  
  rows.forEach(row => {
    const invoiceNumber = row["Invoice Number"];
    if (invoiceNumber) {
      if (!groups[invoiceNumber]) {
        groups[invoiceNumber] = [];
      }
      groups[invoiceNumber].push(row);
    }
  });
  
  return groups;
};

const createInvoice = async (
  row: ParsedCSVRow,
  customerMap: CustomerMap,
  errors: string[]
): Promise<string | null> => {
  const customerName = row["Customer Name"];
  const customerId = customerMap[customerName];

  if (!customerId) {
    errors.push(`Invoice ${row["Invoice Number"]}: Customer not found`);
    return null;
  }

  const invoiceDate = parseDate(row["Invoice Date"]);
  if (!invoiceDate) {
    errors.push(`Invoice ${row["Invoice Number"]}: Invalid invoice date`);
    return null;
  }

  const dueDate = parseDate(row["Due Date"]);

  const invoiceData = {
    invoice_number: row["Invoice Number"],
    customer_id: customerId,
    invoice_date: invoiceDate.toISOString().split('T')[0],
    due_date: dueDate?.toISOString().split('T')[0] || null,
    status: mapStatus(row["Status"]) || 'draft',
    notes: row["Notes"] || null,
    subtotal: 0,
    total: 0,
  };

  const { data, error } = await supabase
    .from('invoices')
    .insert(invoiceData)
    .select('id')
    .single();

  if (error) {
    errors.push(`Invoice ${row["Invoice Number"]}: ${error.message}`);
    return null;
  }

  return data.id;
};

const createInvoiceItems = async (
  invoiceId: string,
  rows: ParsedCSVRow[],
  errors: string[]
): Promise<void> => {
  // First, try to match items with inventory
  const itemNames = rows.map(row => row["Item Name"]);
  const { data: inventoryItems } = await supabase
    .from('inventory')
    .select('id, item_name')
    .in('item_name', itemNames);

  const inventoryMap: { [itemName: string]: string } = {};
  inventoryItems?.forEach(item => {
    inventoryMap[item.item_name] = item.id;
  });

  const items = rows.map(row => {
    const quantity = parseFloat(row["Quantity"]) || 0;
    return {
      invoice_id: invoiceId,
      inventory_id: inventoryMap[row["Item Name"]] || null,
      item_name: row["Item Name"],
      quantity: quantity,
      price: 0, // Nonprofit - always $0
      total: 0,
    };
  });

  const { error } = await supabase
    .from('invoice_items')
    .insert(items);

  if (error) {
    errors.push(`Invoice items for ${rows[0]["Invoice Number"]}: ${error.message}`);
  }
};

// Status mapping helper
const mapStatus = (status: string): string => {
  const s = status?.toLowerCase() || '';
  if (s.includes('fulfilled')) return 'fulfilled';
  if (s.includes('sent')) return 'sent';
  if (s.includes('cancel')) return 'cancelled';
  if (s.includes('draft')) return 'draft';
  return 'draft';
};
