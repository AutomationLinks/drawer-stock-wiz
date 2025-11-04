import { supabase } from "@/integrations/supabase/client";
import { parseCSV, parseDate, validateRequiredColumns } from "./csvParser";

interface CompanyCSVRow {
  "Created Time"?: string;
  "Last Modified Time"?: string;
  "Contact ID": string;
  "Customer Sub Type"?: string;
  "Companies": string;
  "First Name"?: string;
  "Last Name"?: string;
  "EmailID"?: string;
}

export interface ImportResult {
  success: boolean;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; message: string }>;
}

const cleanPhoneNumber = (phone: string): string => {
  return phone.replace(/[^\d+]/g, "");
};

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const importCompanies = async (
  file: File,
  onProgress?: (current: number, total: number) => void,
  skipDuplicates: boolean = true
): Promise<ImportResult> => {
  const result: ImportResult = {
    success: false,
    successCount: 0,
    errorCount: 0,
    errors: [],
  };

  try {
    const rows = await parseCSV(file);
    
    if (rows.length === 0) {
      throw new Error("CSV file is empty");
    }

    const batchSize = 50;
    let processed = 0;

    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      
      for (const [index, row] of batch.entries()) {
        const rowNumber = i + index + 2; // +2 for header and 1-based index
        
        try {
          // Validate required columns
          const validationError = validateRequiredColumns(row, ["Companies", "Contact ID"]);
          if (validationError) {
            result.errors.push({ row: rowNumber, message: validationError });
            result.errorCount++;
            continue;
          }

          const csvRow = row as unknown as CompanyCSVRow;
          
          // Validate email if provided
          if (csvRow.EmailID && !validateEmail(csvRow.EmailID)) {
            result.errors.push({ row: rowNumber, message: "Invalid email format" });
            result.errorCount++;
            continue;
          }

          // Check for duplicates if skipDuplicates is true
          if (skipDuplicates) {
            const { data: existing } = await supabase
              .from("customers")
              .select("id")
              .eq("customer_id", csvRow["Contact ID"])
              .single();

            if (existing) {
              result.errors.push({ row: rowNumber, message: "Duplicate Contact ID - skipped" });
              result.errorCount++;
              continue;
            }
          }

          // Prepare data for insertion
          const companyData = {
            customer_id: csvRow["Contact ID"],
            customer_name: csvRow.Companies,
            first_name: csvRow["First Name"] || null,
            last_name: csvRow["Last Name"] || null,
            email: csvRow.EmailID || null,
            customer_sub_type: csvRow["Customer Sub Type"] || null,
            created_at: csvRow["Created Time"] ? parseDate(csvRow["Created Time"])?.toISOString() : new Date().toISOString(),
            updated_at: csvRow["Last Modified Time"] ? parseDate(csvRow["Last Modified Time"])?.toISOString() : new Date().toISOString(),
          };

          // Insert into database
          const { error } = await supabase
            .from("customers")
            .insert([companyData]);

          if (error) {
            result.errors.push({ row: rowNumber, message: error.message });
            result.errorCount++;
          } else {
            result.successCount++;
          }
        } catch (error) {
          result.errors.push({
            row: rowNumber,
            message: error instanceof Error ? error.message : "Unknown error",
          });
          result.errorCount++;
        }

        processed++;
        if (onProgress) {
          onProgress(processed, rows.length);
        }
      }
    }

    result.success = result.successCount > 0;
    return result;
  } catch (error) {
    throw new Error(
      `Failed to import companies: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
};
