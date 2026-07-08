"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
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

function getOsmTileUrl(latitude: number, longitude: number, zoom = 15) {
  const latRad = (latitude * Math.PI) / 180;
  const scale = 2 ** zoom;
  const x = Math.floor(((longitude + 180) / 360) * scale);
  const y = Math.floor(
    ((1 -
      Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) /
      2) *
      scale
  );

  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

export function OfficeLocationMap({
  address,
  googleMapsUrl,
  latitude,
  longitude,
  className,
}: OfficeLocationMapProps) {
  const [isActivated, setIsActivated] = useState(false);

  if (!address || (!address.city && !address.street)) {
    return null;
  }

  const formattedAddress = formatAddress(address);
  const mapsUrl = googleMapsUrl || getGoogleMapsSearchUrl(address);
  const hasCoords = latitude != null && longitude != null;

  return (
    <Card className={cn("border-t-4 border-t-repwell-sage-200 overflow-hidden", className)}>
      <CardHeader variant="plain" className="pb-2">
        <CardTitle className="text-lg font-display text-repwell-teal-500 flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Office Location
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {hasCoords ? (
          isActivated ? (
            <LeafletMap latitude={latitude} longitude={longitude} />
          ) : (
            <div className="relative h-48 w-full overflow-hidden bg-repwell-sage-100">
              <button
                type="button"
                onClick={() => setIsActivated(true)}
                className="group absolute inset-0 block w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-2"
                aria-label={`Explore map for ${formattedAddress}`}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center opacity-90 grayscale-[15%] transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  style={{
                    backgroundImage: `url("${getOsmTileUrl(latitude, longitude)}")`,
                  }}
                  aria-hidden="true"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-repwell-teal-500/70 via-transparent to-white/10" />
                <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-full flex-col items-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-lg ring-4 ring-repwell-teal-300/20">
                    <MapPin
                      weight="fill"
                      className="h-7 w-7 text-repwell-teal-300"
                    />
                  </span>
                </div>
                <div className="absolute bottom-4 left-4 right-4 rounded-lg bg-white/90 p-3 shadow-sm backdrop-blur">
                  <p className="line-clamp-1 text-sm font-medium text-repwell-teal-500">
                    {formattedAddress}
                  </p>
                  <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-repwell-teal-300">
                    Click or tap to explore
                  </p>
                </div>
              </button>
              <p className="absolute bottom-1 right-2 z-10 rounded bg-white/85 px-1.5 py-0.5 text-[10px] text-repwell-teal-400 shadow-sm">
                ©{" "}
                <a
                  href="https://www.openstreetmap.org/copyright"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline"
                >
                  OpenStreetMap
                </a>
              </p>
            </div>
          )
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
