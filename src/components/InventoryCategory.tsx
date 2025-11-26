import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { InventoryRow } from "./InventoryRow";
import { Card } from "@/components/ui/card";

interface InventoryItem {
  id: string;
  item_name: string;
  category: string;
  status: string;
  stock_on_hand: number;
  item_type: string;
  price_per_unit?: number;
}

interface InventoryCategoryProps {
  category: string;
  items: InventoryItem[];
  onUpdate: () => void;
}

export const InventoryCategory = ({ category, items, onUpdate }: InventoryCategoryProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const categoryTotal = items.reduce((sum, item) => sum + Number(item.stock_on_hand), 0);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between bg-secondary hover:bg-secondary/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isExpanded ? (
            <ChevronDown className="h-5 w-5 text-primary" />
          ) : (
            <ChevronRight className="h-5 w-5 text-primary" />
          )}
          <h2 className="text-xl font-semibold text-foreground capitalize">{category}</h2>
          <span className="text-sm text-muted-foreground">
            ({items.length} {items.length === 1 ? 'item' : 'items'})
          </span>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-muted-foreground">Total: </span>
          <span className="text-lg font-bold text-primary">{categoryTotal.toLocaleString()}</span>
        </div>
      </button>

      {isExpanded && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Item Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Stock on Hand
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Stock Value Per Pair
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {items.map((item, index) => (
                <InventoryRow
                  key={item.id}
                  item={item}
                  isEven={index % 2 === 0}
                  onUpdate={onUpdate}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
