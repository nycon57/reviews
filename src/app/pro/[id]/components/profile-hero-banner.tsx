"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProfileHeroBannerProps {
  bannerUrl?: string | null;
  orgLogo?: string | null;
  orgName?: string;
  className?: string;
}

export function ProfileHeroBanner({
  bannerUrl,
  orgLogo,
  orgName,
  className,
}: ProfileHeroBannerProps) {
  return (
    <div className={cn("relative w-full h-48 md:h-64 overflow-hidden", className)}>
      {/* Banner Image or Gradient Fallback */}
      {bannerUrl ? (
        <Image
          src={bannerUrl}
          alt="Profile banner"
          fill
          className="object-cover"
          priority
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-repwell-teal-400 via-repwell-teal-300 to-repwell-sage-200" />
      )}

      {/* Overlay gradient for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

    </div>
  );
}
