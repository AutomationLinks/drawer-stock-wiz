import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DuplicateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: any;
  onSuccess: () => void;
}

export const DuplicateInvoiceDialog = ({ open, onOpenChange, invoice, onSuccess }: DuplicateInvoiceDialogProps) => {
  const [customerId, setCustomerId] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  const { data: customers } = useQuery({
    queryKey: ["customers-for-duplicate"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("id, customer_name")
        .order("customer_name");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const handleDuplicate = async () => {
    if (!customerId) {
      toast.error("Please select a distribution partner");
      return;
    }
    setSubmitting(true);
    try {
      const { data: newInvoice, error: invErr } = await supabase
        .from("invoices")
        .insert({
          customer_id: customerId,
          invoice_date: new Date().toISOString().split("T")[0],
          due_date: dueDate || null,
          status: "draft",
          notes: invoice.notes,
          subtotal: 0,
          total: 0,
          invoice_number: "",
        })
        .select()
        .single();

      if (invErr) throw invErr;

      const items = (invoice.invoice_items || []).map((it: any) => ({
        invoice_id: newInvoice.id,
        inventory_id: it.inventory_id,
        item_name: it.item_name,
        quantity: it.quantity,
        price: 0,
        total: 0,
      }));

      if (items.length > 0) {
        const { error: itemsErr } = await supabase.from("invoice_items").insert(items);
        if (itemsErr) throw itemsErr;
      }

      toast.success(`Invoice duplicated as ${newInvoice.invoice_number}`);
      setCustomerId("");
      setDueDate("");
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to duplicate invoice");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Duplicate Invoice</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Create a copy of invoice <span className="font-mono font-medium">{invoice?.invoice_number}</span> assigned to a different distribution partner. All line items will be copied as a new draft.
          </p>
          <div className="space-y-2">
            <Label>Distribution Partner</Label>
            <Select value={customerId} onValueChange={setCustomerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a partner..." />
              </SelectTrigger>
              <SelectContent>
                {customers?.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.customer_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Due Date (optional)</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button onClick={handleDuplicate} disabled={submitting}>
            {submitting ? "Creating..." : "Create Duplicate"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};