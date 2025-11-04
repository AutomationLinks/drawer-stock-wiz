import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Building2, Mail, Phone, MapPin, DollarSign, Package, FileText } from "lucide-react";

interface Company {
  id: string;
  customer_id: string;
  customer_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  customer_sub_type?: string;
  billing_address?: string;
  shipping_address?: string;
}

interface CompanyDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company: Company | null;
}

interface Stats {
  ordersCount: number;
  invoicesCount: number;
  totalOrderValue: number;
  totalInvoiced: number;
  lastOrderDate: string | null;
}

export const CompanyDetailDialog = ({ open, onOpenChange, company }: CompanyDetailDialogProps) => {
  const [stats, setStats] = useState<Stats>({
    ordersCount: 0,
    invoicesCount: 0,
    totalOrderValue: 0,
    totalInvoiced: 0,
    lastOrderDate: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (company && open) {
      fetchCompanyStats();
    }
  }, [company, open]);

  const fetchCompanyStats = async () => {
    if (!company) return;

    setLoading(true);
    try {
      // Fetch sales orders
      const { data: orders } = await supabase
        .from("sales_orders")
        .select("total, order_date")
        .eq("customer_id", company.id);

      // Fetch invoices
      const { data: invoices } = await supabase
        .from("invoices")
        .select("total")
        .eq("customer_id", company.id);

      const ordersCount = orders?.length || 0;
      const invoicesCount = invoices?.length || 0;
      const totalOrderValue = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      const totalInvoiced = invoices?.reduce((sum, invoice) => sum + Number(invoice.total), 0) || 0;
      
      const lastOrderDate = orders && orders.length > 0
        ? orders.sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())[0].order_date
        : null;

      setStats({
        ordersCount,
        invoicesCount,
        totalOrderValue,
        totalInvoiced,
        lastOrderDate,
      });
    } catch (error) {
      console.error("Error fetching company stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!company) return null;

  const contactName = [company.first_name, company.last_name].filter(Boolean).join(" ") || "N/A";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {company.customer_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Company Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Company Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Contact ID</div>
                <div className="font-medium">{company.customer_id}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Customer Type</div>
                <div>
                  {company.customer_sub_type ? (
                    <Badge variant="outline">{company.customer_sub_type}</Badge>
                  ) : (
                    "N/A"
                  )}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Contact Name
                </div>
                <div className="font-medium">{contactName}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" /> Email
                </div>
                <div className="font-medium">{company.email || "N/A"}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Phone className="h-3 w-3" /> Phone
                </div>
                <div className="font-medium">{company.phone || "N/A"}</div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Addresses */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Addresses</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                  <MapPin className="h-3 w-3" /> Billing Address
                </div>
                <div className="text-sm whitespace-pre-wrap">
                  {company.billing_address || "N/A"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                  <MapPin className="h-3 w-3" /> Shipping Address
                </div>
                <div className="text-sm whitespace-pre-wrap">
                  {company.shipping_address || "N/A"}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Statistics */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Business Statistics</h3>
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                    <Package className="h-3 w-3" /> Sales Orders
                  </div>
                  <div className="text-2xl font-bold">{stats.ordersCount}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                    <FileText className="h-3 w-3" /> Invoices
                  </div>
                  <div className="text-2xl font-bold">{stats.invoicesCount}</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                    <DollarSign className="h-3 w-3" /> Total Order Value
                  </div>
                  <div className="text-2xl font-bold">
                    ${stats.totalOrderValue.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                    <DollarSign className="h-3 w-3" /> Total Invoiced
                  </div>
                  <div className="text-2xl font-bold">
                    ${stats.totalInvoiced.toLocaleString()}
                  </div>
                </div>
                <div className="p-4 border rounded-lg col-span-2">
                  <div className="text-sm text-muted-foreground mb-1">Last Order Date</div>
                  <div className="text-lg font-semibold">
                    {stats.lastOrderDate
                      ? format(new Date(stats.lastOrderDate), "MMM dd, yyyy")
                      : "No orders yet"}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
