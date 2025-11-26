import { useState } from "react";
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
import { CustomerDialog } from "./CustomerDialog";

interface RecordIncomingDonationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface DonationItem {
  inventory_id: string;
  item_name: string;
  quantity: number;
}

export const RecordIncomingDonationDialog = ({
  open,
  onOpenChange,
  onSuccess,
}: RecordIncomingDonationDialogProps) => {
  const [companyId, setCompanyId] = useState("");
  const [donationDate, setDonationDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<DonationItem[]>([]);
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: companies } = useQuery({
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
    queryKey: ["inventory"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory")
        .select("*")
        .order("item_name");
      if (error) throw error;
      return data;
    },
  });

  const handleAddItem = () => {
    if (!selectedInventoryId) {
      toast.error("Please select an inventory item");
      return;
    }

    const inventoryItem = inventory?.find((i) => i.id === selectedInventoryId);
    if (!inventoryItem) return;

    const existingItem = items.find((i) => i.inventory_id === selectedInventoryId);
    if (existingItem) {
      toast.error("Item already added. Update quantity in the table.");
      return;
    }

    setItems([
      ...items,
      {
        inventory_id: inventoryItem.id,
        item_name: inventoryItem.item_name,
        quantity,
      },
    ]);

    setSelectedInventoryId("");
    setQuantity(1);
  };

  const handleRemoveItem = (inventoryId: string) => {
    setItems(items.filter((item) => item.inventory_id !== inventoryId));
  };

  const handleSave = async () => {
    if (!companyId) {
      toast.error("Please select a donating company");
      return;
    }

    if (items.length === 0) {
      toast.error("Please add at least one item");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create incoming donation record
      const { data: donation, error: donationError } = await supabase
        .from("incoming_donations")
        .insert({
          company_id: companyId,
          donation_date: donationDate,
          notes,
        })
        .select()
        .single();

      if (donationError) throw donationError;

      // Create donation items (trigger will auto-update inventory)
      const donationItems = items.map((item) => ({
        donation_id: donation.id,
        inventory_id: item.inventory_id,
        item_name: item.item_name,
        quantity: item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("incoming_donation_items")
        .insert(donationItems);

      if (itemsError) throw itemsError;

      toast.success("Incoming donation recorded successfully. Inventory has been updated.");
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error recording incoming donation:", error);
      toast.error("Failed to record incoming donation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCompanyId("");
    setDonationDate(new Date().toISOString().split("T")[0]);
    setNotes("");
    setItems([]);
    setSelectedInventoryId("");
    setQuantity(1);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Incoming Donation</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Donating Company *</Label>
                <div className="flex gap-2">
                  <Select value={companyId} onValueChange={setCompanyId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select company" />
                    </SelectTrigger>
                    <SelectContent>
                      {companies?.map((company) => (
                        <SelectItem key={company.id} value={company.id}>
                          {company.customer_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCustomerDialogOpen(true)}
                    title="Add new company"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Donation Date *</Label>
                <Input
                  type="date"
                  value={donationDate}
                  onChange={(e) => setDonationDate(e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes about this donation..."
                rows={3}
              />
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Items Received</h3>
              <div className="flex gap-2">
                <Select value={selectedInventoryId} onValueChange={setSelectedInventoryId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select inventory item" />
                  </SelectTrigger>
                  <SelectContent>
                    {inventory?.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.item_name} ({item.category})
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
                      <TableHead className="text-right">Quantity Donated</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.inventory_id}>
                        <TableCell>{item.item_name}</TableCell>
                        <TableCell className="text-right">{item.quantity}</TableCell>
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
                      <TableCell className="text-right font-semibold">
                        Total Items:
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {items.reduce((sum, item) => sum + item.quantity, 0)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <strong>Note:</strong> Recording this donation will automatically ADD the quantities to your inventory.
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSubmitting}>
                {isSubmitting ? "Recording..." : "Record Donation"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CustomerDialog
        open={customerDialogOpen}
        onOpenChange={setCustomerDialogOpen}
        onSuccess={() => {
          setCustomerDialogOpen(false);
        }}
      />
    </>
  );
};
