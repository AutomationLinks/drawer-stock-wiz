import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Minus, Trash2, Edit2, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface InventoryItem {
  id: string;
  item_name: string;
  category: string;
  status: string;
  unit: string;
  opening_stock: number;
  stock_on_hand: number;
  item_type: string;
}

interface InventoryRowProps {
  item: InventoryItem;
  isEven: boolean;
  onUpdate: () => void;
}

export const InventoryRow = ({ item, isEven, onUpdate }: InventoryRowProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [stockValue, setStockValue] = useState(item.stock_on_hand.toString());
  const { toast } = useToast();

  const updateStock = async (newStock: number) => {
    const { error } = await supabase
      .from('inventory')
      .update({ stock_on_hand: newStock })
      .eq('id', item.id);

    if (error) {
      toast({
        title: "Error updating stock",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Stock updated",
        description: `${item.item_name} stock updated successfully`,
      });
      onUpdate();
    }
  };

  const handleIncrement = () => {
    updateStock(Number(item.stock_on_hand) + 1);
  };

  const handleDecrement = () => {
    if (Number(item.stock_on_hand) > 0) {
      updateStock(Number(item.stock_on_hand) - 1);
    }
  };

  const handleSaveEdit = () => {
    const newValue = parseInt(stockValue);
    if (!isNaN(newValue) && newValue >= 0) {
      updateStock(newValue);
      setIsEditing(false);
    } else {
      toast({
        title: "Invalid value",
        description: "Please enter a valid number",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setStockValue(item.stock_on_hand.toString());
    setIsEditing(false);
  };

  const handleDelete = async () => {
    const { error } = await supabase
      .from('inventory')
      .delete()
      .eq('id', item.id);

    if (error) {
      toast({
        title: "Error deleting item",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Item deleted",
        description: `${item.item_name} has been removed from inventory`,
      });
      onUpdate();
    }
  };

  return (
    <tr className={isEven ? "bg-card" : "bg-muted/30"}>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm font-medium text-foreground">{item.item_name}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-muted-foreground">{item.unit}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-muted-foreground">{Number(item.opening_stock).toLocaleString()}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={stockValue}
              onChange={(e) => setStockValue(e.target.value)}
              className="w-24"
              min="0"
            />
            <Button size="sm" onClick={handleSaveEdit} className="bg-success hover:bg-success/90">
              <Check className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={handleCancelEdit}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-foreground min-w-[60px]">
              {Number(item.stock_on_hand).toLocaleString()}
            </span>
            <Button
              size="sm"
              onClick={handleDecrement}
              variant="outline"
              className="h-8 w-8 p-0"
              disabled={Number(item.stock_on_hand) <= 0}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              onClick={handleIncrement}
              className="h-8 w-8 p-0 bg-success hover:bg-success/90"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className="h-8 w-8 p-0"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Item</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {item.item_name}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </td>
    </tr>
  );
};
