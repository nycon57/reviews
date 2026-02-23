"use client";

import dynamic from "next/dynamic";
import { MapPin, ArrowSquareOut } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LeafletMap = dynamic(() => import("./leaflet-map"), { ssr: false });

interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface OfficeLocationMapProps {
  address?: Address | null;
  googleMapsUrl?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  className?: string;
}

function formatAddress(address: Address): string {
  const parts = [
    address.street,
    [address.city, address.state].filter(Boolean).join(", "),
    address.zip,
  ].filter(Boolean);
  return parts.join(" ");
}

function getGoogleMapsSearchUrl(address: Address): string {
  const query = encodeURIComponent(formatAddress(address));
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

export function OfficeLocationMap({
  address,
  googleMapsUrl,
  latitude,
  longitude,
  className,
}: OfficeLocationMapProps) {
  if (!address || (!address.city && !address.street)) {
    return null;
  }

  const formattedAddress = formatAddress(address);
  const mapsUrl = googleMapsUrl || getGoogleMapsSearchUrl(address);
  const hasCoords = latitude != null && longitude != null;

  return (
    <Card className={cn("border-t-4 border-t-repwell-sage-200 overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display text-repwell-teal-500 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Office Location
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Interactive map or static placeholder */}
        {hasCoords ? (
          <LeafletMap latitude={latitude} longitude={longitude} />
        ) : (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block relative w-full h-48 bg-repwell-sage-100 hover:bg-repwell-sage-100/80 transition-colors group"
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-repwell-teal-300 mx-auto mb-2" />
                <p className="text-sm text-repwell-teal-400 px-4 line-clamp-2">
                  {formattedAddress}
                </p>
                <p className="text-xs text-repwell-teal-300 mt-1 group-hover:underline flex items-center justify-center gap-1">
                  View on Google Maps
                  <ArrowSquareOut className="h-3 w-3" />
                </p>
              </div>
            </div>
          </a>
        )}

        {/* Address */}
        <div className="p-4 pt-3">
          <p className="text-sm text-repwell-teal-400">{formattedAddress}</p>
        </div>
      </CardContent>
    </Card>
  );
}
