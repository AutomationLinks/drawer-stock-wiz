import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Heart } from "lucide-react";

export const DonationCounter = () => {
  const { data: totalDonations, isLoading } = useQuery({
    queryKey: ["total-donations"],
    queryFn: async () => {
      // Get all removal transactions since 2017 (when the org started)
      const { data, error } = await supabase
        .from("inventory_transactions")
        .select("quantity_change")
        .eq("transaction_type", "removal")
        .gte("created_at", "2017-01-01");

      if (error) throw error;

      // Sum up all the removals (donations)
      const total = data.reduce((sum, transaction) => {
        return sum + Math.abs(Number(transaction.quantity_change));
      }, 0);

      return total;
    },
    // Refetch every 30 seconds to keep it updated
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <Card className="p-6 mb-6 bg-gradient-to-r from-primary/10 to-pink-500/10 border-primary/20">
        <div className="flex items-center justify-center gap-4">
          <Heart className="h-8 w-8 text-primary animate-pulse" />
          <div className="text-center">
            <p className="text-sm text-muted-foreground font-medium">Loading...</p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 mb-6 bg-gradient-to-r from-primary/10 to-pink-500/10 border-primary/20">
      <div className="flex items-center justify-center gap-4">
        <Heart className="h-8 w-8 text-primary fill-primary" />
        <div className="text-center">
          <p className="text-sm text-muted-foreground font-medium">Pairs Donated Since 2017</p>
          <p className="text-4xl font-bold text-primary">
            {(totalDonations || 0).toLocaleString()}
          </p>
        </div>
      </div>
    </Card>
  );
};
