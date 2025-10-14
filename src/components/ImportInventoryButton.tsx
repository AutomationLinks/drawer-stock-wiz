import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { importInventoryFromCSV } from "@/utils/importInventory";
import { useToast } from "@/hooks/use-toast";

export const ImportInventoryButton = ({ onSuccess }: { onSuccess: () => void }) => {
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleImport = async () => {
    setIsImporting(true);
    const result = await importInventoryFromCSV();
    setIsImporting(false);

    if (result.success) {
      toast({
        title: "Import successful",
        description: `Successfully imported ${result.count} items`,
      });
      onSuccess();
    } else {
      toast({
        title: "Import failed",
        description: "There was an error importing the inventory data",
        variant: "destructive",
      });
    }
  };

  return (
    <Button 
      onClick={handleImport} 
      disabled={isImporting}
      variant="outline"
      className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
    >
      <Upload className="h-4 w-4 mr-2" />
      {isImporting ? "Importing..." : "Import Initial Data"}
    </Button>
  );
};
