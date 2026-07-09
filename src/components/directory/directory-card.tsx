"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Star,
  MapPin,
  Phone,
  ChatCircle,
  ArrowSquareOut as ExternalLink,
} from "@phosphor-icons/react";
import type { DirectoryProfessional } from "@/lib/directory/actions";
import { TierBadge } from "@/components/shared/tier-badge";

interface DirectoryCardProps {
  professional: DirectoryProfessional;
  variant?: "grid" | "list";
  /** Whether this card is being hovered (for map sync) */
  isHovered?: boolean;
  /** Callback when user clicks Message */
  onMessage?: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
}

function getDirectionsUrl(address: DirectoryProfessional["address"]): string | null {
  if (!address || (!address.street && !address.city)) return null;
  const query = [address.street, [address.city, address.state].filter(Boolean).join(", "), address.zip].filter(Boolean).join(" ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function DirectoryCard({ professional, variant = "grid", isHovered = false, onMessage }: DirectoryCardProps) {
  // Prefer user's address, fall back to branch address, then branch name
  const location = professional.address?.city || professional.address?.state
    ? [professional.address.city, professional.address.state].filter(Boolean).join(", ")
    : professional.branch_info?.address?.city || professional.branch_info?.address?.state
      ? [professional.branch_info.address.city, professional.branch_info.address.state].filter(Boolean).join(", ")
      : professional.branch || "";

  const directionsUrl = getDirectionsUrl(professional.address) || getDirectionsUrl(professional.branch_info?.address ?? null);

  // List variant - compact sidebar layout
  if (variant === "list") {
    return (
      <Card className={cn(
        "group transition-all hover:shadow-md hover:border-primary/50",
        isHovered && "shadow-md border-repwell-teal-300"
      )}>
        <CardContent className="p-4 pt-4">
          <div className="flex items-start gap-3">
            {/* Avatar */}
            <Link href={`/pro/${professional.slug}`} className="shrink-0 no-underline">
              <Avatar className="h-11 w-11 border-2 border-muted transition-transform group-hover:scale-105">
                <AvatarImage
                  src={professional.photo_url || undefined}
                  alt={professional.full_name}
                />
                <AvatarFallback className="text-sm font-semibold bg-primary/10 text-repwell-teal-500">
                  {getInitials(professional.full_name)}
                </AvatarFallback>
              </Avatar>
            </Link>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 min-w-0">
                  <Link href={`/pro/${professional.slug}`} className="min-w-0 no-underline">
                    <h3 className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                      {professional.full_name}
                    </h3>
                  </Link>
                  <TierBadge isEnterprise={professional.is_enterprise} isPro={professional.is_pro} size="sm" />
                </div>
                {professional.average_rating && professional.total_reviews ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                    <span className="font-semibold text-xs text-foreground">
                      {Number(professional.average_rating).toFixed(1)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      ({professional.total_reviews})
                    </span>
                  </div>
                ) : null}
              </div>

              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {professional.title || "Professional"}
              </p>

              <div className="flex flex-wrap items-center gap-x-2 mt-0.5 text-xs text-muted-foreground">
                {professional.organization && (
                  <span className="truncate">{professional.organization.name}</span>
                )}
                {professional.organization && location && (
                  <span className="text-muted-foreground/50">·</span>
                )}
                {location && (
                  <span className="flex items-center gap-1 truncate">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{location}</span>
                  </span>
                )}
                {professional.distance_miles != null && (
                  <>
                    <span className="text-muted-foreground/50">·</span>
                      <span className="text-repwell-teal-400 font-medium whitespace-nowrap">
                      {professional.distance_miles < 1
                        ? "< 1 mi"
                        : `${professional.distance_miles.toFixed(1)} mi`}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-3 ml-[56px]">
            {professional.phone && (
              <a
                href={`tel:${professional.phone}`}
                title="Call"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-7 px-2.5 text-xs"
                )}
              >
                <Phone className="h-3.5 w-3.5" />
                Call
              </a>
            )}
            {onMessage && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 px-2.5 text-xs"
                onClick={onMessage}
              >
                <ChatCircle className="h-3.5 w-3.5" />
                Message
              </Button>
            )}
            {directionsUrl && (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "h-7 px-2.5 text-xs"
                )}
              >
                <MapPin className="h-3.5 w-3.5" />
                Directions
              </a>
            )}
            <Button variant="default" size="sm" asChild className="h-7 text-xs ml-auto">
              <Link href={`/pro/${professional.slug}`}>
                View Profile
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grid variant - original vertical layout
  return (
    <Card className={cn(
      "group h-full transition-all hover:shadow-lg hover:border-primary/50",
      isHovered && "shadow-lg border-repwell-teal-300 bg-repwell-sage-100/30"
    )}>
      <CardContent className="p-5 pt-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Link href={`/pro/${professional.slug}`} className="no-underline">
            <Avatar className="h-16 w-16 border-2 border-muted transition-transform group-hover:scale-105">
              <AvatarImage
                src={professional.photo_url || undefined}
                alt={professional.full_name}
              />
              <AvatarFallback className="text-lg font-semibold bg-primary/10 text-repwell-teal-500">
                {getInitials(professional.full_name)}
              </AvatarFallback>
            </Avatar>
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <Link href={`/pro/${professional.slug}`} className="no-underline min-w-0">
                <h3 className="font-semibold text-lg text-repwell-teal-500 truncate group-hover:text-primary transition-colors">
                  {professional.full_name}
                </h3>
              </Link>
              <TierBadge isEnterprise={professional.is_enterprise} isPro={professional.is_pro} size="sm" />
            </div>
            <p className="text-sm text-muted-foreground truncate">
              {professional.title || "Professional"}
            </p>
            {professional.organization && (
              <p className="mt-0.5 text-xs text-muted-foreground truncate">{professional.organization.name}</p>
            )}
            {location && (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{location}</span>
                {professional.distance_miles != null && (
                  <span className="text-repwell-teal-400 font-medium ml-1 whitespace-nowrap">
                    ({professional.distance_miles < 1
                      ? "< 1 mi"
                      : `${professional.distance_miles.toFixed(1)} mi`})
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Rating & Reviews */}
        <div className="mt-4 flex items-center gap-2">
          {professional.average_rating && professional.total_reviews ? (
            <>
              <StarRating rating={Math.round(Number(professional.average_rating))} />
              <span className="font-semibold text-sm text-repwell-teal-500">
                {Number(professional.average_rating).toFixed(1)}
              </span>
              <Badge variant="secondary" className="text-xs">
                {professional.total_reviews}{" "}
                {professional.total_reviews === 1 ? "review" : "reviews"}
              </Badge>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">No reviews yet</span>
          )}
        </div>

        {/* Bio preview */}
        {professional.bio && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {professional.bio}
          </p>
        )}

        {/* NMLS ID */}
        {professional.nmls_id && (
          <p className="mt-2 text-xs text-muted-foreground">
            NMLS #{professional.nmls_id}
          </p>
        )}

        {/* Contact Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {professional.phone && (
            <a
              href={`tel:${professional.phone}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-8"
              )}
            >
              <Phone className="h-3.5 w-3.5" />
              Call
            </a>
          )}
          {onMessage && (
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={onMessage}
            >
              <ChatCircle className="h-3.5 w-3.5" />
              Message
            </Button>
          )}
          {directionsUrl && (
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-8"
              )}
            >
              <MapPin className="h-3.5 w-3.5" />
              Directions
            </a>
          )}
          <Button variant="default" size="sm" asChild className="h-8 ml-auto">
            <Link href={`/pro/${professional.slug}`}>
              View Profile
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
