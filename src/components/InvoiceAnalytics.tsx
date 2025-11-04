import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { FileText, Package, TrendingUp, CheckCircle } from "lucide-react";
import { format } from "date-fns";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

export const InvoiceAnalytics = () => {
  const { data: invoices = [] } = useQuery({
    queryKey: ['invoices_analytics'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('invoices')
        .select('*, customers(customer_name), invoice_items(quantity)')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate metrics
  const totalInvoices = invoices.length;
  const fulfilledInvoices = invoices.filter(i => i.status === 'fulfilled').length;
  const totalItems = invoices.reduce((sum, inv) => {
    const items = inv.invoice_items?.reduce((s, item) => s + Number(item.quantity || 0), 0) || 0;
    return sum + items;
  }, 0);
  const avgItemsPerInvoice = totalInvoices > 0 ? totalItems / totalInvoices : 0;

  // Invoices by status
  const statusData = [
    { name: 'Draft', value: invoices.filter(i => i.status === 'draft').length },
    { name: 'Sent', value: invoices.filter(i => i.status === 'sent').length },
    { name: 'Fulfilled', value: fulfilledInvoices },
    { name: 'Cancelled', value: invoices.filter(i => i.status === 'cancelled').length },
  ].filter(d => d.value > 0);

  // Invoices over time (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return format(date, 'MM/dd');
  });

  const invoiceTrends = last30Days.map(date => {
    const dayInvoices = invoices.filter(inv => {
      const invDate = format(new Date(inv.created_at), 'MM/dd');
      return invDate === date;
    });
    const fulfilled = dayInvoices.filter(i => i.status === 'fulfilled').length;
    return { date, invoices: dayInvoices.length, fulfilled };
  });

  // Top customers by invoice count
  const customerInvoices = invoices.reduce((acc, invoice) => {
    const customerName = invoice.customers?.customer_name || 'Unknown';
    if (!acc[customerName]) {
      acc[customerName] = 0;
    }
    acc[customerName]++;
    return acc;
  }, {} as Record<string, number>);

  const topCustomers = Object.entries(customerInvoices)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, invoices: count }));

  // Fulfillment rate
  const fulfillmentRate = totalInvoices > 0 ? (fulfilledInvoices / totalInvoices) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Items Distributed</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">Total pairs donated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Items/Invoice</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgItemsPerInvoice.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Per invoice</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fulfillment Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fulfillmentRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">{fulfilledInvoices} fulfilled</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Invoices Over Time (Last 30 Days)</CardTitle>
            <CardDescription>Daily invoice creation and fulfillment</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={invoiceTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }} 
                />
                <Legend />
                <Line type="monotone" dataKey="invoices" stroke="hsl(var(--primary))" name="Created" strokeWidth={2} />
                <Line type="monotone" dataKey="fulfilled" stroke="hsl(var(--secondary))" name="Fulfilled" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Invoices by Status</CardTitle>
            <CardDescription>Distribution of invoice statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Top 10 Customers by Invoice Count</CardTitle>
            <CardDescription>Customers with most invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCustomers}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))' 
                  }} 
                />
                <Bar dataKey="invoices" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
