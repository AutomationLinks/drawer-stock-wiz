import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CalendarIcon, Download, Package, FileText, Users, DollarSign } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

export const OutgoingDonationsReport = () => {
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [zipFilter, setZipFilter] = useState<string>("");
  const [customerFilter, setCustomerFilter] = useState<string>("all");

  // Fetch invoices with customer and items
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['outgoing_donations_report', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers(customer_name, city, state, postal_code, email),
          invoice_items(id, item_name, quantity, price, total)
        `)
        .gte('invoice_date', format(startDate, 'yyyy-MM-dd'))
        .lte('invoice_date', format(endDate, 'yyyy-MM-dd'))
        .order('invoice_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Get unique states and customers for filters
  const uniqueStates = [...new Set(invoices.map(i => i.customers?.state).filter(Boolean))].sort();
  const uniqueCustomers = [...new Set(invoices.map(i => i.customers?.customer_name).filter(Boolean))].sort();

  // Apply filters
  const filteredInvoices = invoices.filter(invoice => {
    const customer = invoice.customers;
    
    if (stateFilter !== "all" && customer?.state !== stateFilter) return false;
    if (zipFilter && !customer?.postal_code?.startsWith(zipFilter)) return false;
    if (customerFilter !== "all" && customer?.customer_name !== customerFilter) return false;
    
    return true;
  });

  // Calculate metrics
  const totalPairs = filteredInvoices.reduce((sum, inv) => {
    return sum + (inv.invoice_items?.reduce((s, item) => s + Number(item.quantity || 0), 0) || 0);
  }, 0);
  
  const totalValue = filteredInvoices.reduce((sum, inv) => sum + Number(inv.total || 0), 0);
  const totalInvoices = filteredInvoices.length;
  const uniquePartners = new Set(filteredInvoices.map(i => i.customer_id)).size;

  // Trend data
  const trendData = filteredInvoices.reduce((acc, inv) => {
    const date = format(new Date(inv.invoice_date), 'MM/dd');
    const pairs = inv.invoice_items?.reduce((s, item) => s + Number(item.quantity || 0), 0) || 0;
    
    if (!acc[date]) {
      acc[date] = { date, pairs: 0, value: 0 };
    }
    acc[date].pairs += pairs;
    acc[date].value += Number(inv.total || 0);
    return acc;
  }, {} as Record<string, { date: string; pairs: number; value: number }>);

  const chartData = Object.values(trendData).sort((a, b) => a.date.localeCompare(b.date));

  // By state data
  const byStateData = filteredInvoices.reduce((acc, inv) => {
    const state = inv.customers?.state || 'Unknown';
    const pairs = inv.invoice_items?.reduce((s, item) => s + Number(item.quantity || 0), 0) || 0;
    
    if (!acc[state]) {
      acc[state] = { state, pairs: 0, invoices: 0 };
    }
    acc[state].pairs += pairs;
    acc[state].invoices += 1;
    return acc;
  }, {} as Record<string, { state: string; pairs: number; invoices: number }>);

  const stateChartData = Object.values(byStateData).sort((a, b) => b.pairs - a.pairs);

  // Export to CSV
  const exportToCsv = () => {
    const headers = ['Invoice #', 'Date', 'Customer', 'City', 'State', 'Zip', 'Total Pairs', 'Total Value'];
    const rows = filteredInvoices.map(inv => {
      const pairs = inv.invoice_items?.reduce((s, item) => s + Number(item.quantity || 0), 0) || 0;
      return [
        inv.invoice_number,
        format(new Date(inv.invoice_date), 'yyyy-MM-dd'),
        inv.customers?.customer_name || '',
        inv.customers?.city || '',
        inv.customers?.state || '',
        inv.customers?.postal_code || '',
        pairs,
        inv.total
      ];
    });

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `outgoing_donations_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Quick date presets
  const setDatePreset = (preset: string) => {
    const today = new Date();
    switch (preset) {
      case '7days':
        setStartDate(subDays(today, 7));
        setEndDate(today);
        break;
      case '30days':
        setStartDate(subDays(today, 30));
        setEndDate(today);
        break;
      case 'thisMonth':
        setStartDate(startOfMonth(today));
        setEndDate(endOfMonth(today));
        break;
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        setStartDate(startOfMonth(lastMonth));
        setEndDate(endOfMonth(lastMonth));
        break;
      case 'thisYear':
        setStartDate(new Date(today.getFullYear(), 0, 1));
        setEndDate(today);
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Outgoing Donations Report</CardTitle>
          <CardDescription>Pairs donated to partners via invoices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <Button variant="outline" size="sm" onClick={() => setDatePreset('7days')}>Last 7 Days</Button>
            <Button variant="outline" size="sm" onClick={() => setDatePreset('30days')}>Last 30 Days</Button>
            <Button variant="outline" size="sm" onClick={() => setDatePreset('thisMonth')}>This Month</Button>
            <Button variant="outline" size="sm" onClick={() => setDatePreset('lastMonth')}>Last Month</Button>
            <Button variant="outline" size="sm" onClick={() => setDatePreset('thisYear')}>This Year</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(startDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover" align="start">
                  <Calendar mode="single" selected={startDate} onSelect={(d) => d && setStartDate(d)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(endDate, "PPP")}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover" align="start">
                  <Calendar mode="single" selected={endDate} onSelect={(d) => d && setEndDate(d)} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            
            <div className="space-y-2">
              <Label>State</Label>
              <Select value={stateFilter} onValueChange={setStateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All States" />
                </SelectTrigger>
                <SelectContent className="bg-popover">
                  <SelectItem value="all">All States</SelectItem>
                  {uniqueStates.map(state => (
                    <SelectItem key={state} value={state || ''}>{state}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Zip Code Prefix</Label>
              <Input 
                placeholder="e.g., 554" 
                value={zipFilter} 
                onChange={(e) => setZipFilter(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Customer</Label>
              <Select value={customerFilter} onValueChange={setCustomerFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Customers" />
                </SelectTrigger>
                <SelectContent className="bg-popover max-h-[200px]">
                  <SelectItem value="all">All Customers</SelectItem>
                  {uniqueCustomers.map(customer => (
                    <SelectItem key={customer} value={customer || ''}>{customer}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pairs Donated</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPairs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Donated inventory value</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground">Total invoices</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Partners</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniquePartners}</div>
            <p className="text-xs text-muted-foreground">Partners served</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Pairs Donated Over Time</CardTitle>
            <CardDescription>Daily distribution of pairs</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Legend />
                <Line type="monotone" dataKey="pairs" stroke="hsl(var(--primary))" name="Pairs" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Pairs by State</CardTitle>
            <CardDescription>Geographic distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stateChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="state" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="pairs" fill="hsl(var(--primary))" name="Pairs" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Invoice Details</CardTitle>
            <CardDescription>All outgoing donations in selected period</CardDescription>
          </div>
          <Button onClick={exportToCsv} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Zip</TableHead>
                  <TableHead className="text-right">Pairs</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">No invoices found</TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => {
                    const pairs = invoice.invoice_items?.reduce((s, item) => s + Number(item.quantity || 0), 0) || 0;
                    return (
                      <TableRow key={invoice.id}>
                        <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                        <TableCell>{format(new Date(invoice.invoice_date), 'MM/dd/yyyy')}</TableCell>
                        <TableCell>{invoice.customers?.customer_name || '-'}</TableCell>
                        <TableCell>{invoice.customers?.city || '-'}</TableCell>
                        <TableCell>{invoice.customers?.state || '-'}</TableCell>
                        <TableCell>{invoice.customers?.postal_code || '-'}</TableCell>
                        <TableCell className="text-right">{pairs.toLocaleString()}</TableCell>
                        <TableCell className="text-right">${Number(invoice.total).toLocaleString()}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
