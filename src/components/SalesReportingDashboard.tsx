import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Package, DollarSign, TrendingUp, FileText } from "lucide-react";
import { format, subDays, startOfMonth } from "date-fns";

export const SalesReportingDashboard = () => {
  const [period, setPeriod] = useState("30");
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    avgOrderValue: 0,
    statusBreakdown: [] as { name: string; value: number }[],
  });
  const [revenueData, setRevenueData] = useState<{ date: string; revenue: number }[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const fetchDashboardData = async () => {
    const startDate = getStartDate();
    
    const { data: orders } = await supabase
      .from("sales_orders")
      .select("*")
      .gte("order_date", startDate);

    if (orders) {
      const totalOrders = orders.length;
      const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

      const statusCounts = orders.reduce((acc, order) => {
        acc[order.order_status] = (acc[order.order_status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusBreakdown = Object.entries(statusCounts).map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));

      setStats({ totalOrders, totalRevenue, avgOrderValue, statusBreakdown });

      // Group revenue by date
      const revenueByDate = orders.reduce((acc, order) => {
        const date = order.order_date;
        acc[date] = (acc[date] || 0) + Number(order.total);
        return acc;
      }, {} as Record<string, number>);

      const revenueData = Object.entries(revenueByDate)
        .map(([date, revenue]) => ({ date: format(new Date(date), "MMM dd"), revenue }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setRevenueData(revenueData);
    }
  };

  const getStartDate = () => {
    const today = new Date();
    switch (period) {
      case "7": return format(subDays(today, 7), "yyyy-MM-dd");
      case "14": return format(subDays(today, 14), "yyyy-MM-dd");
      case "30": return format(subDays(today, 30), "yyyy-MM-dd");
      case "mtd": return format(startOfMonth(today), "yyyy-MM-dd");
      default: return format(subDays(today, 30), "yyyy-MM-dd");
    }
  };

  const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "hsl(var(--muted))"];

  return (
    <div className="space-y-6 mb-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Sales Overview</h2>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 Days</SelectItem>
            <SelectItem value="14">Last 14 Days</SelectItem>
            <SelectItem value="30">Last 30 Days</SelectItem>
            <SelectItem value="mtd">Month to Date</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.avgOrderValue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.statusBreakdown.find(s => s.name === "Open")?.value || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.statusBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {stats.statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
