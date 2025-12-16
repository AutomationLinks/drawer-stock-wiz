import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { InvoiceTemplate } from "./InvoiceTemplate";
import { EditSalesOrderDialog } from "./EditSalesOrderDialog";
import { Printer, Package, Edit, Trash2 } from "lucide-react";

interface SalesOrderDetailDialogProps {
  orderId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface OrderWithDetails {
  id: string;
  sales_order_number: string;
  order_date: string;
  order_status: string;
  invoice_status: string;
  payment_status: string;
  shipment_status: string;
  payment_terms: string;
  subtotal: number;
  total: number;
  customers: { customer_name: string; billing_address: string };
  sales_order_items: Array<{
    id: string;
    item_name: string;
    quantity_ordered: number;
    quantity_invoiced: number;
    quantity_fulfilled: number;
    item_price: number;
    item_total: number;
    usage_unit: string;
  }>;
}

export const SalesOrderDetailDialog = ({ orderId, open, onOpenChange, onSuccess }: SalesOrderDetailDialogProps) => {
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && orderId) {
      fetchOrderDetails();
    }
  }, [open, orderId]);

  const fetchOrderDetails = async () => {
    const { data, error } = await supabase
      .from("sales_orders")
      .select(`
        *,
        customers (customer_name, billing_address),
        sales_order_items (*)
      `)
      .eq("id", orderId)
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    setOrder(data);
  };

  const handleFulfillItem = async (itemId: string, quantityOrdered: number) => {
    const { error } = await supabase
      .from("sales_order_items")
      .update({ quantity_fulfilled: quantityOrdered })
      .eq("id", itemId);

    if (error) {
      toast({ title: "Error fulfilling item", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Success", description: "Item received - inventory updated" });
    fetchOrderDetails();
    onSuccess();
  };

  if (!order) return null;

  if (showInvoice) {
    return <InvoiceTemplate order={order} onClose={() => setShowInvoice(false)} />;
  }

  const handleEditSuccess = () => {
    fetchOrderDetails();
    onSuccess();
  };

  const handleDeleteOrder = async () => {
    if (!order) return;
    
    setIsDeleting(true);
    
    // Reverse inventory changes by subtracting fulfilled quantities
    for (const item of order.sales_order_items) {
      if (item.quantity_fulfilled > 0) {
        const { data: invItem } = await supabase
          .from("inventory")
          .select("stock_on_hand")
          .eq("id", item.id)
          .maybeSingle();
        
        // Find actual inventory item by name since sales_order_items.id is different from inventory.id
        const { error: invError } = await supabase
          .from("inventory")
          .update({ stock_on_hand: supabase.rpc ? undefined : undefined })
          .eq("item_name", item.item_name);
      }
    }
    
    // Subtract fulfilled quantities from inventory
    for (const item of order.sales_order_items) {
      if (item.quantity_fulfilled > 0) {
        const { data: invData } = await supabase
          .from("inventory")
          .select("id, stock_on_hand")
          .eq("item_name", item.item_name)
          .maybeSingle();
        
        if (invData) {
          await supabase
            .from("inventory")
            .update({ stock_on_hand: invData.stock_on_hand - item.quantity_fulfilled })
            .eq("id", invData.id);
        }
      }
    }
    
    // Delete order items first (foreign key constraint)
    const { error: itemsError } = await supabase
      .from("sales_order_items")
      .delete()
      .eq("sales_order_id", order.id);
    
    if (itemsError) {
      toast({ title: "Error deleting order items", description: itemsError.message, variant: "destructive" });
      setIsDeleting(false);
      return;
    }
    
    // Delete the order
    const { error: orderError } = await supabase
      .from("sales_orders")
      .delete()
      .eq("id", order.id);
    
    if (orderError) {
      toast({ title: "Error deleting order", description: orderError.message, variant: "destructive" });
      setIsDeleting(false);
      return;
    }
    
    toast({ title: "Success", description: `Order ${order.sales_order_number} deleted and inventory adjusted` });
    setIsDeleting(false);
    onOpenChange(false);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sales Order {order.sales_order_number}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Customer Information</h3>
              <p className="text-sm">{order.customers.customer_name}</p>
              <p className="text-sm text-muted-foreground">{order.customers.billing_address}</p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Order Details</h3>
              <p className="text-sm">Date: {format(new Date(order.order_date), "MMM dd, yyyy")}</p>
              <p className="text-sm">Payment Terms: {order.payment_terms}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Badge>{order.order_status}</Badge>
            <Badge variant="outline">{order.invoice_status}</Badge>
            <Badge variant="outline">{order.payment_status}</Badge>
            <Badge variant="outline">{order.shipment_status}</Badge>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Order Items</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Ordered</TableHead>
                  <TableHead>Fulfilled</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.sales_order_items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.item_name}</TableCell>
                    <TableCell>
                      {item.quantity_ordered} {item.usage_unit}
                    </TableCell>
                    <TableCell>
                      {item.quantity_fulfilled} {item.usage_unit}
                    </TableCell>
                    <TableCell>${Number(item.item_price).toFixed(2)}</TableCell>
                    <TableCell>${Number(item.item_total).toFixed(2)}</TableCell>
                    <TableCell>
                      {item.quantity_fulfilled < item.quantity_ordered && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleFulfillItem(item.id, item.quantity_ordered)}
                        >
                          <Package className="mr-2 h-4 w-4" />
                          Receive
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between">
              <span className="font-semibold">Subtotal:</span>
              <span>${Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold">
              <span>Total:</span>
              <span>${Number(order.total).toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={isDeleting}>
                  <Trash2 className="mr-2 h-4 w-4" />
                  {isDeleting ? "Deleting..." : "Delete Order"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Sales Order?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will delete order {order.sales_order_number} and reverse the inventory changes 
                    (subtract {order.sales_order_items.reduce((sum, i) => sum + i.quantity_fulfilled, 0)} items from stock).
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteOrder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete Order
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            {order.shipment_status !== "fulfilled" && (
              <Button variant="outline" onClick={() => setShowEditDialog(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Order
              </Button>
            )}
            <Button variant="outline" onClick={() => setShowInvoice(true)}>
              <Printer className="mr-2 h-4 w-4" />
              View Invoice
            </Button>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>

      <EditSalesOrderDialog
        orderId={orderId}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onSuccess={handleEditSuccess}
      />
    </Dialog>
  );
};
