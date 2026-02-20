"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

interface LeafletMapProps {
  latitude: number;
  longitude: number;
}

export default function LeafletMap({ latitude, longitude }: LeafletMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markerRef = useRef<import("leaflet").Marker | null>(null);

  // Initialize the map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    async function initMap() {
      const L = (await import("leaflet")).default;

      // Fix default icon paths broken by webpack
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [latitude, longitude],
        zoom: 14,
        zoomControl: false,
        scrollWheelZoom: false,
        attributionControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      markerRef.current = L.marker([latitude, longitude]).addTo(map);
      mapRef.current = map;
    }

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update view and marker when coordinates change
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setView([latitude, longitude], mapRef.current.getZoom());
    }
    if (markerRef.current) {
      markerRef.current.setLatLng([latitude, longitude]);
    }
  }, [latitude, longitude]);

  return <div ref={containerRef} className="w-full h-48" />;
}
