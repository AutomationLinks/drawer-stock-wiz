import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PartnerMap } from "@/components/PartnerMap";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, MapPin, Phone, Mail } from "lucide-react";

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

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Map Section */}
        <div className="rounded-lg overflow-hidden shadow-lg">
          <PartnerMap
            partners={filteredPartners}
            selectedPartnerId={selectedPartnerId}
            onMarkerClick={setSelectedPartnerId}
            showContactInfo={false}
          />
        </div>

        {/* Search and Partners List */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search partners by name, city, state, or zip..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredPartners.map((partner) => (
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
        </div>
      </div>
    </div>
  );
};

export default EmbedPartners;
