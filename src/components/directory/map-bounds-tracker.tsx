"use client";

import { useCallback, useRef, useEffect } from "react";
import { useMapEvents, useMap } from "react-leaflet";
import type { MapBounds } from "@/lib/directory/actions";

interface MapBoundsTrackerProps {
  onBoundsChange: (bounds: MapBounds) => void;
  debounceMs?: number;
}

/**
 * Invisible component that tracks map bounds changes
 * Uses react-leaflet's useMapEvents to listen for moveend/zoomend
 */
export function MapBoundsTracker({
  onBoundsChange,
  debounceMs = 300,
}: MapBoundsTrackerProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const map = useMap();

  const emitBounds = useCallback(() => {
    const bounds = map.getBounds();
    onBoundsChange({
      north: bounds.getNorth(),
      south: bounds.getSouth(),
      east: bounds.getEast(),
      west: bounds.getWest(),
    });
  }, [map, onBoundsChange]);

  const handleBoundsChange = useCallback(() => {
    // Clear any pending debounce
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Debounce the bounds update
    timeoutRef.current = setTimeout(emitBounds, debounceMs);
  }, [emitBounds, debounceMs]);

  // Listen for map events
  useMapEvents({
    moveend: handleBoundsChange,
    zoomend: handleBoundsChange,
  });

  // Emit initial bounds on mount
  useEffect(() => {
    // Small delay to ensure map is fully rendered
    const timer = setTimeout(emitBounds, 100);
    return () => clearTimeout(timer);
  }, [emitBounds]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // This component renders nothing
  return null;
}
