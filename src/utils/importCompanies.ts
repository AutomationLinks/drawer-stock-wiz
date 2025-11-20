import { supabase } from "@/integrations/supabase/client";
import { parseCSV, parseDate, validateRequiredColumns } from "./csvParser";

interface CompanyCSVRow {
  "Company Name": string;
  "Email "?: string;
  "Street Address"?: string;
  "City"?: string;
  "State"?: string;
  "Zip Code"?: string;
  "Notes"?: string;
  "Orders"?: string;
  "Invoices"?: string;
}

export interface ImportResult {
  success: boolean;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  errors: Array<{ row: number; message: string }>;
}


export const importCompanies = async (
  file: File,
  onProgress?: (current: number, total: number) => void,
  skipDuplicates: boolean = true
): Promise<ImportResult> => {
  const result: ImportResult = {
    success: false,
    successCount: 0,
    errorCount: 0,
    skippedCount: 0,
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
          const validationError = validateRequiredColumns(row, ["Company Name"]);
          if (validationError) {
            result.errors.push({ row: rowNumber, message: validationError });
            result.errorCount++;
            continue;
          }

          const csvRow = row as unknown as CompanyCSVRow;
          
          // Check if company exists by name
          const { data: existing } = await supabase
            .from("customers")
            .select("id, customer_id")
            .eq("customer_name", csvRow["Company Name"])
            .maybeSingle();

          if (existing) {
            // Company exists - update or skip
            if (skipDuplicates) {
              result.skippedCount++;
              continue;
            } else {
              // Update existing company with address data
              const { error } = await supabase
                .from("customers")
                .update({
                  email: csvRow["Email "] || null,
                  address_line_1: csvRow["Street Address"] || null,
                  city: csvRow["City"] || null,
                  state: csvRow["State"] || null,
                  postal_code: csvRow["Zip Code"] || null,
                  country: 'USA',
                  notes: csvRow["Notes"] === "None" ? null : (csvRow["Notes"] || null),
                  updated_at: new Date().toISOString(),
                })
                .eq("id", existing.id);
                
              if (error) {
                result.errors.push({ row: rowNumber, message: error.message });
                result.errorCount++;
              } else {
                result.successCount++;
              }
              continue;
            }
          } else {
            // Insert new company
            const companyData = {
              customer_id: `COMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              customer_name: csvRow["Company Name"],
              email: csvRow["Email "] || null,
              address_line_1: csvRow["Street Address"] || null,
              city: csvRow["City"] || null,
              state: csvRow["State"] || null,
              postal_code: csvRow["Zip Code"] || null,
              country: 'USA',
              notes: csvRow["Notes"] === "None" ? null : (csvRow["Notes"] || null),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            const { error } = await supabase
              .from("customers")
              .insert([companyData]);

            if (error) {
              result.errors.push({ row: rowNumber, message: error.message });
              result.errorCount++;
            } else {
              result.successCount++;
            }
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
