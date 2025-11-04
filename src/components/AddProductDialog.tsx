import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const AddProductDialog = ({ open, onOpenChange, onSuccess }: AddProductDialogProps) => {
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [unit, setUnit] = useState("pairs");
  const [openingStock, setOpeningStock] = useState("0");
  const [stockOnHand, setStockOnHand] = useState("0");
  const [price, setPrice] = useState(2.00);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Auto-set price based on category or item name
  useState(() => {
    if (category.toLowerCase().includes('bombas') || itemName.toLowerCase().includes('bombas')) {
      setPrice(10.00);
    } else {
      setPrice(2.00);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const { error } = await supabase
      .from('inventory')
      .insert({
        item_name: itemName,
        category: category,
        unit: unit,
        opening_stock: parseFloat(openingStock),
        stock_on_hand: parseFloat(stockOnHand),
        status: 'Active',
        item_type: 'Inventory',
        price_per_unit: price
      });

    setIsSubmitting(false);

    if (error) {
      toast({
        title: "Error adding product",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Product added",
        description: `${itemName} has been added to inventory`,
      });
      // Reset form
      setItemName("");
      setCategory("");
      setUnit("pairs");
      setOpeningStock("0");
      setStockOnHand("0");
      setPrice(2.00);
      onOpenChange(false);
      onSuccess();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Add a new item to your inventory. Fill in all the required fields.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="itemName">Item Name *</Label>
              <Input
                id="itemName"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g., Mens Socks"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category *</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Socks, Underwear, Tees and Tanks"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pairs"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="openingStock">Opening Stock</Label>
              <Input
                id="openingStock"
                type="number"
                value={openingStock}
                onChange={(e) => setOpeningStock(e.target.value)}
                min="0"
                step="1"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stockOnHand">Stock on Hand *</Label>
              <Input
                id="stockOnHand"
                type="number"
                value={stockOnHand}
                onChange={(e) => setStockOnHand(e.target.value)}
                min="0"
                step="1"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Price Per Unit *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(parseFloat(e.target.value) || 2.00)}
                min="0"
                required
              />
              <p className="text-xs text-muted-foreground">
                Default: $2.00 for normal items, $10.00 for Bombas items
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-success hover:bg-success/90">
              {isSubmitting ? "Adding..." : "Add Product"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
