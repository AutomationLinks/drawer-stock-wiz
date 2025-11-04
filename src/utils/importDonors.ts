import { parseCSV, validateRequiredColumns, parseDate, parseNumber } from './csvParser';
import { supabase } from '@/integrations/supabase/client';

export interface DonorRow {
  name: string;
  email: string;
  phone: string;
  address?: string;
  organization?: string;
  amount: number;
  frequency: string;
  campaign: string;
  coupon_code?: string;
  date?: string;
}

export const validateDonorRow = (row: any, rowIndex: number): { isValid: boolean; error?: string } => {
  const requiredColumns = ['Name', 'Email', 'Phone', 'Amount', 'Frequency', 'Campaign'];
  const validationError = validateRequiredColumns(row, requiredColumns);
  
  if (validationError) {
    return { isValid: false, error: `Row ${rowIndex + 1}: ${validationError}` };
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(row.Email)) {
    return { isValid: false, error: `Row ${rowIndex + 1}: Invalid email format` };
  }

  // Amount validation
  const amount = parseNumber(row.Amount);
  if (amount <= 0) {
    return { isValid: false, error: `Row ${rowIndex + 1}: Amount must be positive` };
  }

  // Frequency validation
  const frequency = row.Frequency.toLowerCase().trim();
  if (!['one-time', 'monthly', 'onetime', 'recurring'].includes(frequency)) {
    return { isValid: false, error: `Row ${rowIndex + 1}: Invalid frequency (must be 'one-time' or 'monthly')` };
  }

  return { isValid: true };
};

export const normalizeDonorRow = (row: any): DonorRow => {
  let frequency = row.Frequency.toLowerCase().trim();
  if (frequency === 'onetime' || frequency === 'one-time') {
    frequency = 'one-time';
  } else if (frequency === 'recurring') {
    frequency = 'monthly';
  }

  return {
    name: row.Name.trim(),
    email: row.Email.trim().toLowerCase(),
    phone: row.Phone.trim(),
    address: row.Address?.trim() || undefined,
    organization: row.Organization?.trim() || undefined,
    amount: parseNumber(row.Amount),
    frequency,
    campaign: row.Campaign.trim(),
    coupon_code: row['Coupon Code']?.trim() || undefined,
    date: row.Date?.trim() || undefined,
  };
};

export const checkDuplicate = async (email: string, date: string): Promise<boolean> => {
  const { data, error } = await supabase
    .from('donations')
    .select('id')
    .eq('email', email)
    .gte('created_at', new Date(date).toISOString())
    .lte('created_at', new Date(new Date(date).getTime() + 86400000).toISOString())
    .limit(1);

  if (error) {
    console.error('Error checking duplicate:', error);
    return false;
  }

  return data && data.length > 0;
};

export const importDonors = async (file: File): Promise<{ 
  success: number; 
  errors: string[]; 
  duplicates: number;
}> => {
  try {
    const rows = await parseCSV(file);
    const errors: string[] = [];
    let success = 0;
    let duplicates = 0;

    // Validate all rows first
    const validRows: DonorRow[] = [];
    for (let i = 0; i < rows.length; i++) {
      const validation = validateDonorRow(rows[i], i);
      if (!validation.isValid) {
        errors.push(validation.error!);
        continue;
      }
      validRows.push(normalizeDonorRow(rows[i]));
    }

    // Process in batches of 50
    const batchSize = 50;
    for (let i = 0; i < validRows.length; i += batchSize) {
      const batch = validRows.slice(i, i + batchSize);
      const insertData = [];

      for (const row of batch) {
        const date = row.date ? parseDate(row.date) : new Date();
        if (!date) {
          errors.push(`Invalid date format for ${row.name}`);
          continue;
        }

        // Check for duplicates
        const isDuplicate = await checkDuplicate(row.email, date.toISOString());
        if (isDuplicate) {
          duplicates++;
          continue;
        }

        insertData.push({
          name: row.name,
          email: row.email,
          phone: row.phone,
          address: row.address,
          organization: row.organization,
          amount: row.amount,
          processing_fee: 0,
          total_amount: row.amount,
          frequency: row.frequency,
          campaign: row.campaign,
          coupon_code: row.coupon_code,
          status: 'completed',
          is_test_mode: false,
          created_at: date.toISOString(),
        });
      }

      if (insertData.length > 0) {
        const { error } = await supabase.from('donations').insert(insertData);
        if (error) {
          errors.push(`Batch insert error: ${error.message}`);
        } else {
          success += insertData.length;
        }
      }
    }

    return { success, errors, duplicates };
  } catch (error) {
    console.error('Import error:', error);
    return { 
      success: 0, 
      errors: [`Failed to parse CSV: ${error instanceof Error ? error.message : 'Unknown error'}`], 
      duplicates: 0 
    };
  }
};
