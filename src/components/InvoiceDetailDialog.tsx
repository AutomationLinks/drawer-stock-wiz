import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Mail, CheckCircle, Trash2, Pencil } from "lucide-react";
import { format } from "date-fns";
import { InvoiceTemplate } from "./InvoiceTemplate";
import { EditInvoiceDialog } from "./EditInvoiceDialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface InvoiceDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: any;
  onUpdate: () => void;
}

export const InvoiceDetailDialog = ({
  open,
  onOpenChange,
  invoice,
  onUpdate,
}: InvoiceDetailDialogProps) => {
  const [showPrintView, setShowPrintView] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handlePrint = () => {
    setShowPrintView(true);
  };

  const handleSendEmail = () => {
    toast.info("Email functionality will be available once Resend API key is configured");
  };

  const handleMarkFulfilled = async () => {
    const { error } = await supabase
      .from("invoices")
      .update({ status: "fulfilled" })
      .eq("id", invoice.id);

    if (error) {
      toast.error("Failed to mark invoice as fulfilled");
    } else {
      toast.success("Invoice marked as fulfilled and inventory updated");
      onUpdate();
      onOpenChange(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from("invoices")
        .delete()
        .eq("id", invoice.id);

      if (error) throw error;

      toast.success("Invoice deleted successfully");
      onUpdate();
      onOpenChange(false);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting invoice:", error);
      toast.error("Failed to delete invoice");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      draft: "outline",
      sent: "secondary",
      fulfilled: "default",
      cancelled: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status.toUpperCase()}</Badge>;
  };

  if (showPrintView) {
    return (
      <InvoiceTemplate
        order={{
          invoice_number: invoice.invoice_number,
          order_date: invoice.invoice_date,
          due_date: invoice.due_date,
          payment_terms: "Net 30",
          subtotal: invoice.subtotal,
          total: invoice.total,
          notes: invoice.notes,
          customers: invoice.customers,
          invoice_items: invoice.invoice_items,
        }}
        onClose={() => setShowPrintView(false)}
        isInvoice={true}
      />
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Invoice Details</DialogTitle>
            {getStatusBadge(invoice.status)}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Invoice Number</h3>
              <p className="font-mono">{invoice.invoice_number}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Customer</h3>
              <p>{invoice.customers?.customer_name}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Invoice Date</h3>
              <p>{format(new Date(invoice.invoice_date), "MMM dd, yyyy")}</p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Due Date</h3>
              <p>{invoice.due_date ? format(new Date(invoice.due_date), "MMM dd, yyyy") : "—"}</p>
            </div>
          </div>

          {invoice.notes && (
            <div>
              <h3 className="font-semibold text-sm text-muted-foreground mb-1">Notes</h3>
              <p className="text-sm">{invoice.notes}</p>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-3">Invoice Items</h3>
            <div className="border rounded-lg divide-y">
              {invoice.invoice_items?.map((item: any) => (
                <div key={item.id} className="p-3 flex justify-between items-center">
                  <div>
                    <p className="font-medium">{item.item_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Quantity: {item.quantity} | Stock Available: {item.inventory?.stock_on_hand || 0}
                    </p>
                  </div>
                  <p className="font-mono">$0.00</p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-semibold">
              <span>Total:</span>
              <span>$0.00</span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              As a nonprofit, all items are provided at no cost
            </p>
          </div>

          <div className="flex justify-between items-center pt-4 border-t">
            <div className="flex gap-2">
              {invoice.status === "draft" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowEditDialog(true)}
                    size="sm"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setShowDeleteDialog(true)}
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              {invoice.status !== "fulfilled" && (
                <>
                  <Button variant="outline" onClick={handleSendEmail}>
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                  <Button onClick={handleMarkFulfilled}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Fulfilled
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <EditInvoiceDialog
      open={showEditDialog}
      onOpenChange={setShowEditDialog}
      invoice={invoice}
      onSuccess={() => {
        setShowEditDialog(false);
        onUpdate();
      }}
    />

    <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete this invoice. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete Invoice
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
};
