import { parseCSV, validateRequiredColumns, parseDate, parseNumber, ParsedCSVRow } from './csvParser';
import { supabase } from '@/integrations/supabase/client';

interface DonorRow {
  // Basic Info
  name: string;
  email: string;
  phone: string;
  
  // Extended Name Fields
  first_name?: string;
  last_name?: string;
  formal_name?: string;
  preferred_name?: string;
  is_organization?: boolean;
  
  // Extended Contact
  mobile_phone?: string;
  alternate_phone?: string;
  work_phone?: string;
  alternate_email?: string;
  spouse_name?: string;
  
  // Address
  address?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  
  // Organization
  organization?: string;
  
  // Transaction Details
  amount: number;
  frequency: string;
  campaign: string;
  couponCode?: string;
  date?: Date;
  
  // Financial History
  lifetime_contribution_total?: number;
  lifetime_non_cash_gift_total?: number;
  lifetime_soft_credit_total?: number;
  ytd_gift_total?: number;
  fiscal_ytd_gift_total?: number;
  last_year_gift_total?: number;
  last_fiscal_year_gift_total?: number;
  first_transaction_date?: Date;
  last_gift_amount?: number;
  last_gift_date?: Date;
  largest_gift_amount?: number;
  largest_gift_date?: Date;
  number_of_gifts?: number;
  lifetime_gift_total?: number;
  total_pledge_balance?: number;
  join_date?: Date;
  
  // Notes
  comments?: string;
}

export const validateDonorRow = (row: ParsedCSVRow, rowIndex: number): { isValid: boolean; error?: string } => {
  // Helper to get column value with multiple possible names
  const getCol = (...names: string[]): string => {
    for (const name of names) {
      const value = row[name];
      if (value !== undefined && value !== null && value !== "") {
        return String(value).trim();
      }
    }
    return "";
  };

  // Check for required fields: email is mandatory
  const email = getCol("Email", "email", "EmailID", "Email Address");
  if (!email) {
    return { isValid: false, error: `Row ${rowIndex + 2}: Email is required` };
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: `Row ${rowIndex + 2}: Invalid email format` };
  }

  // Check for name
  const name = getCol("First Name/Org Name", "First Name", "first_name", "Name", "name");
  if (!name) {
    return { isValid: false, error: `Row ${rowIndex + 2}: Name is required` };
  }

  return { isValid: true };
};

export const normalizeDonorRow = (row: ParsedCSVRow): DonorRow => {
  // Helper to get column value with multiple possible names
  const getCol = (...names: string[]): string => {
    for (const name of names) {
      const value = row[name];
      if (value !== undefined && value !== null && value !== "") {
        return String(value).trim();
      }
    }
    return "";
  };

  // Name fields
  const firstNameOrg = getCol("First Name/Org Name", "First Name", "first_name", "FirstName", "Name", "name");
  const lastName = getCol("Last Name", "last_name", "LastName");
  const formalName = getCol("Formal Name", "formal_name", "FormalName");
  const preferredName = getCol("Preferred Name", "preferred_name", "PreferredName");
  const isOrganization = !lastName || getCol("Organization?", "Is Organization", "is_organization") === "Yes";
  
  // Determine display name
  const name = preferredName || formalName || (lastName ? `${firstNameOrg} ${lastName}`.trim() : firstNameOrg);

  // Contact fields - prioritize mobile, then phone, then work, then alternate
  const mobilePhone = getCol("Mobile Phone", "mobile_phone", "Mobile", "Cell Phone");
  const phone = getCol("Phone", "phone");
  const workPhone = getCol("Work Phone", "work_phone", "Business Phone");
  const alternatePhone = getCol("Alternate Phone", "alternate_phone", "Alt Phone");
  const primaryPhone = mobilePhone || phone || workPhone || alternatePhone;

  // Email fields
  const email = getCol("Email", "email", "EmailID", "Email Address").toLowerCase();
  const alternateEmail = getCol("Alternate Email", "alternate_email", "Alt Email", "Secondary Email").toLowerCase();

  // Address fields
  const addressLine1 = getCol("Address Line 1", "address_line_1", "Address1", "Street");
  const addressLine2 = getCol("Address Line 2", "address_line_2", "Address2");
  const city = getCol("City", "city");
  const state = getCol("State", "state", "Province");
  const postalCode = getCol("Postal Code", "postal_code", "Zip", "ZIP Code");
  const country = getCol("Country", "country");
  
  // Build full address string
  const addressParts = [addressLine1, addressLine2, city, state, postalCode, country].filter(Boolean);
  const address = addressParts.length > 0 ? addressParts.join(", ") : getCol("Address", "address");

  // Transaction details - use Last Gift Amount if available
  const lastGiftAmount = parseNumber(getCol("Last Gift Amount", "last_gift_amount"));
  const amount = lastGiftAmount || parseNumber(getCol("Amount", "amount")) || 0;

  // Date fields
  const lastGiftDateStr = getCol("Last Gift Date", "last_gift_date");
  const dateStr = getCol("Date", "date");
  const joinDateStr = getCol("Join Date", "join_date");
  const firstTransactionDateStr = getCol("First Transaction Date", "first_transaction_date");
  
  const lastGiftDate = lastGiftDateStr ? parseDate(lastGiftDateStr) : undefined;
  const date = lastGiftDate || (dateStr ? parseDate(dateStr) : undefined);
  const joinDate = joinDateStr ? parseDate(joinDateStr) : undefined;
  const firstTransactionDate = firstTransactionDateStr ? parseDate(firstTransactionDateStr) : undefined;

  // Financial history
  const numGifts = parseInt(getCol("Number of Gifts", "number_of_gifts")) || 0;
  
  // Smart frequency detection: if more than 6 gifts, likely monthly
  let frequency = getCol("Frequency", "frequency");
  if (!frequency) {
    frequency = numGifts > 6 ? "monthly" : "one-time";
  }
  frequency = frequency.toLowerCase();
  if (frequency === 'onetime' || frequency === 'one-time') {
    frequency = 'one-time';
  } else if (frequency === 'recurring') {
    frequency = 'monthly';
  }

  return {
    // Basic
    name,
    email,
    phone: primaryPhone,
    
    // Extended Name
    first_name: firstNameOrg,
    last_name: lastName,
    formal_name: formalName,
    preferred_name: preferredName,
    is_organization: isOrganization,
    
    // Extended Contact
    mobile_phone: mobilePhone,
    alternate_phone: alternatePhone,
    work_phone: workPhone,
    alternate_email: alternateEmail,
    spouse_name: getCol("Spouse Name", "spouse_name", "Spouse"),
    
    // Address
    address,
    address_line_1: addressLine1,
    address_line_2: addressLine2,
    city,
    state,
    postal_code: postalCode,
    country,
    
    // Organization
    organization: getCol("Organization", "organization", "Company"),
    
    // Transaction
    amount,
    frequency,
    campaign: getCol("Campaign", "campaign") || "Imported",
    couponCode: getCol("Coupon Code", "coupon_code", "Coupon"),
    date,
    
    // Financial History
    lifetime_contribution_total: parseNumber(getCol("Lifetime Contribution Total", "lifetime_contribution_total")),
    lifetime_non_cash_gift_total: parseNumber(getCol("Lifetime Non Cash Gift Total", "lifetime_non_cash_gift_total")),
    lifetime_soft_credit_total: parseNumber(getCol("Lifetime Soft Credit Total", "lifetime_soft_credit_total")),
    ytd_gift_total: parseNumber(getCol("YTD Gift Total", "ytd_gift_total")),
    fiscal_ytd_gift_total: parseNumber(getCol("Fiscal YTD Gift Total", "fiscal_ytd_gift_total")),
    last_year_gift_total: parseNumber(getCol("Last Year Gift Total", "last_year_gift_total")),
    last_fiscal_year_gift_total: parseNumber(getCol("Last Fiscal Year Gift Total", "last_fiscal_year_gift_total")),
    first_transaction_date: firstTransactionDate,
    last_gift_amount: lastGiftAmount,
    last_gift_date: lastGiftDate,
    largest_gift_amount: parseNumber(getCol("Largest Gift Amount", "largest_gift_amount")),
    largest_gift_date: getCol("Largest Gift Date", "largest_gift_date") ? parseDate(getCol("Largest Gift Date", "largest_gift_date")) : undefined,
    number_of_gifts: numGifts,
    lifetime_gift_total: parseNumber(getCol("Lifetime Gift Total", "lifetime_gift_total")),
    total_pledge_balance: parseNumber(getCol("Total Pledge Balance", "total_pledge_balance")),
    join_date: joinDate,
    
    // Notes
    comments: getCol("Comments", "comments", "Notes"),
  };
};

export const checkDuplicate = async (email: string, alternateEmail?: string): Promise<any | null> => {
  // Check by primary email or alternate email
  const { data, error } = await supabase
    .from("donations")
    .select("*")
    .or(`email.eq.${email.toLowerCase()},alternate_email.eq.${email.toLowerCase()}${alternateEmail ? `,email.eq.${alternateEmail.toLowerCase()},alternate_email.eq.${alternateEmail.toLowerCase()}` : ""}`)
    .limit(1);

  if (error) {
    console.error("Error checking duplicate:", error);
    return null;
  }

  return data && data.length > 0 ? data[0] : null;
};

export const importDonors = async (file: File): Promise<{ 
  success: number; 
  errors: string[]; 
  duplicates: number;
}> => {
  const result = {
    success: 0,
    errors: [] as string[],
    duplicates: 0,
  };

  try {
    const rows = await parseCSV(file);
    
    if (rows.length === 0) {
      result.errors.push("No data found in CSV file");
      return result;
    }

    const validDonors: any[] = [];

    // Validate and normalize rows
    for (let i = 0; i < rows.length; i++) {
      const validation = validateDonorRow(rows[i], i);
      if (!validation.isValid) {
        result.errors.push(validation.error!);
        continue;
      }

      const donor = normalizeDonorRow(rows[i]);

      // Check for duplicates and handle profile consolidation
      const existingDonor = await checkDuplicate(donor.email, donor.alternate_email);
      
      if (existingDonor) {
        // Update existing donor with new information
        const { error: updateError } = await supabase
          .from("donations")
          .update({
            name: donor.name,
            phone: donor.phone || existingDonor.phone,
            first_name: donor.first_name || existingDonor.first_name,
            last_name: donor.last_name || existingDonor.last_name,
            formal_name: donor.formal_name || existingDonor.formal_name,
            preferred_name: donor.preferred_name || existingDonor.preferred_name,
            is_organization: donor.is_organization ?? existingDonor.is_organization,
            mobile_phone: donor.mobile_phone || existingDonor.mobile_phone,
            alternate_phone: donor.alternate_phone || existingDonor.alternate_phone,
            work_phone: donor.work_phone || existingDonor.work_phone,
            alternate_email: donor.alternate_email || existingDonor.alternate_email,
            spouse_name: donor.spouse_name || existingDonor.spouse_name,
            address: donor.address || existingDonor.address,
            address_line_1: donor.address_line_1 || existingDonor.address_line_1,
            address_line_2: donor.address_line_2 || existingDonor.address_line_2,
            city: donor.city || existingDonor.city,
            state: donor.state || existingDonor.state,
            postal_code: donor.postal_code || existingDonor.postal_code,
            country: donor.country || existingDonor.country,
            organization: donor.organization || existingDonor.organization,
            lifetime_contribution_total: donor.lifetime_contribution_total ?? existingDonor.lifetime_contribution_total,
            lifetime_non_cash_gift_total: donor.lifetime_non_cash_gift_total ?? existingDonor.lifetime_non_cash_gift_total,
            lifetime_soft_credit_total: donor.lifetime_soft_credit_total ?? existingDonor.lifetime_soft_credit_total,
            ytd_gift_total: donor.ytd_gift_total ?? existingDonor.ytd_gift_total,
            fiscal_ytd_gift_total: donor.fiscal_ytd_gift_total ?? existingDonor.fiscal_ytd_gift_total,
            last_year_gift_total: donor.last_year_gift_total ?? existingDonor.last_year_gift_total,
            last_fiscal_year_gift_total: donor.last_fiscal_year_gift_total ?? existingDonor.last_fiscal_year_gift_total,
            first_transaction_date: donor.first_transaction_date?.toISOString().split("T")[0] || existingDonor.first_transaction_date,
            last_gift_amount: donor.last_gift_amount ?? existingDonor.last_gift_amount,
            last_gift_date: donor.last_gift_date?.toISOString().split("T")[0] || existingDonor.last_gift_date,
            largest_gift_amount: donor.largest_gift_amount ?? existingDonor.largest_gift_amount,
            largest_gift_date: donor.largest_gift_date?.toISOString().split("T")[0] || existingDonor.largest_gift_date,
            number_of_gifts: donor.number_of_gifts ?? existingDonor.number_of_gifts,
            lifetime_gift_total: donor.lifetime_gift_total ?? existingDonor.lifetime_gift_total,
            total_pledge_balance: donor.total_pledge_balance ?? existingDonor.total_pledge_balance,
            join_date: donor.join_date?.toISOString().split("T")[0] || existingDonor.join_date,
            comments: donor.comments || existingDonor.comments,
            amount: donor.amount || existingDonor.amount,
            frequency: donor.frequency || existingDonor.frequency,
            campaign: donor.campaign || existingDonor.campaign,
            coupon_code: donor.couponCode || existingDonor.coupon_code,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingDonor.id);

        if (updateError) {
          result.errors.push(`Row ${i + 2}: Failed to update - ${updateError.message}`);
        } else {
          result.duplicates++;
        }
        continue;
      }

      validDonors.push({
        name: donor.name,
        email: donor.email,
        phone: donor.phone,
        first_name: donor.first_name,
        last_name: donor.last_name,
        formal_name: donor.formal_name,
        preferred_name: donor.preferred_name,
        is_organization: donor.is_organization,
        mobile_phone: donor.mobile_phone,
        alternate_phone: donor.alternate_phone,
        work_phone: donor.work_phone,
        alternate_email: donor.alternate_email,
        spouse_name: donor.spouse_name,
        address: donor.address,
        address_line_1: donor.address_line_1,
        address_line_2: donor.address_line_2,
        city: donor.city,
        state: donor.state,
        postal_code: donor.postal_code,
        country: donor.country,
        organization: donor.organization,
        amount: donor.amount,
        total_amount: donor.amount,
        processing_fee: 0,
        frequency: donor.frequency,
        campaign: donor.campaign,
        coupon_code: donor.couponCode,
        status: "completed",
        lifetime_contribution_total: donor.lifetime_contribution_total,
        lifetime_non_cash_gift_total: donor.lifetime_non_cash_gift_total,
        lifetime_soft_credit_total: donor.lifetime_soft_credit_total,
        ytd_gift_total: donor.ytd_gift_total,
        fiscal_ytd_gift_total: donor.fiscal_ytd_gift_total,
        last_year_gift_total: donor.last_year_gift_total,
        last_fiscal_year_gift_total: donor.last_fiscal_year_gift_total,
        first_transaction_date: donor.first_transaction_date?.toISOString().split("T")[0],
        last_gift_amount: donor.last_gift_amount,
        last_gift_date: donor.last_gift_date?.toISOString().split("T")[0],
        largest_gift_amount: donor.largest_gift_amount,
        largest_gift_date: donor.largest_gift_date?.toISOString().split("T")[0],
        number_of_gifts: donor.number_of_gifts,
        lifetime_gift_total: donor.lifetime_gift_total,
        total_pledge_balance: donor.total_pledge_balance,
        join_date: donor.join_date?.toISOString().split("T")[0],
        comments: donor.comments,
        created_at: donor.date?.toISOString() || new Date().toISOString(),
      });
    }

    // Insert new donors in batches
    const batchSize = 50;
    for (let i = 0; i < validDonors.length; i += batchSize) {
      const batch = validDonors.slice(i, i + batchSize);
      
      const { error } = await supabase
        .from("donations")
        .insert(batch);

      if (error) {
        result.errors.push(`Batch ${Math.floor(i / batchSize) + 1} error: ${error.message}`);
      } else {
        result.success += batch.length;
      }
    }

    return result;
  } catch (error) {
    console.error("Import error:", error);
    result.errors.push(`Import failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    return result;
  }
};
