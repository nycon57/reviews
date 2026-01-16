"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star,
  MapPin,
  Phone,
  Mail,
  Linkedin,
  ExternalLink,
  Quote,
  Building2,
  Award,
} from "lucide-react";
import Image from "next/image";
import type { PublicLoanOfficer, PublicReview } from "@/lib/seo/actions";
import type { Tables } from "@/types/database.types";

// Source icon configuration
const SOURCE_CONFIG: Record<string, { icon: string; name: string; color: string }> = {
  google: { icon: "/icons/google.svg", name: "Google", color: "#4285F4" },
  zillow: { icon: "/icons/zillow.svg", name: "Zillow", color: "#006AFF" },
  facebook: { icon: "/icons/facebook.svg", name: "Facebook", color: "#1877F2" },
  yelp: { icon: "/icons/yelp.svg", name: "Yelp", color: "#D32323" },
};

interface SourceIconProps {
  source: string;
  zillowUrl?: string | null;
  linkedinUrl?: string | null;
  googlePlaceId?: string | null;
}

function SourceIcon({ source, zillowUrl, linkedinUrl, googlePlaceId }: SourceIconProps) {
  const normalizedSource = source.toLowerCase();

  // Hide internal sources
  if (normalizedSource === "internal" || normalizedSource === "survey") {
    return null;
  }

  const config = SOURCE_CONFIG[normalizedSource];

  // Determine the link URL based on source
  let href: string | null = null;
  if (normalizedSource === "google" && googlePlaceId) {
    href = `https://search.google.com/local/reviews?placeid=${googlePlaceId}`;
  } else if (normalizedSource === "zillow" && zillowUrl) {
    href = zillowUrl;
  } else if (normalizedSource === "linkedin" && linkedinUrl) {
    href = linkedinUrl;
  }

  // If we have a known source with icon
  if (config) {
    const iconElement = (
      <div
        className="flex items-center justify-center h-5 w-5 rounded"
        title={`View on ${config.name}`}
      >
        <Image
          src={config.icon}
          alt={config.name}
          width={20}
          height={20}
          className="h-5 w-5"
        />
      </div>
    );

    if (href) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity"
          title={`View on ${config.name}`}
        >
          {iconElement}
        </a>
      );
    }

    return iconElement;
  }

  // Fallback for unknown sources - show badge
  return (
    <Badge variant="outline" className="text-xs">
      {source}
    </Badge>
  );
}

interface LOProfileContentProps {
  loanOfficer: PublicLoanOfficer;
  organization: Pick<Tables<"organizations">, "id" | "name" | "logo_url" | "domain"> | null;
  reviews: PublicReview[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  );
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function LOProfileContent({
  loanOfficer,
  organization,
  reviews,
}: LOProfileContentProps) {
  const address = loanOfficer.address as {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;

  const locationString = address
    ? [address.city, address.state].filter(Boolean).join(", ")
    : [loanOfficer.branch, loanOfficer.region].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header Section */}
      <div className="border-b bg-card">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Avatar */}
            <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
              <AvatarImage src={loanOfficer.photo_url || undefined} alt={loanOfficer.full_name} />
              <AvatarFallback className="text-3xl font-semibold bg-primary/10 text-primary">
                {getInitials(loanOfficer.full_name)}
              </AvatarFallback>
            </Avatar>

            {/* Profile Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold tracking-tight">
                {loanOfficer.full_name}
              </h1>
              <p className="text-lg text-muted-foreground">
                {loanOfficer.title || "Loan Officer"}
              </p>

              {organization && (
                <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{organization.name}</span>
                </div>
              )}

              {/* Rating Summary */}
              {loanOfficer.average_rating && loanOfficer.total_reviews ? (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                  <div className="flex items-center gap-2">
                    <StarRating rating={Math.round(Number(loanOfficer.average_rating))} />
                    <span className="text-lg font-semibold">
                      {Number(loanOfficer.average_rating).toFixed(1)}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {loanOfficer.total_reviews} {loanOfficer.total_reviews === 1 ? "Review" : "Reviews"}
                  </Badge>
                  {loanOfficer.nps_score !== null && (
                    <Badge variant="outline" className="text-sm">
                      NPS: {loanOfficer.nps_score}
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No reviews yet</p>
              )}

              {/* NMLS Badge */}
              {loanOfficer.nmls_id && (
                <div className="mt-3 flex items-center justify-center gap-2 sm:justify-start">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    NMLS# {loanOfficer.nmls_id}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Sidebar - Contact Info */}
          <div className="space-y-6 lg:col-span-1">
            {/* Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {locationString && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <span className="text-sm">{locationString}</span>
                  </div>
                )}
                {loanOfficer.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <a
                      href={`tel:${loanOfficer.phone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {loanOfficer.phone}
                    </a>
                  </div>
                )}
                {loanOfficer.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <a
                      href={`mailto:${loanOfficer.email}`}
                      className="text-sm text-primary hover:underline break-all"
                    >
                      {loanOfficer.email}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* External Links */}
            {(loanOfficer.linkedin_url || loanOfficer.zillow_profile_url) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {loanOfficer.linkedin_url && (
                    <a
                      href={loanOfficer.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-primary hover:underline"
                    >
                      <Linkedin className="h-5 w-5" />
                      LinkedIn Profile
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                  {loanOfficer.zillow_profile_url && (
                    <a
                      href={loanOfficer.zillow_profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-primary hover:underline"
                    >
                      <ExternalLink className="h-5 w-5" />
                      Zillow Profile
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Bio */}
            {loanOfficer.bio && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {loanOfficer.bio}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Reviews Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Customer Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    No reviews yet. Be the first to leave a review!
                  </p>
                ) : (
                  <div className="space-y-6">
                    {reviews.map((review) => (
                      <div
                        key={review.id}
                        className="border-b pb-6 last:border-0 last:pb-0"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <StarRating rating={review.rating} />
                              <span className="text-sm font-medium">
                                {review.rating}/5
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {review.customer_name || "Anonymous"}
                              {review.customer_location && (
                                <span> - {review.customer_location}</span>
                              )}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <SourceIcon
                              source={review.source}
                              zillowUrl={loanOfficer.zillow_profile_url}
                              linkedinUrl={loanOfficer.linkedin_url}
                            />
                            <span>{formatDate(review.review_date)}</span>
                          </div>
                        </div>

                        {review.title && (
                          <h4 className="mt-3 font-medium">{review.title}</h4>
                        )}

                        {review.text && (
                          <div className="mt-2 flex items-start gap-2">
                            <Quote className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {review.text}
                            </p>
                          </div>
                        )}

                        {review.response_text && (
                          <div className="mt-4 rounded-lg bg-muted/50 p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Response from {loanOfficer.full_name}
                            </p>
                            <p className="text-sm">{review.response_text}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card py-6 mt-8">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            Powered by RepWell - Customer Experience Management
          </p>
        </div>
      </footer>
    </div>
  );
}
