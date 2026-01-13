import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eye, Mail, CheckCircle, Trash2, Search } from "lucide-react";
import { format } from "date-fns";
import { InvoiceDetailDialog } from "./InvoiceDetailDialog";
import { toast } from "sonner";

export const InvoicesTable = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const { data: invoices, isLoading, refetch } = useQuery({
    queryKey: ["invoices", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("invoices")
        .select(`
          *,
          customers (
            customer_name,
            email,
            billing_address
          ),
          invoice_items (
            id,
            item_name,
            quantity,
            price,
            total,
            inventory_id,
            inventory (
              item_name,
              stock_on_hand
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (searchTerm) {
        query = query.or(`invoice_number.ilike.%${searchTerm}%,customers.customer_name.ilike.%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setDetailDialogOpen(true);
  };

  const handleSendEmail = async (invoice: any) => {
    toast.info("Email functionality will be available once Resend API key is configured");
  };

  const handleMarkFulfilled = async (invoiceId: string) => {
    const { error } = await supabase
      .from("invoices")
      .update({ status: "fulfilled" })
      .eq("id", invoiceId);

    if (error) {
      toast.error("Failed to mark invoice as fulfilled");
    } else {
      toast.success("Invoice marked as fulfilled and inventory updated");
      refetch();
    }
  };

  const handleDelete = async (invoiceId: string) => {
    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", invoiceId);

    if (error) {
      toast.error("Failed to delete invoice");
    } else {
      toast.success("Invoice deleted successfully");
      refetch();
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

  if (isLoading) {
    return <div className="text-center py-8">Loading invoices...</div>;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by invoice number or customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Pairs</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No invoices found. Create your first invoice to get started.
                  </TableCell>
                </TableRow>
              ) : (
                invoices?.map((invoice) => {
                  const totalPairs = invoice.invoice_items?.reduce(
                    (sum: number, item: any) => sum + (item.quantity || 0),
                    0
                  ) || 0;
                  return (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                    <TableCell>{invoice.customers?.customer_name}</TableCell>
                    <TableCell>{format(new Date(invoice.invoice_date), "MMM dd, yyyy")}</TableCell>
                    <TableCell>
                      {invoice.due_date ? format(new Date(invoice.due_date), "MMM dd, yyyy") : "—"}
                    </TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right font-medium">{totalPairs}</TableCell>
                    <TableCell className="text-right">$0.00</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewInvoice(invoice)}
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {invoice.status !== "fulfilled" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleSendEmail(invoice)}
                              title="Send Email"
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMarkFulfilled(invoice.id)}
                              title="Mark as Fulfilled"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        {invoice.status === "draft" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(invoice.id)}
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {selectedInvoice && (
        <InvoiceDetailDialog
          open={detailDialogOpen}
          onOpenChange={setDetailDialogOpen}
          invoice={selectedInvoice}
          onUpdate={refetch}
        />
      )}
    </>
  );
};
