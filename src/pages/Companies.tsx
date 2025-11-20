import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CompaniesTable } from "@/components/CompaniesTable";
import { CompanyDialog } from "@/components/CompanyDialog";
import { CompanyDetailDialog } from "@/components/CompanyDetailDialog";
import { ImportCompaniesButton } from "@/components/ImportCompaniesButton";
import { ImportCompaniesDialog } from "@/components/ImportCompaniesDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Building2, Package, FileText, TrendingUp } from "lucide-react";

interface Company {
  id: string;
  customer_id: string;
  customer_name: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  phone?: string;
  customer_sub_type?: string;
  address_line_1?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  ordersCount?: number;
  invoicesCount?: number;
}

const Companies = () => {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [companyDialogOpen, setCompanyDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    withOrders: 0,
    withInvoices: 0,
    newThisMonth: 0,
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    filterCompanies();
  }, [searchQuery, companies]);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      // Fetch companies
      const { data: companiesData, error: companiesError } = await supabase
        .from("customers")
        .select("*")
        .order("customer_name");

      if (companiesError) throw companiesError;

      // Fetch order counts
      const { data: ordersData } = await supabase
        .from("sales_orders")
        .select("customer_id");

      // Fetch invoice counts
      const { data: invoicesData } = await supabase
        .from("invoices")
        .select("customer_id");

      // Count orders and invoices per company
      const orderCounts = ordersData?.reduce((acc, order) => {
        acc[order.customer_id] = (acc[order.customer_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const invoiceCounts = invoicesData?.reduce((acc, invoice) => {
        acc[invoice.customer_id] = (acc[invoice.customer_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      // Combine data
      const enrichedCompanies = companiesData?.map(company => ({
        ...company,
        ordersCount: orderCounts[company.id] || 0,
        invoicesCount: invoiceCounts[company.id] || 0,
      })) || [];

      setCompanies(enrichedCompanies);

      // Calculate stats
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      setStats({
        total: enrichedCompanies.length,
        withOrders: enrichedCompanies.filter(c => c.ordersCount > 0).length,
        withInvoices: enrichedCompanies.filter(c => c.invoicesCount > 0).length,
        newThisMonth: enrichedCompanies.filter(c => 
          new Date(c.created_at) >= firstDayOfMonth
        ).length,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch companies",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterCompanies = () => {
    if (!searchQuery) {
      setFilteredCompanies(companies);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = companies.filter(
      (company) =>
        company.customer_name.toLowerCase().includes(query) ||
        company.customer_id.toLowerCase().includes(query) ||
        company.email?.toLowerCase().includes(query) ||
        company.first_name?.toLowerCase().includes(query) ||
        company.last_name?.toLowerCase().includes(query) ||
        company.customer_sub_type?.toLowerCase().includes(query)
    );
    setFilteredCompanies(filtered);
  };

  const handleAddCompany = () => {
    setSelectedCompany(null);
    setCompanyDialogOpen(true);
  };

  const handleEditCompany = (company: Company) => {
    setSelectedCompany(company);
    setCompanyDialogOpen(true);
  };

  const handleViewCompany = (company: Company) => {
    setSelectedCompany(company);
    setDetailDialogOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold">Companies</h1>
            <p className="text-muted-foreground">Manage your customer companies</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">With Orders</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.withOrders}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">With Invoices</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.withInvoices}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">New This Month</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.newThisMonth}</div>
              </CardContent>
            </Card>
          </div>

          {/* Actions Bar */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <ImportCompaniesButton onClick={() => setImportDialogOpen(true)} />
              <Button onClick={handleAddCompany}>
                <Plus className="mr-2 h-4 w-4" />
                Add Company
              </Button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : (
            <CompaniesTable
              companies={filteredCompanies}
              onEdit={handleEditCompany}
              onView={handleViewCompany}
              onRefresh={fetchCompanies}
            />
          )}
        </div>
      </main>

      {/* Dialogs */}
      <CompanyDialog
        open={companyDialogOpen}
        onOpenChange={setCompanyDialogOpen}
        company={selectedCompany || undefined}
        onSuccess={fetchCompanies}
      />
      <CompanyDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        company={selectedCompany}
      />
      <ImportCompaniesDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onSuccess={fetchCompanies}
      />
    </div>
  );
};

export default Companies;
