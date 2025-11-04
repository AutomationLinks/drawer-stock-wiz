import { supabase } from "@/integrations/supabase/client";

interface CSVRow {
  "Item Name": string;
  "Status": string;
  "Unit": string;
  "Opening Stock": string;
  "Stock On Hand": string;
  "Item Type": string;
}

const categorizeItem = (itemName: string): string => {
  const name = itemName.toLowerCase();
  
  if (name.includes("bombas socks") || (name.includes("bombas") && name.includes("socks"))) {
    return "Bombas Socks";
  }
  if (name.includes("bombas") && name.includes("uw")) {
    return "Bombas Underwear";
  }
  if (name.includes("sock")) {
    return "Socks";
  }
  if (name.includes("underwear") || name.includes("uw")) {
    return "Underwear";
  }
  if (name.includes("tee") || name.includes("tank")) {
    return "Tees and Tanks";
  }
  
  return "Other";
};

const determinePricing = (itemName: string, category: string): number => {
  const name = itemName.toLowerCase();
  const cat = category.toLowerCase();
  
  // Bombas items are $10
  if (cat.includes('bombas') || name.includes('bombas')) {
    return 10.00;
  }
  
  // Everything else is $2
  return 2.00;
};

export const importInventoryFromCSV = async () => {
  try {
    const response = await fetch('/data/inventory.csv');
    const csvText = await response.text();
    
    const lines = csvText.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',');
    
    const items = lines.slice(1).map(line => {
      const values = line.split(',');
      const item: any = {};
      
      headers.forEach((header, index) => {
        item[header.trim()] = values[index]?.trim() || '';
      });
      
      return item;
    });

    const inventoryItems = items.map((item: CSVRow) => {
      const category = categorizeItem(item["Item Name"]);
      return {
        item_name: item["Item Name"],
        category: category,
        status: item.Status,
        unit: item.Unit,
        opening_stock: parseFloat(item["Opening Stock"]) || 0,
        stock_on_hand: parseFloat(item["Stock On Hand"]) || 0,
        item_type: item["Item Type"],
        price_per_unit: determinePricing(item["Item Name"], category),
      };
    });

    const { error } = await supabase
      .from('inventory')
      .insert(inventoryItems);

    if (error) throw error;
    
    return { success: true, count: inventoryItems.length };
  } catch (error) {
    console.error('Error importing inventory:', error);
    return { success: false, error };
  }
};
