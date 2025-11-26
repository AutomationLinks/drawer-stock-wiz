import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { InventoryCategory } from "./InventoryCategory";
import { AddProductDialog } from "./AddProductDialog";
import { ImportInventoryButton } from "./ImportInventoryButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface InventoryItem {
  id: string;
  item_name: string;
  category: string;
  status: string;
  stock_on_hand: number;
  item_type: string;
  price_per_unit?: number;
}

export const InventoryDashboard = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchInventory();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('inventory-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'inventory'
        },
        () => {
          fetchInventory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = inventory.filter(item =>
        item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredInventory(filtered);
    } else {
      setFilteredInventory(inventory);
    }
  }, [searchQuery, inventory]);

  const fetchInventory = async () => {
    const { data, error } = await supabase
      .from('inventory')
      .select('*')
      .order('category', { ascending: true })
      .order('item_name', { ascending: true });

    if (error) {
      toast({
        title: "Error loading inventory",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setInventory(data || []);
    }
  };

  const exportToCSV = () => {
    const headers = ['Item Name', 'Category', 'Stock On Hand', 'Value Per Pair', 'Total Value'];
    const csvContent = [
      headers.join(','),
      ...filteredInventory.map(item => {
        const pricePerUnit = item.price_per_unit || 2.00;
        const totalValue = item.stock_on_hand * pricePerUnit;
        return [
          item.item_name,
          item.category,
          item.stock_on_hand,
          pricePerUnit.toFixed(2),
          totalValue.toFixed(2)
        ].join(',');
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };


  const groupedInventory = filteredInventory.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, InventoryItem[]>);

  return (
    <>
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <ImportInventoryButton onSuccess={fetchInventory} />
          <Button onClick={() => setIsAddDialogOpen(true)} className="bg-success hover:bg-success/90">
            <Plus className="h-4 w-4 mr-2" />
            Add Product
          </Button>
          <Button onClick={exportToCSV} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(groupedInventory).map(([category, items]) => (
          <InventoryCategory
            key={category}
            category={category}
            items={items}
            onUpdate={fetchInventory}
          />
        ))}
      </div>

      {filteredInventory.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">
            {searchQuery ? "No items found matching your search." : "No inventory items yet. Add your first product!"}
          </p>
        </div>
      )}

      <AddProductDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={fetchInventory}
      />
    </>
  );
};
