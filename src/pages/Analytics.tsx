import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Search, Download, DollarSign, Users, TrendingUp, Calendar } from "lucide-react";
import { format } from "date-fns";
import { SalesOrderAnalytics } from "@/components/SalesOrderAnalytics";
import { InvoiceAnalytics } from "@/components/InvoiceAnalytics";
import { InventoryAnalytics } from "@/components/InventoryAnalytics";
import { OutgoingDonationsReport } from "@/components/reports/OutgoingDonationsReport";
import { IncomingDonationsReport } from "@/components/reports/IncomingDonationsReport";
import { PartnerDistributionReport } from "@/components/reports/PartnerDistributionReport";

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

const Analytics = () => {
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch donations data
  const { data: donations = [] } = useQuery({
    queryKey: ['donations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Fetch page views data
  const { data: pageViews = [] } = useQuery({
    queryKey: ['page_views'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('page_views')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  // Calculate metrics
  const totalDonations = donations.reduce((sum, d) => sum + Number(d.total_amount || 0), 0);
  const averageDonation = donations.length > 0 ? totalDonations / donations.length : 0;
  const uniqueDonors = new Set(donations.map(d => d.email)).size;
  const totalPageViews = pageViews.length;
  const uniqueVisitors = new Set(pageViews.map(pv => pv.session_id)).size;

  // One-time vs recurring
  const oneTimeCount = donations.filter(d => d.frequency === 'one-time').length;
  const monthlyCount = donations.filter(d => d.frequency === 'monthly').length;
  const frequencyData = [
    { name: 'One-Time', value: oneTimeCount },
    { name: 'Monthly', value: monthlyCount },
  ];

  // Donations by campaign
  const campaignData = donations.reduce((acc, d) => {
    const campaign = d.campaign || 'Unknown';
    if (!acc[campaign]) {
      acc[campaign] = 0;
    }
    acc[campaign] += Number(d.total_amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const campaignChartData = Object.entries(campaignData).map(([name, value]) => ({
    name,
    amount: Number(value.toFixed(2)),
  }));

  // Donation trends over time (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return format(date, 'MM/dd');
  });

  const donationTrends = last30Days.map(date => {
    const dayDonations = donations.filter(d => {
      const donationDate = format(new Date(d.created_at), 'MM/dd');
      return donationDate === date;
    });
    const amount = dayDonations.reduce((sum, d) => sum + Number(d.total_amount || 0), 0);
    return { date, amount: Number(amount.toFixed(2)), count: dayDonations.length };
  });

  // Page views by URL
  const pageViewsByUrl = pageViews.reduce((acc, pv) => {
    const url = pv.page_url || 'Unknown';
    if (!acc[url]) {
      acc[url] = 0;
    }
    acc[url]++;
    return acc;
  }, {} as Record<string, number>);

  const pageViewsChartData = Object.entries(pageViewsByUrl)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, value]) => ({ name, views: value }));

  // Page views over time (last 30 days)
  const pageViewTrends = last30Days.map(date => {
    const dayViews = pageViews.filter(pv => {
      const viewDate = format(new Date(pv.created_at), 'MM/dd');
      return viewDate === date;
    });
    return { date, views: dayViews.length };
  });

  // Filter donors
  const filteredDonors = donations.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (d.organization && d.organization.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Export to CSV
  const exportToCsv = () => {
    const headers = ['Name', 'Email', 'Phone', 'Organization', 'Amount', 'Frequency', 'Campaign', 'Date'];
    const rows = donations.map(d => [
      d.name,
      d.email,
      d.phone,
      d.organization || '',
      d.total_amount,
      d.frequency,
      d.campaign,
      format(new Date(d.created_at), 'yyyy-MM-dd HH:mm:ss'),
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donors_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Track donations and website performance</p>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Donations</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${totalDonations.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{donations.length} donations received</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Donation</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${averageDonation.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Per donation</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unique Donors</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueDonors}</div>
              <p className="text-xs text-muted-foreground">Individual supporters</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Website Visitors</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueVisitors}</div>
              <p className="text-xs text-muted-foreground">{totalPageViews} total page views</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="donations" className="space-y-4">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="donations">Donations</TabsTrigger>
            <TabsTrigger value="sales-orders">Sales Orders</TabsTrigger>
            <TabsTrigger value="invoices">Invoices</TabsTrigger>
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="outgoing-report">Outgoing Report</TabsTrigger>
            <TabsTrigger value="incoming-report">Incoming Report</TabsTrigger>
            <TabsTrigger value="partner-report">Partner Report</TabsTrigger>
            <TabsTrigger value="traffic">Website Traffic</TabsTrigger>
            <TabsTrigger value="donors">Donor Management</TabsTrigger>
          </TabsList>

          {/* Donations Tab */}
          <TabsContent value="donations" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Donation Trends (Last 30 Days)</CardTitle>
                  <CardDescription>Daily donation amounts and count</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={donationTrends}>
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
                      <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" name="Amount ($)" />
                      <Line type="monotone" dataKey="count" stroke="hsl(var(--secondary))" name="Count" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Donations by Campaign</CardTitle>
                  <CardDescription>Total amount per campaign</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={campaignChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))' 
                        }} 
                      />
                      <Bar dataKey="amount" fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>One-Time vs Monthly</CardTitle>
                  <CardDescription>Distribution of donation frequency</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={frequencyData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="hsl(var(--primary))"
                        dataKey="value"
                      >
                        {frequencyData.map((entry, index) => (
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
                  <CardTitle>Recent Donations</CardTitle>
                  <CardDescription>Latest 5 donations</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {donations.slice(0, 5).map((donation) => (
                      <div key={donation.id} className="flex items-center justify-between border-b pb-2">
                        <div>
                          <p className="font-medium">{donation.name}</p>
                          <p className="text-sm text-muted-foreground">{donation.campaign}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">${Number(donation.total_amount).toFixed(2)}</p>
                          <p className="text-xs text-muted-foreground">{donation.frequency}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Sales Orders Tab */}
          <TabsContent value="sales-orders" className="space-y-4">
            <SalesOrderAnalytics />
          </TabsContent>

          {/* Invoices Tab */}
          <TabsContent value="invoices" className="space-y-4">
            <InvoiceAnalytics />
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-4">
            <InventoryAnalytics />
          </TabsContent>

          {/* Outgoing Donations Report Tab */}
          <TabsContent value="outgoing-report" className="space-y-4">
            <OutgoingDonationsReport />
          </TabsContent>

          {/* Incoming Donations Report Tab */}
          <TabsContent value="incoming-report" className="space-y-4">
            <IncomingDonationsReport />
          </TabsContent>

          {/* Partner Distribution Report Tab */}
          <TabsContent value="partner-report" className="space-y-4">
            <PartnerDistributionReport />
          </TabsContent>

          {/* Traffic Tab */}
          <TabsContent value="traffic" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Page Views Over Time (Last 30 Days)</CardTitle>
                  <CardDescription>Daily page view trends</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={pageViewTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))' 
                        }} 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="views" 
                        stroke="hsl(var(--primary))" 
                        fill="hsl(var(--primary) / 0.2)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top 10 Pages</CardTitle>
                  <CardDescription>Most visited pages</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={pageViewsChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={100} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))' 
                        }} 
                      />
                      <Bar dataKey="views" fill="hsl(var(--secondary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Donors Tab */}
          <TabsContent value="donors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Donor Database</CardTitle>
                <CardDescription>All donors and their donation history</CardDescription>
                <div className="flex gap-2 mt-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search donors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  <Button onClick={exportToCsv} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Campaign</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredDonors.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground">
                            No donors found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredDonors.map((donor) => (
                          <TableRow key={donor.id}>
                            <TableCell className="font-medium">{donor.name}</TableCell>
                            <TableCell>{donor.email}</TableCell>
                            <TableCell>{donor.phone}</TableCell>
                            <TableCell>{donor.organization || '-'}</TableCell>
                            <TableCell>${donor.total_amount}</TableCell>
                            <TableCell>{donor.frequency}</TableCell>
                            <TableCell>{donor.campaign}</TableCell>
                            <TableCell>{format(new Date(donor.created_at), 'MM/dd/yyyy')}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;