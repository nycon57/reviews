"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Building2,
  ExternalLink,
} from "lucide-react";
import type { DirectoryLoanOfficer } from "@/lib/directory/actions";

interface DirectoryCardProps {
  loanOfficer: DirectoryLoanOfficer;
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

export function DirectoryCard({ loanOfficer }: DirectoryCardProps) {
  const location = loanOfficer.address
    ? [loanOfficer.address.city, loanOfficer.address.state]
        .filter(Boolean)
        .join(", ")
    : [loanOfficer.branch, loanOfficer.region].filter(Boolean).join(", ");

  return (
    <Card className="group h-full transition-all hover:shadow-lg hover:border-primary/50">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Link href={`/lo/${loanOfficer.id}`}>
            <Avatar className="h-16 w-16 border-2 border-muted transition-transform group-hover:scale-105">
              <AvatarImage
                src={loanOfficer.photo_url || undefined}
                alt={loanOfficer.full_name}
              />
              <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                {getInitials(loanOfficer.full_name)}
              </AvatarFallback>
            </Avatar>
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/lo/${loanOfficer.id}`}>
              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                {loanOfficer.full_name}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground truncate">
              {loanOfficer.title || "Loan Officer"}
            </p>
            {loanOfficer.organization && (
              <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{loanOfficer.organization.name}</span>
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
          {loanOfficer.average_rating && loanOfficer.total_reviews ? (
            <>
              <StarRating rating={Math.round(Number(loanOfficer.average_rating))} />
              <span className="font-semibold text-sm">
                {Number(loanOfficer.average_rating).toFixed(1)}
              </span>
              <Badge variant="secondary" className="text-xs">
                {loanOfficer.total_reviews}{" "}
                {loanOfficer.total_reviews === 1 ? "review" : "reviews"}
              </Badge>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">No reviews yet</span>
          )}
        </div>

        {/* Bio preview */}
        {loanOfficer.bio && (
          <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
            {loanOfficer.bio}
          </p>
        )}

        {/* NMLS ID */}
        {loanOfficer.nmls_id && (
          <p className="mt-2 text-xs text-muted-foreground">
            NMLS #{loanOfficer.nmls_id}
          </p>
        )}

        {/* Contact Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          {loanOfficer.phone && (
            <Button variant="outline" size="sm" asChild className="h-8">
              <a href={`tel:${loanOfficer.phone}`}>
                <Phone className="mr-1.5 h-3.5 w-3.5" />
                Call
              </a>
            </Button>
          )}
          {loanOfficer.email && (
            <Button variant="outline" size="sm" asChild className="h-8">
              <a href={`mailto:${loanOfficer.email}`}>
                <Mail className="mr-1.5 h-3.5 w-3.5" />
                Email
              </a>
            </Button>
          )}
          <Button variant="default" size="sm" asChild className="h-8 ml-auto">
            <Link href={`/lo/${loanOfficer.id}`}>
              View Profile
              <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
