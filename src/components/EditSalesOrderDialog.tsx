import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditSalesOrderDialogProps {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface Customer {
  id: string;
  customer_id: string;
  customer_name: string;
}

interface InventoryItem {
  id: string;
  item_name: string;
  category: string;
  stock_on_hand: number;
  price_per_unit: number;
  unit: string;
  status: string;
}

interface OrderItem {
  id?: string;
  item_name: string;
  quantity_ordered: number;
  item_price: number;
  usage_unit: string;
  inventory_id: string | null;
  category?: string;
  stock_on_hand?: number;
}

export const EditSalesOrderDialog = ({ orderId, open, onOpenChange, onSuccess }: EditSalesOrderDialogProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [orderDate, setOrderDate] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchCustomers();
      fetchInventory();
      fetchOrderDetails();
    }
  }, [open, orderId]);

  const fetchOrderDetails = async () => {
    const { data, error } = await supabase
      .from("sales_orders")
      .select(`
        *,
        sales_order_items (*)
      `)
      .eq("id", orderId)
      .single();

    if (error) {
      toast({ title: "Error loading order", description: error.message, variant: "destructive" });
      return;
    }

    setSelectedCustomer(data.customer_id);
    setOrderDate(data.order_date);
    setPaymentTerms(data.payment_terms || "");
    setNotes(data.notes || "");
    
    const loadedItems: OrderItem[] = data.sales_order_items.map((item: any) => ({
      id: item.id,
      item_name: item.item_name,
      quantity_ordered: item.quantity_ordered,
      item_price: item.item_price,
      usage_unit: item.usage_unit,
      inventory_id: item.inventory_id,
    }));
    setItems(loadedItems);
  };

  const fetchCustomers = async () => {
    const { data, error } = await supabase
      .from("customers")
      .select("id, customer_id, customer_name")
      .order("customer_name");

    if (!error && data) setCustomers(data);
  };

  const fetchInventory = async () => {
    const { data, error } = await supabase
      .from("inventory")
      .select("*")
      .eq("status", "Active")
      .order("category")
      .order("item_name");

    if (!error && data) setInventory(data);
  };

  const addItem = () => {
    setItems([...items, { 
      item_name: "", 
      quantity_ordered: 0, 
      item_price: 0, 
      usage_unit: "pairs",
      inventory_id: null 
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const selectInventoryItem = (index: number, inventoryItem: InventoryItem) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      item_name: inventoryItem.item_name,
      item_price: inventoryItem.price_per_unit || 0,
      usage_unit: inventoryItem.unit || "pairs",
      inventory_id: inventoryItem.id,
      category: inventoryItem.category,
      stock_on_hand: inventoryItem.stock_on_hand,
    };
    setItems(newItems);
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index].quantity_ordered = quantity;
    setItems(newItems);
  };

  const updateItemPrice = (index: number, price: number) => {
    const newItems = [...items];
    newItems[index].item_price = price;
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity_ordered * item.item_price), 0);
  };

  const getStockStatus = (item: OrderItem) => {
    if (!item.stock_on_hand) return { text: "", color: "" };
    const available = item.stock_on_hand;
    const ordered = item.quantity_ordered;
    
    if (ordered > available) {
      return { text: `⚠️ Only ${available} available`, color: "text-destructive" };
    }
    return { text: `${available} available`, color: "text-muted-foreground" };
  };

  const groupedInventory = inventory.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  const handleSubmit = async () => {
    if (!selectedCustomer || items.length === 0) {
      toast({ title: "Error", description: "Please select a customer and add at least one item", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    const subtotal = calculateTotal();

    // Update the sales order
    const { error: orderError } = await supabase
      .from("sales_orders")
      .update({
        customer_id: selectedCustomer,
        order_date: orderDate,
        payment_terms: paymentTerms,
        notes: notes,
        subtotal: subtotal,
        total: subtotal,
      })
      .eq("id", orderId);

    if (orderError) {
      toast({ title: "Error updating order", description: orderError.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    // Delete existing order items
    const { error: deleteError } = await supabase
      .from("sales_order_items")
      .delete()
      .eq("sales_order_id", orderId);

    if (deleteError) {
      toast({ title: "Error updating items", description: deleteError.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    // Insert updated order items
    const orderItems = items.map((item) => ({
      sales_order_id: orderId,
      inventory_id: item.inventory_id,
      item_name: item.item_name,
      quantity_ordered: item.quantity_ordered,
      item_price: item.item_price,
      usage_unit: item.usage_unit,
      item_total: item.quantity_ordered * item.item_price,
    }));

    const { error: itemsError } = await supabase
      .from("sales_order_items")
      .insert(orderItems);

    if (itemsError) {
      toast({ title: "Error updating items", description: itemsError.message, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    toast({ title: "Success", description: "Sales order updated successfully" });
    setIsLoading(false);
    onSuccess();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Sales Order</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Customer *</Label>
              <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between">
                    {selectedCustomer
                      ? customers.find((c) => c.id === selectedCustomer)?.customer_name
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
            </div>

            <div>
              <Label>Order Date *</Label>
              <Input
                type="date"
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label>Payment Terms</Label>
            <Input
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="e.g., Net 30, Due on Receipt"
            />
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Order notes..."
              rows={3}
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <Label>Order Items *</Label>
              <Button onClick={addItem} size="sm" variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Item
              </Button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Product</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-between text-left font-normal">
                              {item.item_name || "Select product..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[400px] p-0">
                            <Command>
                              <CommandInput placeholder="Search inventory..." />
                              <CommandList>
                                <CommandEmpty>No inventory found.</CommandEmpty>
                                {Object.entries(groupedInventory).map(([category, categoryItems]) => (
                                  <CommandGroup key={category} heading={category}>
                                    {categoryItems.map((invItem) => (
                                      <CommandItem
                                        key={invItem.id}
                                        value={invItem.item_name}
                                        onSelect={() => selectInventoryItem(index, invItem)}
                                      >
                                        <div className="flex justify-between w-full">
                                          <span>{invItem.item_name}</span>
                                          <span className="text-muted-foreground text-sm">
                                            {invItem.stock_on_hand} in stock
                                          </span>
                                        </div>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                ))}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                        {item.item_name && (
                          <p className={cn("text-xs mt-1", getStockStatus(item).color)}>
                            {getStockStatus(item).text}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label className="text-xs">Quantity</Label>
                        <Input
                          type="number"
                          value={item.quantity_ordered}
                          onChange={(e) => updateItemQuantity(index, Number(e.target.value))}
                          min="0"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Price</Label>
                        <Input
                          type="number"
                          value={item.item_price}
                          onChange={(e) => updateItemPrice(index, Number(e.target.value))}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      className="ml-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {item.item_name && (
                    <div className="text-sm text-muted-foreground">
                      ${item.item_price.toFixed(2)} × {item.quantity_ordered} = ${(item.item_price * item.quantity_ordered).toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading ? "Saving..." : "Update Order"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
