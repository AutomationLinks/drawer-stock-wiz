import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { PartnerMap } from "@/components/PartnerMap";
import { PartnersTable } from "@/components/PartnersTable";
import { PartnerDialog } from "@/components/PartnerDialog";
import { ImportPartnersButton } from "@/components/ImportPartnersButton";
import { GeocodePartnersButton } from "@/components/GeocodePartnersButton";

const PartnerLocations = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [zipFilter, setZipFilter] = useState("");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | undefined>();
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: partners = [], isLoading, refetch } = useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Partner Locations</h1>
              <p className="text-muted-foreground mt-1">
                View and manage distribution partner locations
              </p>
            </div>
            <div className="flex gap-2">
              <GeocodePartnersButton onComplete={() => refetch()} />
              <ImportPartnersButton />
              <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Partner
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-[500px]">
              <p className="text-muted-foreground">Loading partners...</p>
            </div>
          ) : (
            <>
              <PartnerMap
                partners={partners}
                selectedPartnerId={selectedPartnerId}
                onMarkerClick={setSelectedPartnerId}
              />

              <PartnersTable
                partners={partners}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                zipFilter={zipFilter}
                onZipFilterChange={setZipFilter}
                onRowClick={setSelectedPartnerId}
                selectedPartnerId={selectedPartnerId}
              />
            </>
          )}
        </div>
      </main>

      <PartnerDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />
    </div>
  );
};

export default PartnerLocations;
