import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { ImportInventoryDialog } from "./ImportInventoryDialog";

export const ImportInventoryButton = ({ onSuccess }: { onSuccess: () => void }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <>
      <Button 
        onClick={() => setIsDialogOpen(true)}
        variant="outline"
        className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
      >
        <Upload className="h-4 w-4 mr-2" />
        Import CSV
      </Button>
      
      <ImportInventoryDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSuccess={() => {
          setIsDialogOpen(false);
          onSuccess();
        }}
      />
    </>
  );
};
