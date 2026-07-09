"use client";

/* global google */
import { useEffect, useRef, useCallback, useState } from "react";
import { Input } from "@/components/ui/input";
import { MapPin, X } from "@phosphor-icons/react";

export interface PlaceSelection {
  lat: number;
  lng: number;
  label: string;
}

interface PlacesAutocompleteInputProps {
  value: string;
  onPlaceSelect: (place: PlaceSelection) => void;
  onPlaceClear: () => void;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label"?: string;
  className?: string;
}

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY;

/**
 * Load the Google Maps Places library via a script tag.
 * The @googlemaps/js-api-loader v2 functional API has issues in Next.js
 * client components — the key doesn't get passed to the script tag.
 * This approach injects the script directly with the key in the URL.
 */
let mapsLoadPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if (mapsLoadPromise) return mapsLoadPromise;

  // Already loaded (e.g. by another script)
  if (typeof google !== "undefined" && google.maps?.places) {
    mapsLoadPromise = Promise.resolve();
    return mapsLoadPromise;
  }

  mapsLoadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => {
      mapsLoadPromise = null;
      reject(new Error("Failed to load Google Maps"));
    };
    document.head.appendChild(script);
  });

  return mapsLoadPromise;
}

export function PlacesAutocompleteInput({
  value,
  onPlaceSelect,
  onPlaceClear,
  onChange,
  placeholder = "Search city...",
  "aria-label": ariaLabel,
  className,
}: PlacesAutocompleteInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (!API_KEY || !inputRef.current) return;

    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !inputRef.current) return;

        const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          types: ["(cities)"],
          componentRestrictions: { country: "us" },
          fields: ["geometry.location", "formatted_address", "name"],
        });

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (place.geometry?.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            const label = place.name || place.formatted_address || "";
            onChange(label);
            onPlaceSelect({ lat, lng, label });
          }
        });

        autocompleteRef.current = autocomplete;
        setLoaded(true);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Google Maps load error:", err);
        setLoadError(true);
      });

    return () => {
      cancelled = true;
    };
    // Only init once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleClear = useCallback(() => {
    onChange("");
    onPlaceClear();
    inputRef.current?.focus();
  }, [onChange, onPlaceClear]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Submit on Enter only if autocomplete is not showing suggestions
      // Google Places Autocomplete handles its own Enter key for selection
      if (e.key === "Escape") {
        handleClear();
      }
    },
    [handleClear]
  );

  // Fallback: no API key or load error — plain text input
  if (!API_KEY || loadError) {
    return (
      <div className={`relative flex-1 ${className || ""}`}>
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          aria-label={ariaLabel}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="pl-10"
        />
      </div>
    );
  }

  return (
    <div className={`relative flex-1 ${className || ""}`}>
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
      <Input
        ref={inputRef}
        aria-label={ariaLabel}
        placeholder={loaded ? placeholder : "Loading..."}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        className="pl-10 pr-8"
        autoComplete="off"
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-sm hover:bg-muted z-10"
          aria-label="Clear location"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
