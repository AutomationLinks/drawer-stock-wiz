import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

interface Partner {
  id: string;
  name: string;
  address_line_1?: string;
  city?: string;
  state?: string;
  postal_code: string;
  phone?: string;
  email?: string;
  latitude?: number;
  longitude?: number;
}

interface PartnerMapProps {
  partners: Partner[];
  selectedPartnerId?: string;
  onMarkerClick?: (partnerId: string) => void;
}

export const PartnerMap = ({ partners, selectedPartnerId, onMarkerClick }: PartnerMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const [mapboxToken, setMapboxToken] = useState("");
  const [showTokenInput, setShowTokenInput] = useState(true);

  useEffect(() => {
    // Check for token in localStorage first
    const savedToken = localStorage.getItem("mapbox_token");
    if (savedToken) {
      setMapboxToken(savedToken);
      setShowTokenInput(false);
      initializeMap(savedToken);
    }
  }, []);

  const initializeMap = (token: string) => {
    if (!mapContainer.current || map.current) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [-98.5795, 39.8283], // Center of USA
      zoom: 3.5,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    map.current.addControl(new mapboxgl.FullscreenControl(), "top-right");
  };

  const handleSaveToken = () => {
    if (mapboxToken) {
      localStorage.setItem("mapbox_token", mapboxToken);
      setShowTokenInput(false);
      initializeMap(mapboxToken);
    }
  };

  useEffect(() => {
    if (!map.current || !partners.length) return;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current.clear();

    // Add markers for partners with coordinates
    const bounds = new mapboxgl.LngLatBounds();
    let hasValidCoordinates = false;

    partners.forEach((partner) => {
      if (partner.latitude && partner.longitude) {
        hasValidCoordinates = true;

        const el = document.createElement("div");
        el.className = "custom-marker";
        el.innerHTML = `<div style="color: hsl(var(--primary)); cursor: pointer;">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor" stroke="white" stroke-width="1">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3" fill="white"></circle>
          </svg>
        </div>`;

        el.addEventListener("click", () => {
          onMarkerClick?.(partner.id);
        });

        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px;">
            <h3 style="font-weight: bold; margin-bottom: 4px;">${partner.name}</h3>
            ${partner.address_line_1 ? `<p style="font-size: 14px; margin: 2px 0;">${partner.address_line_1}</p>` : ""}
            ${partner.city && partner.state ? `<p style="font-size: 14px; margin: 2px 0;">${partner.city}, ${partner.state} ${partner.postal_code}</p>` : ""}
            ${partner.phone ? `<p style="font-size: 14px; margin: 2px 0;">📞 ${partner.phone}</p>` : ""}
            ${partner.email ? `<p style="font-size: 14px; margin: 2px 0;">✉️ ${partner.email}</p>` : ""}
          </div>
        `);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([partner.longitude, partner.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markers.current.set(partner.id, marker);
        bounds.extend([partner.longitude, partner.latitude]);
      }
    });

    // Fit map to show all markers
    if (hasValidCoordinates && partners.length > 0) {
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 12,
      });
    }
  }, [partners, onMarkerClick]);

  useEffect(() => {
    if (!map.current || !selectedPartnerId) return;

    const marker = markers.current.get(selectedPartnerId);
    if (marker) {
      const lngLat = marker.getLngLat();
      map.current.flyTo({
        center: lngLat,
        zoom: 12,
        duration: 1000,
      });
      marker.togglePopup();
    }
  }, [selectedPartnerId]);

  if (showTokenInput) {
    return (
      <div className="h-[500px] flex items-center justify-center bg-muted rounded-lg">
        <div className="max-w-md p-6 space-y-4 text-center">
          <MapPin className="h-12 w-12 mx-auto text-muted-foreground" />
          <div>
            <h3 className="text-lg font-semibold mb-2">Enable Interactive Map</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Enter your Mapbox Public Token to display partner locations on an interactive map.
            </p>
            <p className="text-xs text-muted-foreground mb-4">
              Get your free token at{" "}
              <a
                href="https://account.mapbox.com/access-tokens/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                mapbox.com
              </a>
            </p>
          </div>
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="pk.eyJ1Ij..."
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
            />
            <Button onClick={handleSaveToken} disabled={!mapboxToken} className="w-full">
              Save & Enable Map
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[500px] rounded-lg overflow-hidden shadow-lg">
      <div ref={mapContainer} className="absolute inset-0" />
    </div>
  );
};
