import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CalendarIcon, Download, Package, Building, TrendingUp } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { cn } from "@/lib/utils";

export const IncomingDonationsReport = () => {
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 30));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  // Fetch incoming donations with items
  const { data: donations = [], isLoading } = useQuery({
    queryKey: ['incoming_donations_report', startDate, endDate],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('incoming_donations')
        .select(`
          *,
          customers(customer_name),
          incoming_donation_items(id, item_name, quantity)
        `)
        .gte('donation_date', format(startDate, 'yyyy-MM-dd'))
        .lte('donation_date', format(endDate, 'yyyy-MM-dd'))
        .order('donation_date', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Get unique companies for filter
  const uniqueCompanies = [...new Set(donations.map(d => d.customers?.customer_name).filter(Boolean))].sort();

  // Apply filters
  const filteredDonations = donations.filter(donation => {
    if (companyFilter !== "all" && donation.customers?.customer_name !== companyFilter) return false;
    return true;
  });

  // Calculate metrics
  const totalPairs = filteredDonations.reduce((sum, d) => {
    return sum + (d.incoming_donation_items?.reduce((s, item) => s + Number(item.quantity || 0), 0) || 0);
  }, 0);
  
  const totalDonations = filteredDonations.length;
  const uniqueCompaniesCount = new Set(filteredDonations.map(d => d.company_id).filter(Boolean)).size;
  const avgPairsPerDonation = totalDonations > 0 ? totalPairs / totalDonations : 0;

  // Trend data
  const trendData = filteredDonations.reduce((acc, d) => {
    const date = format(new Date(d.donation_date), 'MM/dd');
    const pairs = d.incoming_donation_items?.reduce((s, item) => s + Number(item.quantity || 0), 0) || 0;
    
    if (!acc[date]) {
      acc[date] = { date, pairs: 0, donations: 0 };
    }
    acc[date].pairs += pairs;
    acc[date].donations += 1;
    return acc;
  }, {} as Record<string, { date: string; pairs: number; donations: number }>);

  const chartData = Object.values(trendData).sort((a, b) => a.date.localeCompare(b.date));

  // By company data
  const byCompanyData = filteredDonations.reduce((acc, d) => {
    const company = d.customers?.customer_name || 'Unknown';
    const pairs = d.incoming_donation_items?.reduce((s, item) => s + Number(item.quantity || 0), 0) || 0;
    
    if (!acc[company]) {
      acc[company] = { company, pairs: 0, donations: 0 };
    }
    acc[company].pairs += pairs;
    acc[company].donations += 1;
    return acc;
  }, {} as Record<string, { company: string; pairs: number; donations: number }>);

  const companyChartData = Object.values(byCompanyData).sort((a, b) => b.pairs - a.pairs).slice(0, 10);

  // Export to CSV
  const exportToCsv = () => {
    const headers = ['Date', 'Company', 'Items', 'Total Pairs', 'Notes'];
    const rows = filteredDonations.map(d => {
      const pairs = d.incoming_donation_items?.reduce((s, item) => s + Number(item.quantity || 0), 0) || 0;
      const items = d.incoming_donation_items?.map(item => `${item.item_name} (${item.quantity})`).join('; ') || '';
      return [
        format(new Date(d.donation_date), 'yyyy-MM-dd'),
        d.customers?.customer_name || '',
        items,
        pairs,
        d.notes || ''
      ];
    });

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incoming_donations_${format(startDate, 'yyyy-MM-dd')}_to_${format(endDate, 'yyyy-MM-dd')}.csv`;
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
          <CardTitle>Incoming Donations Report</CardTitle>
          <CardDescription>Pairs received from companies/donors</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <Button variant="outline" size="sm" onClick={() => setDatePreset('7days')}>Last 7 Days</Button>
            <Button variant="outline" size="sm" onClick={() => setDatePreset('30days')}>Last 30 Days</Button>
            <Button variant="outline" size="sm" onClick={() => setDatePreset('thisMonth')}>This Month</Button>
            <Button variant="outline" size="sm" onClick={() => setDatePreset('lastMonth')}>Last Month</Button>
            <Button variant="outline" size="sm" onClick={() => setDatePreset('thisYear')}>This Year</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label>Company</Label>
              <Select value={companyFilter} onValueChange={setCompanyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Companies" />
                </SelectTrigger>
                <SelectContent className="bg-popover max-h-[200px]">
                  <SelectItem value="all">All Companies</SelectItem>
                  {uniqueCompanies.map(company => (
                    <SelectItem key={company} value={company || ''}>{company}</SelectItem>
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
            <CardTitle className="text-sm font-medium">Total Pairs Received</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPairs.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalDonations}</div>
            <p className="text-xs text-muted-foreground">Donation records</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Companies</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{uniqueCompaniesCount}</div>
            <p className="text-xs text-muted-foreground">Donating companies</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Pairs/Donation</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPairsPerDonation.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Per donation</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Pairs Received Over Time</CardTitle>
            <CardDescription>Daily incoming donations</CardDescription>
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
            <CardTitle>Top 10 Companies by Pairs</CardTitle>
            <CardDescription>Largest donors</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={companyChartData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="company" type="category" stroke="hsl(var(--muted-foreground))" width={120} />
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
            <CardTitle>Donation Details</CardTitle>
            <CardDescription>All incoming donations in selected period</CardDescription>
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
                  <TableHead>Date</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Total Pairs</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : filteredDonations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">No donations found</TableCell>
                  </TableRow>
                ) : (
                  filteredDonations.map((donation) => {
                    const pairs = donation.incoming_donation_items?.reduce((s, item) => s + Number(item.quantity || 0), 0) || 0;
                    const itemsList = donation.incoming_donation_items?.map(item => `${item.item_name} (${item.quantity})`).join(', ') || '-';
                    return (
                      <TableRow key={donation.id}>
                        <TableCell>{format(new Date(donation.donation_date), 'MM/dd/yyyy')}</TableCell>
                        <TableCell className="font-medium">{donation.customers?.customer_name || '-'}</TableCell>
                        <TableCell className="max-w-[300px] truncate" title={itemsList}>{itemsList}</TableCell>
                        <TableCell className="text-right">{pairs.toLocaleString()}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{donation.notes || '-'}</TableCell>
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
