import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { ImportInvoicesDialog } from "./ImportInvoicesDialog";

export const ImportInvoicesButton = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setDialogOpen(true)} variant="outline">
        <Upload className="mr-2 h-4 w-4" />
        Import Invoices
      </Button>
      <ImportInvoicesDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
};
