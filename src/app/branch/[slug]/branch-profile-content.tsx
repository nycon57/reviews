"use client";

import Link from "next/link";
import Image from "next/image";
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
  PublicBranchProfessional,
  PublicBranchReview,
} from "@/lib/seo/actions";
import type { Tables } from "@/types/database.types";
import {
  DirectoryBreadcrumbs,
  type DirectoryBreadcrumbItem,
} from "@/components/shared/directory-breadcrumbs";
import { ShareProfileButton } from "@/app/pro/[slug]/components/share-profile-button";
import { SourceIcon } from "@/app/pro/[slug]/components/review-card";
import { ProfileHeroBanner } from "@/app/pro/[slug]/components";

interface BranchProfileContentProps {
  branch: PublicBranch;
  organization: (Pick<Tables<"organizations">, "id" | "name" | "logo_url" | "domain"> & { slug: string }) | null;
  professionals: PublicBranchProfessional[];
  reviews: PublicBranchReview[];
  breadcrumbs?: DirectoryBreadcrumbItem[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          weight="fill"
          className={`h-4 w-4 ${
            star <= rating
              ? "text-amber-500"
              : "text-gray-200"
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
  professionals,
  reviews,
  breadcrumbs,
}: BranchProfileContentProps) {
  const profileUrl = typeof window !== "undefined"
    ? window.location.href
    : `/branch/${branch.global_slug || branch.id}`;
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

  // Sort professionals: manager first
  const sortedProfessionals = [...professionals].sort((a, b) => {
    if (a.id === branch.manager_id) return -1;
    if (b.id === branch.manager_id) return 1;
    return 0;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Banner */}
      <div className="relative">
        <ProfileHeroBanner
          bannerUrl={branch.cover_image_url}
          orgLogo={organization?.logo_url}
          orgName={organization?.name}
        />

        {/* Breadcrumbs overlaid on banner */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="absolute top-0 left-0 right-0 z-10">
            <div className="mx-auto max-w-5xl px-4 pt-4 sm:px-6 lg:px-8">
              <DirectoryBreadcrumbs
                items={breadcrumbs}
                className="[&_a]:text-white/70 [&_a:hover]:text-white [&_span[aria-current]]:text-white [&_svg]:text-white/50"
              />
            </div>
          </div>
        )}
      </div>

      {/* Overlapping Header Card */}
      <div className="relative -mt-16 z-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              {/* Branch Photo / Logo */}
              <div>
                <div className="h-28 w-28 md:h-32 md:w-32 shrink-0 overflow-hidden rounded-xl border-4 border-white shadow-lg -mt-16 sm:-mt-20">
                  {branch.photo_url ? (
                    <img
                      src={branch.photo_url}
                      alt={branch.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-repwell-sage-100">
                      <Building2 className="h-12 w-12 text-repwell-teal-400" />
                    </div>
                  )}
                </div>
              </div>

              {/* Branch Info */}
              <div className="flex-1 text-center sm:text-left min-w-0">
                <h1 className="text-2xl md:text-3xl font-display font-bold text-repwell-teal-500 tracking-tight">
                  {branch.name}
                </h1>
                {locationString && (
                  <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
                    <MapPin className="h-4 w-4 text-repwell-teal-300" />
                    <span className="text-repwell-teal-400">{locationString}</span>
                  </div>
                )}

                {organization && (
                  <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
                    <Building2 className="h-4 w-4 text-repwell-teal-300" />
                    <span className="text-repwell-teal-400">{organization.name}</span>
                  </div>
                )}

                {/* Rating Summary */}
                {branch.average_rating && branch.total_reviews ? (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                    <div className="flex items-center gap-2">
                      <StarRating rating={Math.round(Number(branch.average_rating))} />
                      <span className="text-lg font-semibold text-repwell-teal-500">
                        {Number(branch.average_rating).toFixed(1)}
                      </span>
                    </div>
                    <Badge variant="secondary" className="bg-repwell-sage-100 text-repwell-teal-400">
                      {branch.total_reviews} {branch.total_reviews === 1 ? "Review" : "Reviews"}
                    </Badge>
                    {branch.total_members && branch.total_members > 0 && (
                      <Badge variant="outline" className="border-repwell-sage-200 text-repwell-teal-400">
                        <Users className="mr-1 h-3 w-3" />
                        {branch.total_members} {branch.total_members === 1 ? "Professional" : "Professionals"}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-repwell-teal-300">No reviews yet</p>
                )}
              </div>

              {/* Organization Logo */}
              {organization?.logo_url && (
                <div className="hidden sm:block shrink-0">
                  <div className="relative h-16 w-16 md:h-20 md:w-20 overflow-hidden">
                    <Image
                      src={organization.logo_url}
                      alt={organization.name || "Organization logo"}
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Sidebar - Contact Info & Hours */}
          <div className="lg:sticky lg:top-20 lg:self-start space-y-6 lg:col-span-1">
            {/* Contact Card */}
            <Card className="border-t-4 border-t-repwell-sage-200">
              <CardHeader>
                <CardTitle className="text-lg font-display text-repwell-teal-500">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {addressString && (
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 shrink-0 text-repwell-teal-300" />
                    <span className="text-sm text-repwell-teal-400">{addressString}</span>
                  </div>
                )}
                {branch.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 shrink-0 text-repwell-teal-300" />
                    <a
                      href={`tel:${branch.phone}`}
                      className="text-sm text-repwell-teal-400 hover:text-repwell-teal-300 hover:underline"
                    >
                      {branch.phone}
                    </a>
                  </div>
                )}
                {branch.email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 shrink-0 text-repwell-teal-300" />
                    <a
                      href={`mailto:${branch.email}`}
                      className="text-sm text-repwell-teal-400 hover:text-repwell-teal-300 hover:underline break-all"
                    >
                      {branch.email}
                    </a>
                  </div>
                )}
                {branch.website_url && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 shrink-0 text-repwell-teal-300" />
                    <a
                      href={branch.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-repwell-teal-400 hover:text-repwell-teal-300 hover:underline flex items-center gap-1"
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
                      className="inline-flex items-center gap-2 text-sm text-repwell-teal-400 hover:text-repwell-teal-300 hover:underline"
                    >
                      <MapPin className="h-4 w-4" />
                      View on Google Maps
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Share Profile */}
            <ShareProfileButton
              profileUrl={profileUrl}
              loanOfficerName={branch.name}
              title={`${branch.name} - Branch Profile`}
            />

            {/* Hours Card */}
            {formattedHours.length > 0 && (
              <Card className="border-t-4 border-t-repwell-sage-200">
                <CardHeader>
                  <CardTitle className="text-lg font-display text-repwell-teal-500 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-repwell-teal-300" />
                    Hours of Operation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    {formattedHours.map((line, index) => (
                      <p key={index} className="text-repwell-teal-400">
                        {line}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Description */}
            {branch.description && (
              <Card className="border-t-4 border-t-repwell-sage-200">
                <CardHeader>
                  <CardTitle className="text-lg font-display text-repwell-teal-500">About</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-repwell-teal-400 leading-relaxed">
                    {branch.description}
                  </p>
                </CardContent>
              </Card>
            )}

          </div>

          {/* Main Content Area */}
          <div className="space-y-8 lg:col-span-2">
            {/* Loan Officers Section */}
            <Card className="border-t-4 border-t-repwell-sage-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-display text-repwell-teal-500 flex items-center gap-2">
                  <Users className="h-5 w-5 text-repwell-teal-300" />
                  Our Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                {professionals.length === 0 ? (
                  <p className="py-8 text-center text-repwell-teal-300">
                    No team members listed at this branch.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {sortedProfessionals.map((member) => {
                      const isManager = member.id === branch.manager_id;
                      return (
                      <Link
                        key={member.id}
                        href={`/pro/${member.slug || member.id}`}
                        className="group block"
                      >
                        <div className={`flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-repwell-sage-100/50 ${isManager ? 'border-repwell-teal-300/30 bg-repwell-sage-100/50' : ''}`}>
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={member.photo_url || undefined} alt={member.full_name} />
                            <AvatarFallback className="bg-repwell-sage-100 text-repwell-teal-400">
                              {getInitials(member.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium truncate text-repwell-teal-500 group-hover:text-repwell-teal-400 transition-colors">
                                {member.full_name}
                              </h4>
                              {isManager && (
                                <Badge variant="secondary" className="shrink-0 text-xs bg-repwell-sage-100 text-repwell-teal-400">
                                  Branch Manager
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-repwell-teal-300 truncate">
                              {member.title || "Professional"}
                            </p>
                            {member.average_rating && member.total_reviews ? (
                              <div className="mt-1 flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Star weight="fill" className="h-3 w-3 text-amber-500" />
                                  <span className="text-xs font-medium text-repwell-teal-500">
                                    {Number(member.average_rating).toFixed(1)}
                                  </span>
                                </div>
                                <span className="text-xs text-repwell-teal-300">
                                  ({member.total_reviews} {member.total_reviews === 1 ? "review" : "reviews"})
                                </span>
                              </div>
                            ) : null}
                          </div>
                          <ChevronRight className="h-5 w-5 text-repwell-teal-300 group-hover:text-repwell-teal-400 transition-colors" />
                        </div>
                      </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card className="border-t-4 border-t-repwell-sage-200">
              <CardHeader>
                <CardTitle className="text-xl font-display text-repwell-teal-500">Recent Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length === 0 ? (
                  <p className="py-8 text-center text-repwell-teal-300">
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
                              <span className="text-sm font-medium text-repwell-teal-500">
                                {review.rating}/5
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-repwell-teal-300">
                              {review.customer_name || "Anonymous"}
                              {review.customer_location && (
                                <span> - {review.customer_location}</span>
                              )}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 text-xs text-repwell-teal-300">
                            <SourceIcon source={review.source} />
                            <span>{formatDate(review.review_date)}</span>
                          </div>
                        </div>

                        {review.title && (
                          <h4 className="mt-3 font-medium text-repwell-teal-500">{review.title}</h4>
                        )}

                        {review.text && (
                          <div className="mt-2 flex items-start gap-2">
                            <Quote className="h-4 w-4 shrink-0 text-repwell-teal-300/50" />
                            <p className="text-sm text-repwell-teal-400 leading-relaxed">
                              {review.text}
                            </p>
                          </div>
                        )}

                        {/* Link to LO who received this review */}
                        <div className="mt-3 flex items-center gap-2">
                          <Link
                            href={`/pro/${review.loan_officer.slug || review.loan_officer.id}`}
                            className="flex items-center gap-2 text-sm text-repwell-teal-400 hover:text-repwell-teal-300 transition-colors"
                          >
                            <Avatar className="h-6 w-6">
                              <AvatarImage
                                src={review.loan_officer.photo_url || undefined}
                                alt={review.loan_officer.full_name}
                              />
                              <AvatarFallback className="text-xs bg-repwell-sage-100 text-repwell-teal-400">
                                {getInitials(review.loan_officer.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span>Review for {review.loan_officer.full_name}</span>
                          </Link>
                        </div>

                        {review.response_text && (
                          <div className="mt-4 rounded-lg bg-repwell-sage-100/50 p-3">
                            <p className="text-xs font-medium text-repwell-teal-300 mb-1">
                              Response from {review.loan_officer.full_name}
                            </p>
                            <p className="text-sm text-repwell-teal-400">{review.response_text}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* CTA Section */}
            <Card className="bg-repwell-sage-100 border-repwell-sage-200">
              <CardContent className="py-6">
                <div className="text-center">
                  <h3 className="text-lg font-display font-semibold text-repwell-teal-500">Looking for a Professional?</h3>
                  <p className="mt-2 text-sm text-repwell-teal-400">
                    Contact one of our experienced professionals to start your journey.
                  </p>
                  {branch.phone && (
                    <Button asChild className="mt-4 bg-repwell-teal-400 hover:bg-repwell-teal-500 text-white">
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

    </div>
  );
}
