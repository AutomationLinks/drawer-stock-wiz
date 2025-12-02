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
import { Plus, Trash2, Check, ChevronsUpDown, AlertTriangle, PackageSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import { CustomerDialog } from "./CustomerDialog";
import { Badge } from "@/components/ui/badge";

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

interface InventoryItem {
  id: string;
  item_name: string;
  category: string;
  stock_on_hand: number;
  price_per_unit: number;
  unit: string;
}

interface OrderItem {
  item_name: string;
  quantity_ordered: number;
  item_price: number;
  inventory_id: string;
  stock_available: number;
  category: string;
  usage_unit: string;
}

export const CreateSalesOrderDialog = ({ open, onOpenChange, onSuccess }: CreateSalesOrderDialogProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentTerms, setPaymentTerms] = useState("Due on Receipt");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [itemSearchOpen, setItemSearchOpen] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchCustomers();
      fetchInventory();
    }
  }, [open]);

  const fetchCustomers = async () => {
    const { data } = await supabase.from("customers").select("*").order("customer_name");
    if (data) setCustomers(data);
  };

  const fetchInventory = async () => {
    const { data } = await supabase
      .from("inventory")
      .select("*")
      .eq("status", "Active")
      .order("category, item_name");
    if (data) setInventory(data);
  };

  const addItem = () => {
    setItems([...items, { 
      item_name: "", 
      quantity_ordered: 0, 
      item_price: 0,
      inventory_id: "",
      stock_available: 0,
      category: "",
      usage_unit: "pairs"
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const selectInventoryItem = (index: number, inventoryItem: InventoryItem) => {
    const newItems = [...items];
    newItems[index] = {
      item_name: inventoryItem.item_name,
      quantity_ordered: 1,
      item_price: inventoryItem.price_per_unit,
      inventory_id: inventoryItem.id,
      stock_available: inventoryItem.stock_on_hand,
      category: inventoryItem.category,
      usage_unit: inventoryItem.unit,
    };
    setItems(newItems);
    setItemSearchOpen(null);
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], quantity_ordered: quantity };
    setItems(newItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity_ordered * item.item_price), 0);
  };

  const getStockStatus = (available: number) => {
    if (available < 10) return { color: "default", text: "Low Stock" };
    return { color: "secondary", text: "Current Stock" };
  };

  const handleSubmit = async () => {
    if (!selectedCustomer || items.length === 0 || items.some(item => !item.inventory_id)) {
      toast({ 
        title: "Error", 
        description: "Please select a customer and add at least one item from inventory", 
        variant: "destructive" 
      });
      return;
    }

    // Generate order number - find the actual highest order number
    const { data: orders } = await supabase
      .from("sales_orders")
      .select("sales_order_number");

    let maxNumber = 0;
    if (orders) {
      orders.forEach(order => {
        const match = order.sales_order_number.match(/SO-(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNumber) maxNumber = num;
        }
      });
    }
    const newOrderNumber = `SO-${String(maxNumber + 1).padStart(5, "0")}`;

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
        notes: notes || null,
      })
      .select()
      .single();

    if (orderError) {
      toast({ title: "Error creating order", description: orderError.message, variant: "destructive" });
      return;
    }

    // Insert items with quantity_fulfilled: 0 first
    const orderItems = items.map(item => ({
      sales_order_id: order.id,
      inventory_id: item.inventory_id,
      item_name: item.item_name,
      quantity_ordered: item.quantity_ordered,
      quantity_fulfilled: 0, // Start at 0 so the UPDATE trigger fires
      item_price: item.item_price,
      item_total: item.quantity_ordered * item.item_price,
      usage_unit: item.usage_unit,
    }));

    const { data: insertedItems, error: itemsError } = await supabase
      .from("sales_order_items")
      .insert(orderItems)
      .select("id, quantity_ordered");

    if (itemsError) {
      toast({ title: "Error adding items", description: itemsError.message, variant: "destructive" });
      return;
    }

    // Now UPDATE each item to set quantity_fulfilled - this triggers the inventory addition
    for (const insertedItem of insertedItems || []) {
      await supabase
        .from("sales_order_items")
        .update({ quantity_fulfilled: insertedItem.quantity_ordered })
        .eq("id", insertedItem.id);
    }

    toast({ title: "Success", description: `Sales order ${newOrderNumber} created - inventory has been added` });
    resetForm();
    onSuccess();
    onOpenChange(false);
  };

  const resetForm = () => {
    setSelectedCustomer("");
    setOrderDate(new Date().toISOString().split("T")[0]);
    setPaymentTerms("Due on Receipt");
    setNotes("");
    setItems([]);
  };

  const groupedInventory = inventory.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Sales Order</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Customer *</Label>
                <Popover open={customerSearchOpen} onOpenChange={setCustomerSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between mt-2"
                    >
                      {selectedCustomer
                        ? customers.find((c) => c.id === selectedCustomer)?.customer_name
                        : "Select customer..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Search customer..." />
                      <CommandList>
                        <CommandEmpty>
                          <div className="p-4 text-center">
                            <p className="text-sm text-muted-foreground mb-2">No customer found</p>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setCustomerSearchOpen(false);
                                setIsCustomerDialogOpen(true);
                              }}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add New Customer
                            </Button>
                          </div>
                        </CommandEmpty>
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
                <Label htmlFor="order-date">Order Date *</Label>
                <Input
                  id="order-date"
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="payment-terms">Payment Terms</Label>
              <Input
                id="payment-terms"
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any additional notes..."
                className="mt-2"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <Label>Items *</Label>
                <Button onClick={addItem} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((item, index) => {
                  const stockStatus = item.inventory_id ? getStockStatus(item.stock_available) : null;
                  
                  return (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex gap-2 items-start">
                        <div className="flex-1">
                          <Label className="text-xs">Product</Label>
                          <Popover open={itemSearchOpen === index} onOpenChange={(open) => setItemSearchOpen(open ? index : null)}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between mt-1"
                              >
                                {item.item_name || "Select product..."}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[500px] p-0" align="start">
                              <Command>
                                <CommandInput placeholder="Search products..." />
                                <CommandList>
                                  <CommandEmpty>
                                    <div className="p-4 text-center text-sm text-muted-foreground">
                                      <PackageSearch className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                      No products found
                                    </div>
                                  </CommandEmpty>
                                  {Object.entries(groupedInventory).map(([category, categoryItems]) => (
                                    <CommandGroup key={category} heading={category}>
                                      {categoryItems.map((invItem) => (
                                        <CommandItem
                                          key={invItem.id}
                                          value={invItem.item_name}
                                          onSelect={() => selectInventoryItem(index, invItem)}
                                          className="flex justify-between"
                                        >
                                          <div>
                                            <div className="font-medium">{invItem.item_name}</div>
                                            <div className="text-xs text-muted-foreground">
                                              ${invItem.price_per_unit.toFixed(2)} per {invItem.unit}
                                            </div>
                                          </div>
                                          <Badge variant={invItem.stock_on_hand > 10 ? "secondary" : invItem.stock_on_hand > 0 ? "default" : "destructive"}>
                                            {invItem.stock_on_hand} {invItem.unit}
                                          </Badge>
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  ))}
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          {item.inventory_id && (
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {item.category}
                              </Badge>
                              {stockStatus && (
                                <Badge variant={stockStatus.color as any} className="text-xs">
                                  {stockStatus.text}: {item.stock_available} {item.usage_unit}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="w-24">
                          <Label className="text-xs">Quantity</Label>
                          <Input
                            type="number"
                            value={item.quantity_ordered || ""}
                            onChange={(e) => updateItemQuantity(index, parseFloat(e.target.value) || 0)}
                            className="mt-1"
                            disabled={!item.inventory_id}
                          />
                        </div>

                        <div className="w-28">
                          <Label className="text-xs">Price</Label>
                          <Input
                            type="number"
                            value={item.item_price || ""}
                            readOnly
                            className="mt-1 bg-muted"
                          />
                        </div>

                        <div className="w-32">
                          <Label className="text-xs">Total</Label>
                          <Input
                            value={`$${(item.quantity_ordered * item.item_price).toFixed(2)}`}
                            readOnly
                            className="mt-1 bg-muted font-medium"
                          />
                        </div>

                        <Button
                          onClick={() => removeItem(index)}
                          variant="ghost"
                          size="sm"
                          className="mt-5"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {item.quantity_ordered > item.stock_available && item.inventory_id && (
                        <div className="flex items-center gap-2 text-sm text-destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <span>Ordered quantity exceeds available stock by {item.quantity_ordered - item.stock_available}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {items.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <PackageSearch className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No items added yet</p>
                    <p className="text-sm">Click "Add Item" to select products from inventory</p>
                  </div>
                )}
              </div>
            </div>

            {items.length > 0 && (
              <div className="flex justify-end">
                <div className="text-right">
                  <div className="text-sm text-muted-foreground mb-1">Total</div>
                  <div className="text-2xl font-bold">${calculateTotal().toFixed(2)}</div>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!selectedCustomer || items.length === 0}>
                Create Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <CustomerDialog
        open={isCustomerDialogOpen}
        onOpenChange={setIsCustomerDialogOpen}
        onSuccess={() => {
          fetchCustomers();
          setIsCustomerDialogOpen(false);
        }}
      />
    </>
  );
};