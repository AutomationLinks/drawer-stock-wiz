import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PartnerMap } from "@/components/PartnerMap";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, MapPin } from "lucide-react";

const INITIAL_DISPLAY_COUNT = 9;
const PARTNERS_PER_PAGE = 3;

interface Partner {
  id: string;
  name: string;
  address_line_1?: string;
  city?: string;
  state?: string;
  postal_code: string;
  latitude?: number;
  longitude?: number;
}

const EmbedPartners = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>();
  const [displayCount, setDisplayCount] = useState(INITIAL_DISPLAY_COUNT);

  // Reset display count when search term changes
  useEffect(() => {
    setDisplayCount(INITIAL_DISPLAY_COUNT);
  }, [searchTerm]);

  const { data: partners = [] } = useQuery({
    queryKey: ["partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("id, name, address_line_1, city, state, postal_code, latitude, longitude")
        .eq("active", true)
        .order("name");

      if (error) throw error;
      return data as Partner[];
    },
  });

  const filteredPartners = partners.filter((partner) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      partner.name.toLowerCase().includes(search) ||
      partner.city?.toLowerCase().includes(search) ||
      partner.state?.toLowerCase().includes(search) ||
      partner.postal_code.includes(search)
    );
  });

  const displayedPartners = searchTerm 
    ? filteredPartners 
    : filteredPartners.slice(0, displayCount);

  const hasMore = !searchTerm && displayCount < filteredPartners.length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Search Section */}
        <div className="space-y-3">
          <h1 className="text-2xl md:text-3xl font-bold text-center">
            Find a Distribution Partner Near You
          </h1>
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, city, state, or zip code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 text-base"
            />
          </div>
          {!searchTerm && (
            <p className="text-center text-sm text-muted-foreground">
              Showing {displayedPartners.length} of {filteredPartners.length} partners
            </p>
          )}
          {searchTerm && (
            <p className="text-center text-sm text-muted-foreground">
              Found {filteredPartners.length} partner{filteredPartners.length !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Map Section */}
        <div className="rounded-lg overflow-hidden shadow-lg">
          <PartnerMap
            partners={filteredPartners}
            selectedPartnerId={selectedPartnerId}
            onMarkerClick={setSelectedPartnerId}
            showContactInfo={false}
          />
        </div>

        {/* Partners List */}
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayedPartners.map((partner) => (
              <Card
                key={partner.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                  selectedPartnerId === partner.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedPartnerId(partner.id)}
              >
                <h3 className="font-semibold text-lg mb-2">{partner.name}</h3>
                
                {partner.address_line_1 && (
                  <div className="flex items-start gap-2 text-sm text-muted-foreground mb-1">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div>
                      <div>{partner.address_line_1}</div>
                      {partner.city && partner.state && (
                        <div>
                          {partner.city}, {partner.state} {partner.postal_code}
                        </div>
                      )}
                    </div>
                  </div>
                 )}
              </Card>
            ))}
          </div>

          {filteredPartners.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No partners found matching your search.
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center pt-4">
              <Button
                onClick={() => setDisplayCount(prev => prev + PARTNERS_PER_PAGE)}
                variant="outline"
                size="lg"
                className="gap-2"
              >
                <MapPin className="h-4 w-4" />
                Show {Math.min(PARTNERS_PER_PAGE, filteredPartners.length - displayCount)} More Partner{Math.min(PARTNERS_PER_PAGE, filteredPartners.length - displayCount) !== 1 ? 's' : ''}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmbedPartners;
