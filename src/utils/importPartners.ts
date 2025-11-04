import { supabase } from "@/integrations/supabase/client";
import { parseCSV, validateRequiredColumns, parseNumber } from "./csvParser";

interface PartnerRow {
  name: string;
  contact_name?: string;
  email?: string;
  phone?: string;
  address_line_1?: string;
  address_line_2?: string;
  city?: string;
  state?: string;
  postal_code: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export const importPartners = async (
  file: File,
  onProgress?: (current: number, total: number) => void
) => {
  const rows = await parseCSV(file);
  const results = {
    success: 0,
    errors: [] as string[],
    duplicates: 0,
  };

  // Check for existing partners to avoid duplicates
  const { data: existingPartners } = await supabase
    .from("partners")
    .select("name, postal_code");

  const existingSet = new Set(
    existingPartners?.map((p) => `${p.name.toLowerCase()}-${p.postal_code}`) || []
  );

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    onProgress?.(i + 1, rows.length);

    // Validate required columns
    const validationError = validateRequiredColumns(row, ["Name", "Postal Code"]);
    if (validationError) {
      results.errors.push(`Row ${i + 1}: ${validationError}`);
      continue;
    }

    const name = row["Name"]?.trim();
    const postalCode = row["Postal Code"]?.trim();

    // Check for duplicates
    const duplicateKey = `${name.toLowerCase()}-${postalCode}`;
    if (existingSet.has(duplicateKey)) {
      results.duplicates++;
      continue;
    }

    const partnerData: PartnerRow = {
      name,
      postal_code: postalCode,
      contact_name: row["Contact Name"]?.trim() || null,
      email: row["Email"]?.trim() || null,
      phone: row["Phone"]?.trim() || null,
      address_line_1: row["Address Line 1"]?.trim() || null,
      address_line_2: row["Address Line 2"]?.trim() || null,
      city: row["City"]?.trim() || null,
      state: row["State"]?.trim() || null,
      country: row["Country"]?.trim() || "USA",
      notes: row["Notes"]?.trim() || null,
    };

    // Parse latitude/longitude if provided
    if (row["Latitude"]) {
      partnerData.latitude = parseNumber(row["Latitude"]);
    }
    if (row["Longitude"]) {
      partnerData.longitude = parseNumber(row["Longitude"]);
    }

    const { error } = await supabase.from("partners").insert(partnerData);

    if (error) {
      results.errors.push(`Row ${i + 1} (${name}): ${error.message}`);
    } else {
      results.success++;
      existingSet.add(duplicateKey);
    }
  }

  return results;
};

export const downloadPartnerTemplate = () => {
  const template = `Name,Contact Name,Email,Phone,Address Line 1,Address Line 2,City,State,Postal Code,Country,Latitude,Longitude,Notes
Downtown Community Center,Jane Smith,jane@downtown.org,555-0100,123 Main Street,Suite 200,Springfield,IL,62701,USA,39.7817,-89.6501,Primary distribution site
Westside Food Bank,John Doe,john@westside.org,555-0200,456 West Ave,,Chicago,IL,60601,USA,41.8781,-87.6298,Monthly pickups`;

  const blob = new Blob([template], { type: "text/csv" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "partner_template.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
};
