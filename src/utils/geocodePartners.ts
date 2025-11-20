import { supabase } from "@/integrations/supabase/client";
import { MAPBOX_TOKEN } from "./mapboxConfig";

interface GeocodeResult {
  center: [number, number]; // [longitude, latitude]
  place_name: string;
}

interface Partner {
  id: string;
  name: string;
  address_line_1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string;
  latitude: number | null;
  longitude: number | null;
}

/**
 * Geocode a single address using Mapbox Geocoding API
 */
export async function geocodeAddress(
  addressLine1: string,
  city: string,
  state: string,
  postalCode: string
): Promise<{ latitude: number; longitude: number } | null> {
  try {
    // Build address query
    const addressParts = [addressLine1, city, state, postalCode].filter(Boolean);
    const query = encodeURIComponent(addressParts.join(", "));

    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${MAPBOX_TOKEN}&country=US&limit=1`
    );

    if (!response.ok) {
      console.error(`Geocoding failed for ${query}: ${response.statusText}`);
      return null;
    }

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const result: GeocodeResult = data.features[0];
      const [longitude, latitude] = result.center;
      return { latitude, longitude };
    }

    return null;
  } catch (error) {
    console.error("Geocoding error:", error);
    return null;
  }
}

/**
 * Geocode all partners that are missing coordinates
 */
export async function geocodeAllPartners(
  onProgress?: (current: number, total: number, partnerName: string) => void
): Promise<{ success: number; failed: number; skipped: number }> {
  try {
    // Fetch all active partners without coordinates
    const { data: partners, error } = await supabase
      .from("partners")
      .select("*")
      .eq("active", true)
      .or("latitude.is.null,longitude.is.null");

    if (error) throw error;

    if (!partners || partners.length === 0) {
      return { success: 0, failed: 0, skipped: 0 };
    }

    let successCount = 0;
    let failedCount = 0;
    let skippedCount = 0;

    // Process partners one at a time to avoid rate limiting
    for (let i = 0; i < partners.length; i++) {
      const partner = partners[i] as Partner;

      if (onProgress) {
        onProgress(i + 1, partners.length, partner.name);
      }

      // Skip if missing required address fields
      if (!partner.postal_code) {
        console.warn(`Skipping ${partner.name}: Missing postal code`);
        skippedCount++;
        continue;
      }

      const coords = await geocodeAddress(
        partner.address_line_1 || "",
        partner.city || "",
        partner.state || "",
        partner.postal_code
      );

      if (coords) {
        // Update partner with coordinates
        const { error: updateError } = await supabase
          .from("partners")
          .update({
            latitude: coords.latitude,
            longitude: coords.longitude,
          })
          .eq("id", partner.id);

        if (updateError) {
          console.error(`Failed to update ${partner.name}:`, updateError);
          failedCount++;
        } else {
          successCount++;
        }
      } else {
        console.warn(`Failed to geocode ${partner.name}`);
        failedCount++;
      }

      // Small delay to respect rate limits (600 requests/minute = ~100ms per request)
      await new Promise((resolve) => setTimeout(resolve, 120));
    }

    return { success: successCount, failed: failedCount, skipped: skippedCount };
  } catch (error) {
    console.error("Geocoding batch error:", error);
    throw error;
  }
}
