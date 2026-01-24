"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star,
  Phone,
  MapPin,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import type { DirectoryLoanOfficer } from "@/lib/directory/actions";

// Create custom pin icon using Repwell brand colors
const createCustomIcon = (isSelected = false, isHovered = false) => {
  const color = isSelected || isHovered ? "#354f52" : "#52796f"; // teal-400 : teal-300
  const scale = isSelected || isHovered ? 1.1 : 1;

  return L.divIcon({
    className: "custom-map-marker",
    html: `
      <div style="
        transform: scale(${scale});
        transition: transform 0.2s ease-out;
      ">
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
    iconSize: [32, 40],
    iconAnchor: [16, 40],
    popupAnchor: [0, -40],
  });
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

interface MapMarkerProps {
  loanOfficer: DirectoryLoanOfficer;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export function MapMarker({
  loanOfficer,
  isSelected = false,
  onSelect,
}: MapMarkerProps) {
  const [isHovered, setIsHovered] = useState(false);

  if (!loanOfficer.latitude || !loanOfficer.longitude) {
    return null;
  }

  const icon = createCustomIcon(isSelected, isHovered);

  return (
    <Marker
      position={[loanOfficer.latitude, loanOfficer.longitude]}
      icon={icon}
      eventHandlers={{
        mouseover: () => setIsHovered(true),
        mouseout: () => setIsHovered(false),
        click: () => onSelect?.(loanOfficer.id),
      }}
    >
      <Popup
        className="repwell-popup"
        closeButton={false}
        autoPan={true}
        maxWidth={280}
      >
        <PopupContent loanOfficer={loanOfficer} />
      </Popup>
    </Marker>
  );
}

interface PopupContentProps {
  loanOfficer: DirectoryLoanOfficer;
}

function PopupContent({ loanOfficer }: PopupContentProps) {
  return (
    <div className="p-2 min-w-[240px]">
      <div className="flex items-start gap-3">
        <Link href={`/lo/${loanOfficer.id}`}>
          <Avatar className="h-12 w-12 border-2 border-repwell-sage-100">
            <AvatarImage
              src={loanOfficer.photo_url || undefined}
              alt={loanOfficer.full_name}
            />
            <AvatarFallback className="bg-repwell-teal-300/10 text-repwell-teal-400 font-medium">
              {getInitials(loanOfficer.full_name)}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <Link href={`/lo/${loanOfficer.id}`}>
            <h4 className="font-semibold text-repwell-teal-500 hover:text-repwell-teal-400 transition-colors truncate">
              {loanOfficer.full_name}
            </h4>
          </Link>
          {loanOfficer.title && (
            <p className="text-xs text-repwell-teal-400 truncate">
              {loanOfficer.title}
            </p>
          )}
          {loanOfficer.address?.city && (
            <div className="flex items-center gap-1 text-xs text-repwell-teal-300 mt-1">
              <MapPin className="h-3 w-3" />
              <span>
                {loanOfficer.address.city}
                {loanOfficer.address.state ? `, ${loanOfficer.address.state}` : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between">
        {loanOfficer.average_rating ? (
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              <span className="font-semibold text-repwell-teal-500">
                {Number(loanOfficer.average_rating).toFixed(1)}
              </span>
            </div>
            {loanOfficer.total_reviews !== null && loanOfficer.total_reviews > 0 && (
              <span className="text-xs text-repwell-teal-300">
                ({loanOfficer.total_reviews} {loanOfficer.total_reviews === 1 ? "review" : "reviews"})
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs text-repwell-teal-300">No reviews yet</span>
        )}

        <div className="flex items-center gap-2">
          {loanOfficer.phone && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 p-0"
              asChild
            >
              <a href={`tel:${loanOfficer.phone}`} title={`Call ${loanOfficer.full_name}`}>
                <Phone className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
          <Button size="sm" className="h-8" asChild>
            <Link href={`/lo/${loanOfficer.id}`}>View Profile</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

// Animated wrapper for staggered entrance
interface AnimatedMarkerWrapperProps {
  children: React.ReactNode;
  index: number;
}

export function AnimatedMarkerWrapper({ children, index }: AnimatedMarkerWrapperProps) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        delay: index * 0.05,
      }}
    >
      {children}
    </motion.div>
  );
}
