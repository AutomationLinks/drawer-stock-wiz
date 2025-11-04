import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { ImportDonorsDialog } from "./ImportDonorsDialog";

export const ImportDonorsButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)} variant="outline">
        <Upload className="h-4 w-4 mr-2" />
        Import CSV
      </Button>
      <ImportDonorsDialog open={open} onOpenChange={setOpen} />
    </>
  );
};
