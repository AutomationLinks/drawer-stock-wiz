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
  status?: string;
  is_out_of_state?: boolean;
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
    const validationError = validateRequiredColumns(row, ["partner_name", "zip"]);
    if (validationError) {
      results.errors.push(`Row ${i + 1}: ${validationError}`);
      continue;
    }

    const name = row["partner_name"]?.trim();
    const postalCode = row["zip"]?.trim();

    // Check for duplicates
    const duplicateKey = `${name.toLowerCase()}-${postalCode}`;
    if (existingSet.has(duplicateKey)) {
      results.duplicates++;
      continue;
    }

    const partnerData: PartnerRow = {
      name,
      postal_code: postalCode,
      contact_name: row["contact_name"]?.trim() || null,
      email: row["email"]?.trim() || null,
      phone: row["phone"]?.trim() || null,
      address_line_1: row["street"]?.trim() || null,
      address_line_2: row["address_line_2"]?.trim() || null,
      city: row["city"]?.trim() || null,
      state: row["state"]?.trim() || null,
      country: row["country"]?.trim() || "USA",
      status: row["status"]?.trim() || "Active",
      is_out_of_state: row["is_out_of_state"]?.toLowerCase() === "yes" || row["is_out_of_state"]?.toLowerCase() === "true" || row["is_out_of_state"] === "1",
      notes: row["notes"]?.trim() || null,
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
  const template = `partner_name,street,city,state,zip,country,status,is_out_of_state
Downtown Community Center,123 Main Street,Springfield,IL,62701,USA,Active,false
Westside Food Bank,456 West Ave,Chicago,IL,60601,USA,Active,false
Out of State Partner,789 Oak Drive,Los Angeles,CA,90001,USA,Active,true`;

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
