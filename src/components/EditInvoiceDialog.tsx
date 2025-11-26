import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface EditInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: any;
  onSuccess: () => void;
}

interface InvoiceItem {
  inventory_id: string;
  item_name: string;
  quantity: number;
  stock_on_hand: number;
  price: number;
  total: number;
}

export const EditInvoiceDialog = ({ open, onOpenChange, invoice, onSuccess }: EditInvoiceDialogProps) => {
  const [customerId, setCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: customers } = useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("customers")
        .select("*")
        .order("customer_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: inventory } = useQuery({
    queryKey: ["inventory-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .eq("status", "Active")
        .gt("stock_on_hand", 0)
        .order("item_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: existingItems } = useQuery({
    queryKey: ["invoice-items", invoice?.id],
    queryFn: async () => {
      if (!invoice?.id) return [];
      const { data, error } = await supabase
        .from("invoice_items")
        .select("*, inventory(stock_on_hand)")
        .eq("invoice_id", invoice.id);
      if (error) throw error;
      return data;
    },
    enabled: !!invoice?.id && open,
  });

  useEffect(() => {
    if (invoice && open) {
      setCustomerId(invoice.customer_id);
      setInvoiceDate(invoice.invoice_date);
      setDueDate(invoice.due_date || "");
      setNotes(invoice.notes || "");
    }
  }, [invoice, open]);

  useEffect(() => {
    if (existingItems && open) {
      const mappedItems = existingItems.map((item: any) => ({
        inventory_id: item.inventory_id,
        item_name: item.item_name,
        quantity: item.quantity,
        stock_on_hand: item.inventory?.stock_on_hand || 0,
        price: item.price,
        total: item.total,
      }));
      setItems(mappedItems);
    }
  }, [existingItems, open]);

  const handleAddItem = () => {
    if (!selectedInventoryId) {
      toast.error("Please select an inventory item");
      return;
    }

    const inventoryItem = inventory?.find((i) => i.id === selectedInventoryId);
    if (!inventoryItem) return;

    if (quantity > inventoryItem.stock_on_hand) {
      toast.error(`Only ${inventoryItem.stock_on_hand} available in stock`);
      return;
    }

    const existingItem = items.find((i) => i.inventory_id === selectedInventoryId);
    if (existingItem) {
      toast.error("Item already added. Update quantity in the table.");
      return;
    }

    const price = inventoryItem.price_per_unit || 2.00;
    const total = quantity * price;

    setItems([
      ...items,
      {
        inventory_id: inventoryItem.id,
        item_name: inventoryItem.item_name,
        quantity,
        stock_on_hand: inventoryItem.stock_on_hand,
        price: price,
        total: total,
      },
    ]);

    setSelectedInventoryId("");
    setQuantity(1);
  };

  const handleRemoveItem = (inventoryId: string) => {
    setItems(items.filter((item) => item.inventory_id !== inventoryId));
  };

  const handleSave = async () => {
    if (!customerId) {
      toast.error("Please select a customer");
      return;
    }

    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    setIsSubmitting(true);

    try {
      // Update invoice
      const { error: invoiceError } = await supabase
        .from("invoices")
        .update({
          customer_id: customerId,
          invoice_date: invoiceDate,
          due_date: dueDate || null,
          notes,
        })
        .eq("id", invoice.id);

      if (invoiceError) throw invoiceError;

      // Delete existing items
      const { error: deleteError } = await supabase
        .from("invoice_items")
        .delete()
        .eq("invoice_id", invoice.id);

      if (deleteError) throw deleteError;

      // Create new invoice items
      const invoiceItems = items.map((item) => ({
        invoice_id: invoice.id,
        inventory_id: item.inventory_id,
        item_name: item.item_name,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(invoiceItems);

      if (itemsError) throw itemsError;

      toast.success("Invoice updated successfully");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating invoice:", error);
      toast.error("Failed to update invoice");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Invoice</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Customer *</Label>
              <Select value={customerId} onValueChange={setCustomerId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.customer_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Invoice Date *</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>

            <div>
              <Label>Due Date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>

          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Edit Items</h3>
            <div className="flex gap-2">
              <Select value={selectedInventoryId} onValueChange={setSelectedInventoryId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select inventory item" />
                </SelectTrigger>
                <SelectContent>
                  {inventory?.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.item_name} (Stock: {item.stock_on_hand})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min={1}
                className="w-24"
                placeholder="Qty"
              />
              <Button onClick={handleAddItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </div>

          {items.length > 0 && (
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Stock Available</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.inventory_id}>
                      <TableCell>{item.item_name}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{item.stock_on_hand}</TableCell>
                      <TableCell className="text-right">${item.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">${item.total.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item.inventory_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow>
                    <TableCell colSpan={4} className="text-right font-semibold">
                      Total:
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${items.reduce((sum, item) => sum + item.total, 0).toFixed(2)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
