import { useState } from "react";
import { Button } from "@/components/ui/button";
import { MapPin, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { geocodeAllPartners } from "@/utils/geocodePartners";
import { Progress } from "@/components/ui/progress";

interface GeocodePartnersButtonProps {
  onComplete: () => void;
}

export const GeocodePartnersButton = ({ onComplete }: GeocodePartnersButtonProps) => {
  const { toast } = useToast();
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, name: "" });

  const handleGeocode = async () => {
    setIsGeocoding(true);
    setProgress({ current: 0, total: 0, name: "" });

    try {
      const result = await geocodeAllPartners((current, total, name) => {
        setProgress({ current, total, name });
      });

      toast({
        title: "Geocoding Complete",
        description: `✅ ${result.success} partners geocoded, ❌ ${result.failed} failed, ⏭️ ${result.skipped} skipped`,
      });

      onComplete();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to geocode partners",
        variant: "destructive",
      });
    } finally {
      setIsGeocoding(false);
      setProgress({ current: 0, total: 0, name: "" });
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleGeocode}
        variant="outline"
        disabled={isGeocoding}
        className="gap-2"
      >
        {isGeocoding ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Geocoding...
          </>
        ) : (
          <>
            <MapPin className="h-4 w-4" />
            Geocode Partners
          </>
        )}
      </Button>
      
      {isGeocoding && progress.total > 0 && (
        <div className="space-y-1">
          <Progress value={(progress.current / progress.total) * 100} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {progress.current} of {progress.total}: {progress.name}
          </p>
        </div>
      )}
    </div>
  );
};
