import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { ImportSalesOrdersDialog } from "./ImportSalesOrdersDialog";

export const ImportSalesOrdersButton = ({ onSuccess }: { onSuccess: () => void }) => {
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
      
      <ImportSalesOrdersDialog
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
