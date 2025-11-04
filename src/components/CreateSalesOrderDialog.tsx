import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomerDialog } from "./CustomerDialog";

interface CreateSalesOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Customer {
  id: string;
  customer_id: string;
  customer_name: string;
}

interface OrderItem {
  item_name: string;
  quantity_ordered: number;
  item_price: number;
  inventory_id?: string;
}

export const CreateSalesOrderDialog = ({ open, onOpenChange, onSuccess }: CreateSalesOrderDialogProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentTerms, setPaymentTerms] = useState("Due on Receipt");
  const [items, setItems] = useState<OrderItem[]>([{ item_name: "", quantity_ordered: 0, item_price: 0 }]);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchCustomers();
    }
  }, [open]);

  const fetchCustomers = async () => {
    const { data } = await supabase.from("customers").select("*").order("customer_name");
    if (data) setCustomers(data);
  };

  const addItem = () => {
    setItems([...items, { item_name: "", quantity_ordered: 0, item_price: 0 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof OrderItem, value: string | number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity_ordered * item.item_price), 0);
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || items.length === 0) {
      toast({ title: "Error", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    // Generate order number
    const { data: lastOrder } = await supabase
      .from("sales_orders")
      .select("sales_order_number")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const lastNumber = lastOrder ? parseInt(lastOrder.sales_order_number.split("-")[1]) : 0;
    const newOrderNumber = `SO-${String(lastNumber + 1).padStart(5, "0")}`;

    const total = calculateTotal();

    const { data: order, error: orderError } = await supabase
      .from("sales_orders")
      .insert({
        sales_order_number: newOrderNumber,
        customer_id: selectedCustomer,
        order_date: orderDate,
        payment_terms: paymentTerms,
        subtotal: total,
        total: total,
        order_status: 'closed',
        payment_status: 'paid',
        shipment_status: 'fulfilled',
      })
      .select()
      .single();

    if (orderError) {
      toast({ title: "Error creating order", description: orderError.message, variant: "destructive" });
      return;
    }

    const orderItems = items.map(item => ({
      sales_order_id: order.id,
      item_name: item.item_name,
      quantity_ordered: item.quantity_ordered,
      item_price: item.item_price,
      item_total: item.quantity_ordered * item.item_price,
      inventory_id: item.inventory_id,
    }));

    const { error: itemsError } = await supabase.from("sales_order_items").insert(orderItems);

    if (itemsError) {
      toast({ title: "Error creating order items", description: itemsError.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: `Order ${newOrderNumber} created successfully` });
    onSuccess();
    onOpenChange(false);
    resetForm();
  };

  const resetForm = () => {
    setSelectedCustomer("");
    setOrderDate(new Date().toISOString().split("T")[0]);
    setPaymentTerms("Due on Receipt");
    setItems([{ item_name: "", quantity_ordered: 0, item_price: 0 }]);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Sales Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <div className="flex gap-2">
                  <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={customerSearchOpen}
                        className="flex-1 justify-between"
                      >
                        {selectedCustomer
                          ? customers.find((customer) => customer.id === selectedCustomer)?.customer_name
                          : "Select customer..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0">
                      <Command>
                        <CommandInput placeholder="Search customers..." />
                        <CommandList>
                          <CommandEmpty>No customer found.</CommandEmpty>
                          <CommandGroup>
                            {customers.map((customer) => (
                              <CommandItem
                                key={customer.id}
                                value={customer.customer_name}
                                onSelect={() => {
                                  setSelectedCustomer(customer.id);
                                  setCustomerSearchOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    selectedCustomer === customer.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {customer.customer_name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="outline"
                    onClick={() => setIsCustomerDialogOpen(true)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Order Date</Label>
                <Input type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Input value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label>Order Items</Label>
                <Button onClick={addItem} size="sm" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <Label>Item Name</Label>
                    <Input
                      value={item.item_name}
                      onChange={(e) => updateItem(index, "item_name", e.target.value)}
                      placeholder="Item name"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={item.quantity_ordered}
                      onChange={(e) => updateItem(index, "quantity_ordered", parseFloat(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-3">
                    <Label>Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={item.item_price}
                      onChange={(e) => updateItem(index, "item_price", parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-semibold">
                <span>Total:</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>Create Order</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CustomerDialog
        open={isCustomerDialogOpen}
        onOpenChange={setIsCustomerDialogOpen}
        onSuccess={fetchCustomers}
      />
    </>
  );
};
