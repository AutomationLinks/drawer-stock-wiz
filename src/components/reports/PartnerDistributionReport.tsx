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
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CalendarIcon, Download, MapPin, Package, Users, Building } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

export const PartnerDistributionReport = () => {
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 90));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [zipPrefixFilter, setZipPrefixFilter] = useState<string>("");

  // Fetch invoices with customer and items
  const { data: invoices = [], isLoading } = useQuery({
    queryKey: ['partner_distribution_report', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers(id, customer_name, city, state, postal_code),
          invoice_items(id, quantity)
        `)
        .gte('invoice_date', format(startDate, 'yyyy-MM-dd'))
        .lte('invoice_date', format(endDate, 'yyyy-MM-dd'))
        .order('invoice_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Get unique states
  const uniqueStates = [...new Set(invoices.map(i => i.customers?.state).filter(Boolean))].sort();

  // Apply filters and aggregate by partner
  const partnerData = invoices.reduce((acc, invoice) => {
    const customer = invoice.customers;
    if (!customer) return acc;
    
    // Apply filters
    if (stateFilter !== "all" && customer.state !== stateFilter) return acc;
    if (zipPrefixFilter && !customer.postal_code?.startsWith(zipPrefixFilter)) return acc;
    
    const partnerId = customer.id;
    if (!acc[partnerId]) {
      acc[partnerId] = {
        id: partnerId,
        name: customer.customer_name,
        city: customer.city,
        state: customer.state,
        zip: customer.postal_code,
        pairs: 0,
        invoices: 0,
        value: 0
      };
    }
    
    const pairs = invoice.invoice_items?.reduce((s, item) => s + Number(item.quantity || 0), 0) || 0;
    acc[partnerId].pairs += pairs;
    acc[partnerId].invoices += 1;
    acc[partnerId].value += Number(invoice.total || 0);
    
    return acc;
  }, {} as Record<string, { id: string; name: string; city: string; state: string; zip: string; pairs: number; invoices: number; value: number }>);

  const partners = Object.values(partnerData).sort((a, b) => b.pairs - a.pairs);

  // Calculate metrics
  const totalPairs = partners.reduce((sum, p) => sum + p.pairs, 0);
  const totalValue = partners.reduce((sum, p) => sum + p.value, 0);
  const totalPartners = partners.length;
  const totalInvoices = partners.reduce((sum, p) => sum + p.invoices, 0);

  // By state data for pie chart
  const byStateData = partners.reduce((acc, p) => {
    const state = p.state || 'Unknown';
    if (!acc[state]) {
      acc[state] = { name: state, pairs: 0, partners: 0 };
    }
    acc[state].pairs += p.pairs;
    acc[state].partners += 1;
    return acc;
  }, {} as Record<string, { name: string; pairs: number; partners: number }>);

  const stateChartData = Object.values(byStateData).sort((a, b) => b.pairs - a.pairs);

  // By zip prefix data
  const byZipData = partners.reduce((acc, p) => {
    const zipPrefix = p.zip?.slice(0, 3) || 'Unknown';
    if (!acc[zipPrefix]) {
      acc[zipPrefix] = { prefix: zipPrefix, pairs: 0, partners: 0 };
    }
    acc[zipPrefix].pairs += p.pairs;
    acc[zipPrefix].partners += 1;
    return acc;
  }, {} as Record<string, { prefix: string; pairs: number; partners: number }>);

  const zipChartData = Object.values(byZipData).sort((a, b) => b.pairs - a.pairs).slice(0, 15);

  // Export to CSV
  const exportToCsv = () => {
    const headers = ['Partner Name', 'City', 'State', 'Zip', 'Total Pairs', 'Total Invoices', 'Total Value'];
    const rows = partners.map(p => [
      p.name,
      p.city || '',
      p.state || '',
      p.zip || '',
      p.pairs,
      p.invoices,
      p.value.toFixed(2)
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `partner_distribution_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  // Quick date presets
  const setDatePreset = (preset: string) => {
    const today = new Date();
    switch (preset) {
      case '30days':
        setStartDate(subDays(today, 30));
        setEndDate(today);
        break;
      case '90days':
        setStartDate(subDays(today, 90));
        setEndDate(today);
        break;
      case '6months':
        setStartDate(subMonths(today, 6));
        setEndDate(today);
        break;
      case 'thisYear':
        setStartDate(new Date(today.getFullYear(), 0, 1));
        setEndDate(today);
        break;
      case 'lastYear':
        setStartDate(new Date(today.getFullYear() - 1, 0, 1));
        setEndDate(new Date(today.getFullYear() - 1, 11, 31));
        break;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Partner Distribution Report</CardTitle>
          <CardDescription>Geographic distribution of donations by partner</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <Button variant="outline" size="sm" onClick={() => setDatePreset('30days')}>Last 30 Days</Button>
            <Button variant="outline" size="sm" onClick={() => setDatePreset('90days')}>Last 90 Days</Button>
            <Button variant="outline" size="sm" onClick={() => setDatePreset('6months')}>Last 6 Months</Button>
            <Button variant="outline" size="sm" onClick={() => setDatePreset('thisYear')}>This Year</Button>
            <Button variant="outline" size="sm" onClick={() => setDatePreset('lastYear')}>Last Year</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                value={zipPrefixFilter} 
                onChange={(e) => setZipPrefixFilter(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Partners</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPartners}</div>
            <p className="text-xs text-muted-foreground">Active partners</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pairs Distributed</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPairs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Pairs donated</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Distributed value</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInvoices}</div>
            <p className="text-xs text-muted-foreground">Donation records</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Distribution by State</CardTitle>
            <CardDescription>Pairs donated by state</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stateChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, pairs }) => `${name}: ${pairs.toLocaleString()}`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="pairs"
                >
                  {stateChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Top Zip Code Areas</CardTitle>
            <CardDescription>Pairs by zip code prefix (first 3 digits)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={zipChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="prefix" stroke="hsl(var(--muted-foreground))" />
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
            <CardTitle>Partner Details</CardTitle>
            <CardDescription>All partners and their distribution totals</CardDescription>
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
                  <TableHead>Partner Name</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Zip</TableHead>
                  <TableHead className="text-right">Total Pairs</TableHead>
                  <TableHead className="text-right">Invoices</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : partners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">No partners found</TableCell>
                  </TableRow>
                ) : (
                  partners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell className="font-medium">{partner.name}</TableCell>
                      <TableCell>{partner.city || '-'}</TableCell>
                      <TableCell>{partner.state || '-'}</TableCell>
                      <TableCell>{partner.zip || '-'}</TableCell>
                      <TableCell className="text-right">{partner.pairs.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{partner.invoices}</TableCell>
                      <TableCell className="text-right">${partner.value.toLocaleString()}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
