import { useState } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { InvoicesTable } from "@/components/InvoicesTable";
import { CreateInvoiceDialog } from "@/components/CreateInvoiceDialog";

const Invoices = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Invoice Management</h1>
            <p className="text-muted-foreground mt-1">
              Create and manage invoices for inventory distribution
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Invoice
          </Button>
        </div>

        <InvoicesTable />

        <CreateInvoiceDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={() => {}}
        />
      </div>
    </div>
  );
};

export default Invoices;
