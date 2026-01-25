"use client";

import { MapPin, ArrowSquareOut } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface OfficeLocationMapProps {
  address?: Address | null;
  googleMapsUrl?: string | null;
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
  className,
}: OfficeLocationMapProps) {
  if (!address || (!address.city && !address.street)) {
    return null;
  }

  const formattedAddress = formatAddress(address);
  const mapsUrl = googleMapsUrl || getGoogleMapsSearchUrl(address);

  return (
    <Card className={cn("border-t-4 border-t-repwell-sage-200 overflow-hidden", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-display text-repwell-teal-500 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Office Location
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Map placeholder with address */}
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block relative w-full h-36 bg-repwell-sage-100 hover:bg-repwell-sage-100/80 transition-colors group"
        >
          {/* Visual map placeholder */}
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

        {/* Address and directions button */}
        <div className="p-4 pt-3">
          <p className="text-sm text-repwell-teal-400 mb-3">{formattedAddress}</p>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full border-repwell-teal-300 text-repwell-teal-400 hover:bg-repwell-sage-100"
          >
            <a href={mapsUrl} target="_blank" rel="noopener noreferrer">
              <MapPin className="h-4 w-4 mr-2" />
              Get Directions
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
