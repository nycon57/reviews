"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Map as LeafletMap, DivIcon, PointExpression } from "leaflet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Star, MapPin, Phone, Map } from "lucide-react";
import type { DirectoryLoanOfficer } from "@/lib/directory/actions";

// Dynamically import map components to avoid SSR issues
const MapContainer = dynamic(
  () => import("react-leaflet").then((mod) => mod.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((mod) => mod.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((mod) => mod.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((mod) => mod.Popup),
  { ssr: false }
);

// Import clustering support
const MarkerClusterGroup = dynamic(
  () => import("react-leaflet-cluster").then((mod) => mod.default),
  { ssr: false }
);

interface DirectoryMapViewProps {
  loanOfficers: DirectoryLoanOfficer[];
  onSelectOfficer?: (id: string) => void;
  selectedOfficerId?: string | null;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Map bounds for US (default view)
const US_BOUNDS = {
  center: [39.8283, -98.5795] as [number, number],
  zoom: 4,
};

function MapLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="relative h-[400px] md:h-[500px] bg-repwell-sage-100/30 animate-pulse">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Map className="h-12 w-12 mx-auto text-repwell-teal-300/50 animate-pulse" />
              <p className="mt-4 text-sm text-repwell-teal-400">Loading map...</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

function NoLocationData({ loanOfficers }: { loanOfficers: DirectoryLoanOfficer[] }) {
  // Count unique states for the badge display
  const uniqueStates = new Set(
    loanOfficers.map((lo) => lo.address?.state || lo.region).filter(Boolean)
  );

  return (
    <Card className="overflow-hidden">
      <div className="relative h-48 md:h-56 bg-gradient-to-br from-repwell-sage-100/40 via-repwell-sage-100/20 to-repwell-teal-300/10">
        {/* Subtle decorative pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle, #52796f 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center px-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm mb-4">
              <MapPin className="h-7 w-7 text-repwell-teal-300" />
            </div>
            <h3 className="text-lg font-semibold text-repwell-teal-500">
              Map view coming soon
            </h3>
            <p className="mt-2 text-sm text-repwell-teal-400 max-w-sm">
              Location data is being processed. Browse professionals in the list below.
            </p>
            {uniqueStates.size > 0 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
                  <MapPin className="mr-1.5 h-3 w-3" />
                  {uniqueStates.size} {uniqueStates.size === 1 ? 'region' : 'regions'}
                </Badge>
                <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
                  {loanOfficers.length} {loanOfficers.length === 1 ? 'professional' : 'professionals'}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

// The actual map component that gets rendered on the client
function InteractiveMap({
  loanOfficers,
  onSelectOfficer,
  selectedOfficerId,
}: DirectoryMapViewProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Filter officers with valid coordinates
  const officersWithCoords = useMemo(
    () => loanOfficers.filter((lo) => lo.latitude != null && lo.longitude != null),
    [loanOfficers]
  );

  // Calculate bounds based on markers
  const bounds = useMemo(() => {
    if (officersWithCoords.length === 0) return null;

    const lats = officersWithCoords.map((lo) => lo.latitude!);
    const lngs = officersWithCoords.map((lo) => lo.longitude!);

    return [
      [Math.min(...lats), Math.min(...lngs)] as [number, number],
      [Math.max(...lats), Math.max(...lngs)] as [number, number],
    ];
  }, [officersWithCoords]);

  // Animate to new bounds when markers change
  useEffect(() => {
    if (!mapRef.current || !isMapReady || !bounds) return;

    // Check if user prefers reduced motion
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const map = mapRef.current;

    if (prefersReducedMotion) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.flyToBounds(bounds, {
        padding: [50, 50],
        duration: 0.5,
        easeLinearity: 0.25,
      });
    }
  }, [bounds, isMapReady]);

  // Lazy-loaded leaflet reference (only on client)
  const leafletRef = useRef<typeof import("leaflet") | null>(null);

  // Load leaflet on mount
  useEffect(() => {
    import("leaflet").then((L) => {
      leafletRef.current = L;
    });
  }, []);

  // Create custom marker icons
  const createIcon = useCallback((isSelected: boolean): DivIcon | undefined => {
    if (typeof window === "undefined" || !leafletRef.current) return undefined;

    const L = leafletRef.current;
    const color = isSelected ? "#354f52" : "#52796f"; // teal-400 : teal-300
    const scale = isSelected ? 1.15 : 1;

    return L.divIcon({
      className: "custom-map-marker",
      html: `
        <div style="transform: scale(${scale}); transition: transform 0.2s ease-out;">
          <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24c0-8.837-7.163-16-16-16z"
              fill="${color}"
              stroke="white"
              stroke-width="2"
            />
            <circle cx="16" cy="14" r="6" fill="white" opacity="0.9"/>
          </svg>
        </div>
      `,
      iconSize: [32, 40] as PointExpression,
      iconAnchor: [16, 40] as PointExpression,
      popupAnchor: [0, -40] as PointExpression,
    });
  }, []);

  // Custom cluster icon creator
  const createClusterIcon = useCallback((cluster: { getChildCount: () => number }): DivIcon | undefined => {
    if (typeof window === "undefined" || !leafletRef.current) return undefined;

    const L = leafletRef.current;
    const count = cluster.getChildCount();
    let size = "small";
    let diameter = 36;

    if (count >= 100) {
      size = "large";
      diameter = 48;
    } else if (count >= 10) {
      size = "medium";
      diameter = 42;
    }

    return L.divIcon({
      html: `
        <div class="cluster-marker cluster-${size}" style="
          width: ${diameter}px;
          height: ${diameter}px;
          border-radius: 50%;
          background: #cad2c5;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: ${size === "large" ? "14px" : size === "medium" ? "13px" : "12px"};
          color: #354f52;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        ">
          ${count}
        </div>
      `,
      className: "custom-cluster-icon",
      iconSize: L.point(diameter, diameter, true),
    });
  }, []);

  if (officersWithCoords.length === 0) {
    return <NoLocationData loanOfficers={loanOfficers} />;
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative h-[400px] md:h-[500px]">
        <MapContainer
          ref={mapRef}
          center={bounds ? [(bounds[0][0] + bounds[1][0]) / 2, (bounds[0][1] + bounds[1][1]) / 2] : US_BOUNDS.center}
          zoom={bounds ? undefined : US_BOUNDS.zoom}
          bounds={bounds || undefined}
          boundsOptions={{ padding: [50, 50] }}
          style={{ height: "100%", width: "100%" }}
          scrollWheelZoom={true}
          whenReady={() => setIsMapReady(true)}
        >
          {/* CartoDB Positron - light, minimal tiles */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          <MarkerClusterGroup
            chunkedLoading
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={false}
            maxClusterRadius={60}
            iconCreateFunction={createClusterIcon}
          >
            {officersWithCoords.map((lo) => {
              const isSelected = selectedOfficerId === lo.id;
              const icon = createIcon(isSelected);

              return (
                <Marker
                  key={lo.id}
                  position={[lo.latitude!, lo.longitude!]}
                  icon={icon}
                  eventHandlers={{
                    click: () => onSelectOfficer?.(lo.id),
                  }}
                >
                  <Popup className="repwell-popup" closeButton={true} maxWidth={280}>
                    <div className="p-1">
                      <div className="flex items-start gap-3">
                        <Link href={`/lo/${lo.id}`}>
                          <Avatar className="h-11 w-11 border-2 border-repwell-sage-100">
                            <AvatarImage
                              src={lo.photo_url || undefined}
                              alt={lo.full_name}
                            />
                            <AvatarFallback className="bg-repwell-teal-300/10 text-repwell-teal-400 font-medium text-sm">
                              {getInitials(lo.full_name)}
                            </AvatarFallback>
                          </Avatar>
                        </Link>

                        <div className="flex-1 min-w-0">
                          <Link href={`/lo/${lo.id}`}>
                            <h4 className="font-semibold text-sm text-repwell-teal-500 hover:text-repwell-teal-400 transition-colors truncate">
                              {lo.full_name}
                            </h4>
                          </Link>
                          {lo.title && (
                            <p className="text-xs text-repwell-teal-400 truncate">
                              {lo.title}
                            </p>
                          )}
                          {lo.address?.city && (
                            <div className="flex items-center gap-1 text-xs text-repwell-teal-300 mt-0.5">
                              <MapPin className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">
                                {lo.address.city}
                                {lo.address.state ? `, ${lo.address.state}` : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2.5 border-t border-repwell-sage-100 flex items-center justify-between">
                        {lo.average_rating ? (
                          <div className="flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            <span className="font-semibold text-sm text-repwell-teal-500">
                              {Number(lo.average_rating).toFixed(1)}
                            </span>
                            {lo.total_reviews !== null && lo.total_reviews > 0 && (
                              <span className="text-xs text-repwell-teal-300">
                                ({lo.total_reviews})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-repwell-teal-300">No reviews</span>
                        )}

                        <div className="flex items-center gap-1.5">
                          {lo.phone && (
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0" asChild>
                              <a href={`tel:${lo.phone}`} title={`Call ${lo.full_name}`}>
                                <Phone className="h-3 w-3" />
                              </a>
                            </Button>
                          )}
                          <Button size="sm" className="h-7 text-xs px-2.5" asChild>
                            <Link href={`/lo/${lo.id}`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MarkerClusterGroup>
        </MapContainer>

        {/* Results badge */}
        <div className="absolute top-3 left-3 z-[1000]">
          <Badge className="bg-white/95 backdrop-blur-sm text-repwell-teal-500 shadow-sm">
            <MapPin className="mr-1.5 h-3.5 w-3.5 text-repwell-teal-300" />
            {officersWithCoords.length} on map
            {loanOfficers.length > officersWithCoords.length && (
              <span className="ml-1 text-repwell-teal-300">
                ({loanOfficers.length - officersWithCoords.length} pending)
              </span>
            )}
          </Badge>
        </div>
      </div>
    </Card>
  );
}

// Export the map with dynamic import to ensure client-only rendering
// This avoids the useState + useEffect pattern that triggers lint warnings
export const DirectoryMapView = dynamic(
  () => Promise.resolve(InteractiveMap),
  {
    ssr: false,
    loading: () => <MapLoadingSkeleton />,
  }
);
