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
  Envelope as Mail,
  BuildingOffice as Building2,
  ArrowSquareOut as ExternalLink,
} from "@phosphor-icons/react";
import type { DirectoryProfessional } from "@/lib/directory/actions";

interface DirectoryCardProps {
  professional: DirectoryProfessional;
  variant?: "grid" | "list";
  /** Whether this card is being hovered (for map sync) */
  isHovered?: boolean;
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

export function DirectoryCard({ professional, variant = "grid", isHovered = false }: DirectoryCardProps) {
  // Prefer user's address, fall back to branch address, then branch name + region
  const location = professional.address?.city || professional.address?.state
    ? [professional.address.city, professional.address.state].filter(Boolean).join(", ")
    : professional.branch_info?.address?.city || professional.branch_info?.address?.state
      ? [professional.branch_info.address.city, professional.branch_info.address.state].filter(Boolean).join(", ")
      : [professional.branch, professional.region].filter(Boolean).join(", ");

  // List variant - horizontal, compact layout
  if (variant === "list") {
    return (
      <Card className={cn(
        "group transition-all hover:shadow-md hover:border-primary/50",
        isHovered && "shadow-md border-repwell-teal-300 bg-repwell-sage-100/30"
      )}>
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* Avatar + Main Info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <Link href={`/pro/${professional.slug || professional.id}`} className="shrink-0">
                <Avatar className="h-14 w-14 border-2 border-muted transition-transform group-hover:scale-105">
                  <AvatarImage
                    src={professional.photo_url || undefined}
                    alt={professional.full_name}
                  />
                  <AvatarFallback className="text-base font-semibold bg-primary/10 text-primary">
                    {getInitials(professional.full_name)}
                  </AvatarFallback>
                </Avatar>
              </Link>

              <div className="flex-1 min-w-0">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                  <Link href={`/pro/${professional.slug || professional.id}`}>
                    <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                      {professional.full_name}
                    </h3>
                  </Link>
                  {/* Rating inline on desktop */}
                  {professional.average_rating && professional.total_reviews ? (
                    <div className="hidden sm:flex items-center gap-1.5">
                      <StarRating rating={Math.round(Number(professional.average_rating))} />
                      <span className="font-semibold text-sm">
                        {Number(professional.average_rating).toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({professional.total_reviews})
                      </span>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1 text-sm text-muted-foreground">
                  <span className="truncate">{professional.title || "Professional"}</span>
                  {professional.organization && (
                    <>
                      <span className="hidden sm:inline text-muted-foreground/50">·</span>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">{professional.organization.name}</span>
                      </span>
                    </>
                  )}
                  {location && (
                    <>
                      <span className="hidden sm:inline text-muted-foreground/50">·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 shrink-0" />
                        <span className="truncate">{location}</span>
                      </span>
                    </>
                  )}
                </div>

                {/* Rating on mobile */}
                {professional.average_rating && professional.total_reviews ? (
                  <div className="flex sm:hidden items-center gap-1.5 mt-2">
                    <StarRating rating={Math.round(Number(professional.average_rating))} />
                    <span className="font-semibold text-sm">
                      {Number(professional.average_rating).toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({professional.total_reviews} {professional.total_reviews === 1 ? "review" : "reviews"})
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground mt-2 sm:hidden">No reviews yet</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:shrink-0">
              {professional.phone && (
                <a
                  href={`tel:${professional.phone}`}
                  title="Call"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-9 w-9 p-0 sm:h-9 sm:w-auto sm:px-3"
                  )}
                >
                  <Phone className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Call</span>
                </a>
              )}
              {professional.email && (
                <a
                  href={`mailto:${professional.email}`}
                  title="Email"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "sm" }),
                    "h-9 w-9 p-0 sm:h-9 sm:w-auto sm:px-3"
                  )}
                >
                  <Mail className="h-4 w-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Email</span>
                </a>
              )}
              <Button variant="default" size="sm" asChild className="h-9 flex-1 sm:flex-none">
                <Link href={`/pro/${professional.slug || professional.id}`}>
                  View Profile
                </Link>
              </Button>
            </div>
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
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Link href={`/pro/${professional.slug || professional.id}`}>
            <Avatar className="h-16 w-16 border-2 border-muted transition-transform group-hover:scale-105">
              <AvatarImage
                src={professional.photo_url || undefined}
                alt={professional.full_name}
              />
              <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                {getInitials(professional.full_name)}
              </AvatarFallback>
            </Avatar>
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/pro/${professional.slug || professional.id}`}>
              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                {professional.full_name}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground truncate">
              {professional.title || "Professional"}
            </p>
            {professional.organization && (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{professional.organization.name}</span>
              </div>
            )}
            {location && (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{location}</span>
              </div>
            )}
          </div>
        </div>

        {/* Rating & Reviews */}
        <div className="mt-4 flex items-center gap-2">
          {professional.average_rating && professional.total_reviews ? (
            <>
              <StarRating rating={Math.round(Number(professional.average_rating))} />
              <span className="font-semibold text-sm">
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
              <Phone className="mr-1.5 h-3.5 w-3.5" />
              Call
            </a>
          )}
          {professional.email && (
            <a
              href={`mailto:${professional.email}`}
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "h-8"
              )}
            >
              <Mail className="mr-1.5 h-3.5 w-3.5" />
              Email
            </a>
          )}
          <Button variant="default" size="sm" asChild className="h-8 ml-auto">
            <Link href={`/pro/${professional.slug || professional.id}`}>
              View Profile
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
