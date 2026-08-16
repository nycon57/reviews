import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProfileHeroBannerProps {
  bannerUrl?: string | null;
  className?: string;
}

export function ProfileHeroBanner({
  bannerUrl,
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

      {/* Top gradient for breadcrumb readability */}
      <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/40 to-transparent" />

      {/* Bottom gradient for profile card contrast */}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/30 to-transparent" />

    </div>
  );
}
