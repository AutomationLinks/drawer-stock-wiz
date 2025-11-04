import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { DonorsTable } from "@/components/DonorsTable";
import { DonorDialog } from "@/components/DonorDialog";
import { ImportDonorsButton } from "@/components/ImportDonorsButton";
import { DonorAnalytics } from "@/components/DonorAnalytics";

const DonorInformation = () => {
  const [showTestDonations, setShowTestDonations] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: donations = [], refetch } = useQuery({
    queryKey: ['donor-analytics', showTestDonations],
    queryFn: async () => {
      let query = supabase
        .from('donations')
        .select('*')
        .order('created_at', { ascending: false });

      if (!showTestDonations) {
        query = query.eq('is_test_mode', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Donor Management System</h1>
            <p className="text-muted-foreground">
              Manage and track all donor information and donations
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Donor
            </Button>
            <ImportDonorsButton />
          </div>
        </div>

        {/* Test Mode Toggle */}
        <div className="flex items-center space-x-2 p-4 bg-card rounded-lg border">
          <Checkbox
            id="show-test"
            checked={showTestDonations}
            onCheckedChange={(checked) => setShowTestDonations(checked as boolean)}
          />
          <Label htmlFor="show-test" className="cursor-pointer">
            Show Test Donations
          </Label>
        </div>

        {/* Analytics */}
        <DonorAnalytics donations={donations} />

        {/* Donors Table */}
        <div className="bg-card rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">All Donors</h2>
          <DonorsTable showTestDonations={showTestDonations} />
        </div>
      </div>

      <DonorDialog
        donor={null}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSave={refetch}
      />
    </div>
  );
};

export default DonorInformation;
