import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Package } from "lucide-react";
import { format, parseISO } from "date-fns";
import { RecordIncomingDonationDialog } from "@/components/RecordIncomingDonationDialog";

const IncomingDonations = () => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: donations, isLoading, refetch } = useQuery({
    queryKey: ["incoming-donations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("incoming_donations")
        .select(`
          *,
          customers(customer_name),
          incoming_donation_items(quantity)
        `)
        .order("donation_date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Incoming Donations</h1>
            <p className="text-muted-foreground mt-1">
              Track goods donated TO The Drawer by companies
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Record Donation
          </Button>
        </div>

        <Card className="p-6">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading donations...
            </div>
          ) : donations && donations.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Total Items</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donations.map((donation: any) => {
                    const totalQuantity = donation.incoming_donation_items?.reduce(
                      (sum: number, item: any) => sum + Number(item.quantity),
                      0
                    ) || 0;
                    
                    return (
                      <TableRow key={donation.id}>
                        <TableCell>
                          {format(parseISO(donation.donation_date), "MMM dd, yyyy")}
                        </TableCell>
                        <TableCell className="font-medium">
                          {donation.customers?.customer_name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            {totalQuantity} items
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {donation.notes || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No donations recorded yet</h3>
              <p className="text-muted-foreground mb-4">
                Start tracking goods donated to your organization
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Record First Donation
              </Button>
            </div>
          )}
        </Card>
      </div>

      <RecordIncomingDonationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={refetch}
      />
    </div>
  );
};

export default IncomingDonations;
