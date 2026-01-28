import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Eye, Download } from "lucide-react";
import { format } from "date-fns";
import { CreateSalesOrderDialog } from "./CreateSalesOrderDialog";
import { SalesOrderDetailDialog } from "./SalesOrderDetailDialog";
import { ImportSalesOrdersButton } from "./ImportSalesOrdersButton";
import { useToast } from "@/hooks/use-toast";

interface SalesOrderItem {
  quantity_ordered: number;
}

interface SalesOrder {
  id: string;
  sales_order_number: string;
  order_date: string;
  customer_id: string;
  order_status: string;
  invoice_status: string;
  payment_status: string;
  shipment_status: string;
  total: number;
  customers: { customer_name: string };
  sales_order_items: SalesOrderItem[];
}

export const SalesOrdersTable = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<SalesOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    const filtered = orders.filter(order =>
      order.sales_order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customers.customer_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredOrders(filtered);
  }, [searchQuery, orders]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from("sales_orders")
      .select(`
        *,
        customers (customer_name),
        sales_order_items (quantity_ordered)
      `)
      .order("order_date", { ascending: false });

    if (error) {
      toast({ title: "Error fetching orders", description: error.message, variant: "destructive" });
      return;
    }

    setOrders(data || []);
    setFilteredOrders(data || []);
  };

  const getStatusBadge = (status: string, type: "order" | "invoice" | "payment" | "shipment") => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      open: "default",
      closed: "secondary",
      cancelled: "destructive",
      invoiced: "default",
      not_invoiced: "outline",
      paid: "default",
      unpaid: "destructive",
      fulfilled: "default",
      unfulfilled: "outline",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
      </Badge>
    );
  };

  const exportToCSV = () => {
    const headers = ["Order #", "Date", "Customer", "Status", "Invoice", "Payment", "Shipment", "Pairs", "Total"];
    const rows = filteredOrders.map(order => {
      const totalPairs = order.sales_order_items?.reduce((sum, item) => sum + Number(item.quantity_ordered), 0) || 0;
      return [
        order.sales_order_number,
        format(new Date(order.order_date), "yyyy-MM-dd"),
        order.customers.customer_name,
        order.order_status,
        order.invoice_status,
        order.payment_status,
        order.shipment_status,
        totalPairs.toString(),
        order.total.toString(),
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sales_orders_${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders or customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <ImportSalesOrdersButton onSuccess={fetchOrders} />
          <Button onClick={exportToCSV} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order #</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Order Status</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Shipment</TableHead>
              <TableHead>Pairs</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.map((order) => {
              const totalPairs = order.sales_order_items?.reduce((sum, item) => sum + Number(item.quantity_ordered), 0) || 0;
              return (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.sales_order_number}</TableCell>
                  <TableCell>{format(new Date(order.order_date), "MMM dd, yyyy")}</TableCell>
                  <TableCell>{order.customers.customer_name}</TableCell>
                  <TableCell>{getStatusBadge(order.order_status, "order")}</TableCell>
                  <TableCell>{getStatusBadge(order.invoice_status, "invoice")}</TableCell>
                  <TableCell>{getStatusBadge(order.payment_status, "payment")}</TableCell>
                  <TableCell>{getStatusBadge(order.shipment_status, "shipment")}</TableCell>
                  <TableCell className="font-medium">{totalPairs.toLocaleString()}</TableCell>
                  <TableCell>${Number(order.total).toFixed(2)}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedOrder(order.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <CreateSalesOrderDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={fetchOrders}
      />

      {selectedOrder && (
        <SalesOrderDetailDialog
          orderId={selectedOrder}
          open={!!selectedOrder}
          onOpenChange={(open) => !open && setSelectedOrder(null)}
          onSuccess={fetchOrders}
        />
      )}
    </div>
  );
};
