import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { ImportPartnersDialog } from "./ImportPartnersDialog";

export const ImportPartnersButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline" className="gap-2">
        <Upload className="h-4 w-4" />
        Import CSV
      </Button>
      <ImportPartnersDialog open={open} onOpenChange={setOpen} />
    </>
  );
};
