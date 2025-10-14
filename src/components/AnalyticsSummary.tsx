import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Package, AlertCircle } from "lucide-react";

interface CategoryStats {
  category: string;
  total_additions: number;
  total_removals: number;
  net_change: number;
  current_stock: number;
}

export const AnalyticsSummary = () => {
  const [stats, setStats] = useState<CategoryStats[]>([]);
  const [totalStats, setTotalStats] = useState({
    additions: 0,
    removals: 0,
    net_change: 0,
    current_total: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    
    // Get date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Fetch transactions from last 30 days
    const { data: transactions } = await supabase
      .from('inventory_transactions')
      .select('category, quantity_change, transaction_type')
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Fetch current inventory totals
    const { data: inventory } = await supabase
      .from('inventory')
      .select('category, stock_on_hand');

    if (transactions && inventory) {
      // Group by category
      const categoryMap = new Map<string, CategoryStats>();

      // Calculate transaction stats
      transactions.forEach(t => {
        if (!categoryMap.has(t.category)) {
          categoryMap.set(t.category, {
            category: t.category,
            total_additions: 0,
            total_removals: 0,
            net_change: 0,
            current_stock: 0
          });
        }

        const stats = categoryMap.get(t.category)!;
        const change = Number(t.quantity_change);
        
        if (change > 0) {
          stats.total_additions += change;
        } else {
          stats.total_removals += Math.abs(change);
        }
        stats.net_change += change;
      });

      // Add current stock totals
      inventory.forEach(item => {
        const existing = categoryMap.get(item.category);
        if (existing) {
          existing.current_stock += Number(item.stock_on_hand);
        } else {
          categoryMap.set(item.category, {
            category: item.category,
            total_additions: 0,
            total_removals: 0,
            net_change: 0,
            current_stock: Number(item.stock_on_hand)
          });
        }
      });

      const categoryStats = Array.from(categoryMap.values());
      setStats(categoryStats);

      // Calculate totals
      const totals = categoryStats.reduce(
        (acc, stat) => ({
          additions: acc.additions + stat.total_additions,
          removals: acc.removals + stat.total_removals,
          net_change: acc.net_change + stat.net_change,
          current_total: acc.current_total + stat.current_stock
        }),
        { additions: 0, removals: 0, net_change: 0, current_total: 0 }
      );
      setTotalStats(totals);
    }

    setIsLoading(false);
  };

  if (isLoading) {
    return (
      <Card className="p-6 mb-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 mb-6">
      <Card className="p-6 bg-gradient-to-br from-primary/5 to-success/5 border-primary/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">30-Day Analytics Summary</h2>
          <AlertCircle className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-card p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Current Stock</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{totalStats.current_total.toLocaleString()}</p>
          </div>

          <div className="bg-card p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-success" />
              <span className="text-sm font-medium text-muted-foreground">Added</span>
            </div>
            <p className="text-3xl font-bold text-success">+{totalStats.additions.toLocaleString()}</p>
          </div>

          <div className="bg-card p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-5 w-5 text-destructive" />
              <span className="text-sm font-medium text-muted-foreground">Removed</span>
            </div>
            <p className="text-3xl font-bold text-destructive">-{totalStats.removals.toLocaleString()}</p>
          </div>

          <div className="bg-card p-4 rounded-lg border border-border">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">Net Change</span>
            </div>
            <p className={`text-3xl font-bold ${totalStats.net_change >= 0 ? 'text-success' : 'text-destructive'}`}>
              {totalStats.net_change >= 0 ? '+' : ''}{totalStats.net_change.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <h3 className="text-lg font-semibold mb-4 text-foreground">By Category</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map(stat => (
              <div key={stat.category} className="bg-card p-4 rounded-lg border border-border">
                <h4 className="font-semibold text-foreground mb-2 capitalize">{stat.category}</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Current:</span>
                    <span className="font-medium text-foreground">{stat.current_stock.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Added:</span>
                    <span className="text-success">+{stat.total_additions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Removed:</span>
                    <span className="text-destructive">-{stat.total_removals.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border">
                    <span className="text-muted-foreground">Net:</span>
                    <span className={`font-semibold ${stat.net_change >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {stat.net_change >= 0 ? '+' : ''}{stat.net_change.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
