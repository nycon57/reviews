"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Star,
  MapPin,
  Phone,
  Envelope as Mail,
  Globe,
  Clock,
  Users,
  Quotes as Quote,
  BuildingOffice as Building2,
  ArrowSquareOut as ExternalLink,
  CaretRight as ChevronRight,
} from "@phosphor-icons/react";
import type {
  PublicBranch,
  PublicBranchLoanOfficer,
  PublicBranchReview,
} from "@/lib/seo/actions";
import type { Tables } from "@/types/database.types";

interface BranchProfileContentProps {
  branch: PublicBranch;
  organization: Pick<Tables<"organizations">, "id" | "name" | "logo_url" | "domain"> | null;
  loanOfficers: PublicBranchLoanOfficer[];
  reviews: PublicBranchReview[];
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

interface HoursOfOperation {
  [day: string]: {
    open?: string;
    close?: string;
    closed?: boolean;
  };
}

function formatHours(hours: HoursOfOperation | null): string[] {
  if (!hours) return [];

  const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const dayNames: Record<string, string> = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
  };

  return dayOrder
    .filter((day) => hours[day])
    .map((day) => {
      const schedule = hours[day];
      if (schedule.closed) {
        return `${dayNames[day]}: Closed`;
      }
      if (schedule.open && schedule.close) {
        return `${dayNames[day]}: ${schedule.open} - ${schedule.close}`;
      }
      return `${dayNames[day]}: Hours vary`;
    });
}

export function BranchProfileContent({
  branch,
  organization,
  loanOfficers,
  reviews,
}: BranchProfileContentProps) {
  const address = branch.address as {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;

  const addressString = address
    ? [address.street, address.city, address.state, address.zip].filter(Boolean).join(", ")
    : null;

  const locationString = address
    ? [address.city, address.state].filter(Boolean).join(", ")
    : branch.region || "";

  const hours = branch.hours_of_operation as HoursOfOperation | null;
  const formattedHours = formatHours(hours);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Cover Image / Header Section */}
      <div className="relative border-b bg-card">
        {branch.cover_image_url && (
          <div className="absolute inset-0 h-48 overflow-hidden">
            <img
              src={branch.cover_image_url}
              alt={`${branch.name} cover`}
              className="h-full w-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card" />
          </div>
        )}
        <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
            {/* Branch Photo / Logo */}
            <div className="h-32 w-32 shrink-0 overflow-hidden rounded-xl border-4 border-background bg-muted shadow-lg">
              {branch.photo_url ? (
                <img
                  src={branch.photo_url}
                  alt={branch.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10">
                  <Building2 className="h-12 w-12 text-primary" />
                </div>
              )}
            </div>

            {/* Branch Info */}
            <div className="flex-1 text-center sm:text-left">
              <h1 className="text-3xl font-bold tracking-tight">{branch.name}</h1>
              {locationString && (
                <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{locationString}</span>
                </div>
              )}

              {organization && (
                <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{organization.name}</span>
                </div>
              )}

              {/* Rating Summary */}
              {branch.average_rating && branch.total_reviews ? (
                <div className="mt-4 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
                  <div className="flex items-center gap-2">
                    <StarRating rating={Math.round(Number(branch.average_rating))} />
                    <span className="text-lg font-semibold">
                      {Number(branch.average_rating).toFixed(1)}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {branch.total_reviews} {branch.total_reviews === 1 ? "Review" : "Reviews"}
                  </Badge>
                  {branch.total_members && branch.total_members > 0 && (
                    <Badge variant="outline" className="text-sm">
                      <Users className="mr-1 h-3 w-3" />
                      {branch.total_members} {branch.total_members === 1 ? "Professional" : "Professionals"}
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm text-muted-foreground">No reviews yet</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Sidebar - Contact Info & Hours */}
          <div className="space-y-6 lg:col-span-1">
            {/* Contact Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {addressString && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <span className="text-sm">{addressString}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <a
                      href={`tel:${branch.phone}`}
                      className="text-sm text-primary hover:underline"
                    >
                      {branch.phone}
                    </a>
                  </div>
                )}
                {branch.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <a
                      href={`mailto:${branch.email}`}
                      className="text-sm text-primary hover:underline break-all"
                    >
                      {branch.email}
                    </a>
                  </div>
                )}
                {branch.website_url && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <a
                      href={branch.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      Visit Website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
                {branch.google_maps_url && (
                  <div className="pt-2">
                    <a
                      href={branch.google_maps_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <MapPin className="h-4 w-4" />
                      View on Google Maps
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Hours Card */}
            {formattedHours.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Hours of Operation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    {formattedHours.map((line, index) => (
                      <p key={index} className="text-muted-foreground">
                        {line}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {branch.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {branch.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Manager */}
            {branch.manager_name && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Branch Manager</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium">{branch.manager_name}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Main Content Area */}
          <div className="space-y-8 lg:col-span-2">
            {/* Loan Officers Section */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Our Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loanOfficers.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    No team members listed at this branch.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {loanOfficers.map((member) => (
                      <Link
                        key={member.id}
                        href={`/pro/${member.id}`}
                        className="group block"
                      >
                        <div className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.photo_url || undefined} alt={member.full_name} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {getInitials(member.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                              {member.full_name}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {member.title || "Professional"}
                            </p>
                            {member.average_rating && member.total_reviews ? (
                              <div className="mt-1 flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs font-medium">
                                    {Number(member.average_rating).toFixed(1)}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  ({member.total_reviews} {member.total_reviews === 1 ? "review" : "reviews"})
                                </span>
                              </div>
                            ) : null}
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    No reviews yet for this branch.
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
                          <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-xs">
                              {review.source}
                            </Badge>
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

                        {/* Link to LO who received this review */}
                        <div className="mt-3 flex items-center gap-2">
                          <Link
                            href={`/pro/${review.loan_officer.id}`}
                            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={review.loan_officer.photo_url || undefined}
                                alt={review.loan_officer.full_name}
                              />
                              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                {getInitials(review.loan_officer.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span>Review for {review.loan_officer.full_name}</span>
                          </Link>
                        </div>

                        {review.response_text && (
                          <div className="mt-4 rounded-lg bg-muted/50 p-3">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              Response from {review.loan_officer.full_name}
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

            {/* CTA Section */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="py-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Looking for a Professional?</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Contact one of our experienced professionals to start your journey.
                  </p>
                  {branch.phone && (
                    <Button asChild className="mt-4">
                      <a href={`tel:${branch.phone}`}>
                        <Phone className="mr-2 h-4 w-4" />
                        Call {branch.phone}
                      </a>
                    </Button>
                  )}
                </div>
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
