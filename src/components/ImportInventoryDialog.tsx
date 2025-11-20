import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ImportInventoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface ParsedItem {
  item_name: string;
  category: string;
  stock_on_hand: number;
  opening_stock: number;
  status: string;
  unit: string;
  price_per_unit: number;
}

export const ImportInventoryDialog = ({ open, onOpenChange, onSuccess }: ImportInventoryDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [preview, setPreview] = useState<ParsedItem[]>([]);
  const [importMode, setImportMode] = useState<"replace" | "update">("replace");
  const { toast } = useToast();

  const categorizeItem = (itemName: string, categoryName: string): string => {
    const name = itemName.toLowerCase();
    
    // If category is provided and not "-1" or "Others", use it
    if (categoryName && !categoryName.includes("-1") && categoryName !== "Others") {
      return categoryName;
    }
    
    // Otherwise categorize by item name
    if (name.includes("bombas") && name.includes("sock")) {
      return "Bombas Socks";
    }
    if (name.includes("bombas") && (name.includes("uw") || name.includes("underwear"))) {
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

  const determinePricing = (itemName: string): number => {
    const name = itemName.toLowerCase();
    if (name.includes("bombas")) {
      return 10.00;
    }
    return 2.00;
  };

  const parseCSV = (text: string): ParsedItem[] => {
    const lines = text.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim());
    
    const items: ParsedItem[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      
      const itemName = row['item_name'] || '';
      const categoryName = row['category_name'] || '';
      const quantityAvailable = parseFloat(row['quantity_available']) || 0;
      const status = row['Status'] || 'active';
      const unit = row['unit'] || 'pairs';
      
      if (itemName) {
        items.push({
          item_name: itemName,
          category: categorizeItem(itemName, categoryName),
          stock_on_hand: quantityAvailable,
          opening_stock: quantityAvailable,
          status: status.toLowerCase(),
          unit: unit,
          price_per_unit: determinePricing(itemName),
        });
      }
    }
    
    return items;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const parsed = parseCSV(text);
        setPreview(parsed.slice(0, 5)); // Show first 5 items as preview
      };
      reader.readAsText(selectedFile);
    } else {
      toast({
        title: "Invalid file",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a CSV file to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        const items = parseCSV(text);
        
        if (importMode === "replace") {
          // Delete all existing inventory
          const { error: deleteError } = await supabase
            .from('inventory')
            .delete()
            .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
          
          if (deleteError) throw deleteError;
        }
        
        // Insert new items in batches
        const batchSize = 100;
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          const { error } = await supabase.from('inventory').upsert(batch, {
            onConflict: importMode === "update" ? 'item_name' : undefined
          });
          
          if (error) throw error;
        }
        
        toast({
          title: "Import successful",
          description: `Successfully imported ${items.length} items`,
        });
        
        setFile(null);
        setPreview([]);
        onSuccess();
        onOpenChange(false);
      };
      
      reader.readAsText(file);
    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Inventory from CSV</DialogTitle>
          <DialogDescription>
            Upload your inventory CSV file with columns: item_name, category_name, quantity_available, Status, unit
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="csv-file">CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-2"
            />
          </div>

          <div>
            <Label>Import Mode</Label>
            <RadioGroup value={importMode} onValueChange={(value: any) => setImportMode(value)} className="mt-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="replace" id="replace" />
                <Label htmlFor="replace" className="font-normal cursor-pointer">
                  Replace All - Delete existing inventory and import new data
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="update" id="update" />
                <Label htmlFor="update" className="font-normal cursor-pointer">
                  Update Existing - Keep existing items and update/add new ones
                </Label>
              </div>
            </RadioGroup>
          </div>

          {preview.length > 0 && (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                <p className="font-semibold mb-2">Preview (first 5 items):</p>
                <div className="space-y-1 text-sm">
                  {preview.map((item, index) => (
                    <div key={index} className="border-b pb-1">
                      <span className="font-medium">{item.item_name}</span>
                      <span className="text-muted-foreground ml-2">
                        ({item.category}, Stock: {item.stock_on_hand}, ${item.price_per_unit})
                      </span>
                    </div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {importMode === "replace" && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Warning: Replace mode will delete ALL existing inventory items before importing!
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isImporting}>
              Cancel
            </Button>
            <Button onClick={handleImport} disabled={!file || isImporting}>
              <Upload className="mr-2 h-4 w-4" />
              {isImporting ? "Importing..." : "Import"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

