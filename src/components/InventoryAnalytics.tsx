import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Package, TrendingDown, TrendingUp, AlertTriangle, Download } from "lucide-react";
import { format } from "date-fns";

const COLORS = [
  'hsl(207, 79%, 39%)',   // brand blue
  'hsl(25, 85%, 55%)',    // orange
  'hsl(170, 60%, 40%)',   // teal
  'hsl(45, 90%, 50%)',    // amber
  'hsl(340, 70%, 50%)',   // rose
  'hsl(260, 60%, 55%)',   // purple
];

export const InventoryAnalytics = () => {
  const [excludeNegatives, setExcludeNegatives] = useState(false);
  const [genderFilter, setGenderFilter] = useState<"all" | "mens" | "womens" | "kids">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory_analytics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .eq('status', 'Active')
        .order('category');
      if (error) throw error;
      return data;
    },
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ['inventory_transactions_analytics'],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data, error } = await supabase
        .from('inventory_transactions')
        .select('*')
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // Calculate metrics
  const totalStock = inventory.reduce((sum, item) => sum + Number(item.stock_on_hand || 0), 0);
  const lowStockItems = inventory.filter(item => Number(item.stock_on_hand) < 100).length;

  const additions = transactions.filter(t => Number(t.quantity_change) > 0);
  const removals = transactions.filter(t => Number(t.quantity_change) < 0);
  const totalAdditions = additions.reduce((sum, t) => sum + Number(t.quantity_change), 0);
  const totalRemovals = Math.abs(removals.reduce((sum, t) => sum + Number(t.quantity_change), 0));

  // Stock by category
  const categoryStock = inventory.reduce((acc, item) => {
    const category = item.category || 'Unknown';
    if (!acc[category]) acc[category] = 0;
    acc[category] += Number(item.stock_on_hand || 0);
    return acc;
  }, {} as Record<string, number>);

  const categoryData = Object.entries(categoryStock)
    .map(([name, stock]) => ({ name, stock }))
    .sort((a, b) => b.stock - a.stock);

  // Transactions over time (last 30 days)
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - i));
    return format(date, 'MM/dd');
  });

  const transactionTrends = last30Days.map(date => {
    const dayTransactions = transactions.filter(t => {
      const transDate = format(new Date(t.created_at), 'MM/dd');
      return transDate === date;
    });
    const added = dayTransactions
      .filter(t => Number(t.quantity_change) > 0)
      .reduce((sum, t) => sum + Number(t.quantity_change), 0);
    const removed = Math.abs(dayTransactions
      .filter(t => Number(t.quantity_change) < 0)
      .reduce((sum, t) => sum + Number(t.quantity_change), 0));
    return { date, added, removed };
  });

  // Transaction types breakdown
  const transactionTypes = transactions.reduce((acc, t) => {
    const type = t.transaction_type || 'unknown';
    if (!acc[type]) acc[type] = 0;
    acc[type]++;
    return acc;
  }, {} as Record<string, number>);

  const typeData = Object.entries(transactionTypes)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  // Top moving items (most transactions)
  const itemActivity = transactions.reduce((acc, t) => {
    const itemName = t.item_name || 'Unknown';
    if (!acc[itemName]) acc[itemName] = 0;
    acc[itemName] += Math.abs(Number(t.quantity_change));
    return acc;
  }, {} as Record<string, number>);

  const topMovingItems = Object.entries(itemActivity)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([name, quantity]) => ({ name, quantity }));

  // Unique categories for filter buttons
  const uniqueCategories = [...new Set(inventory.map(item => item.category))].sort();

  // Top 10 lowest stock items with filters
  const lowestStockItems = [...inventory]
    .filter(item => {
      if (excludeNegatives && Number(item.stock_on_hand) <= 0) return false;
      if (genderFilter !== "all") {
        const name = item.item_name.toLowerCase();
        if (genderFilter === "mens" && !(/\bmens?\b/.test(name) || name.includes("men "))) return false;
        if (genderFilter === "womens" && !(/\bwomens?\b/.test(name) || name.includes("women "))) return false;
        if (genderFilter === "kids" && !(/(boys?|girls?|kids?|youth)/i.test(name))) return false;
      }
      if (categoryFilter !== "all" && item.category !== categoryFilter) return false;
      return true;
    })
    .sort((a, b) => Number(a.stock_on_hand) - Number(b.stock_on_hand))
    .slice(0, 10)
    .map(item => ({
      name: item.item_name,
      stock: Number(item.stock_on_hand),
      category: item.category,
    }));

  const downloadLowestStockCSV = () => {
    const headers = ['Item Name', 'Category', 'Stock On Hand'];
    const rows = lowestStockItems.map(item => [item.name, item.category, item.stock]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lowest-stock-items-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tooltipStyle = {
    backgroundColor: 'hsl(var(--card))',
    border: '1px solid hsl(var(--border))',
    color: 'hsl(var(--card-foreground))',
  };

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStock}</div>
            <p className="text-xs text-muted-foreground">{inventory.length} unique items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Added (30d)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAdditions}</div>
            <p className="text-xs text-muted-foreground">{additions.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Removed (30d)</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRemovals}</div>
            <p className="text-xs text-muted-foreground">{removals.length} transactions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">Below 100 pairs</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Stock Changes (Last 30 Days)</CardTitle>
            <CardDescription>Additions vs removals over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={transactionTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
                <Area type="monotone" dataKey="added" stroke={COLORS[0]} fill="hsla(207, 79%, 39%, 0.2)" name="Added" />
                <Area type="monotone" dataKey="removed" stroke={COLORS[1]} fill="hsla(25, 85%, 55%, 0.2)" name="Removed" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock by Category</CardTitle>
            <CardDescription>Current inventory distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="stock" fill={COLORS[0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Transaction Types</CardTitle>
            <CardDescription>Breakdown by transaction type</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill={COLORS[0]}
                  dataKey="value"
                >
                  {typeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 10 Moving Items</CardTitle>
            <CardDescription>Most active inventory items</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topMovingItems} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={120} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="quantity" fill={COLORS[2]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top 10 Lowest Stock Items */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Top 10 Lowest Stock Items</CardTitle>
                <CardDescription>Items with the least inventory on hand</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={downloadLowestStockCSV}>
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
            </div>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4 pt-3 border-t mt-3">
              <div className="flex items-center gap-2">
                <Switch id="exclude-neg" checked={excludeNegatives} onCheckedChange={setExcludeNegatives} />
                <Label htmlFor="exclude-neg" className="text-sm">Exclude negatives</Label>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground mr-1">Gender:</span>
                {(["all", "mens", "womens", "kids"] as const).map(g => (
                  <Button key={g} size="sm" variant={genderFilter === g ? "default" : "outline"} onClick={() => setGenderFilter(g)} className="capitalize">
                    {g === "all" ? "All" : g === "mens" ? "Men" : g === "womens" ? "Women" : "Kids"}
                  </Button>
                ))}
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-sm text-muted-foreground mr-1">Category:</span>
                <Button size="sm" variant={categoryFilter === "all" ? "default" : "outline"} onClick={() => setCategoryFilter("all")}>All</Button>
                {uniqueCategories.map(cat => (
                  <Button key={cat} size="sm" variant={categoryFilter === cat ? "default" : "outline"} onClick={() => setCategoryFilter(cat)}>{cat}</Button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={lowestStockItems} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="name" type="category" stroke="hsl(var(--muted-foreground))" width={120} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="stock" name="Stock On Hand">
                    {lowestStockItems.map((item, index) => (
                      <Cell
                        key={`low-${index}`}
                        fill={item.stock < 100 ? 'hsl(0, 70%, 50%)' : 'hsl(45, 90%, 50%)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>

              <div className="overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Stock</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lowestStockItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell className={`text-right font-bold ${item.stock < 100 ? 'text-destructive' : ''}`}>
                          {item.stock}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
