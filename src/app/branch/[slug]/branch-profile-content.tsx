"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star,
  MapPin,
  Clock,
  Users,
  BuildingOffice as Building2,
  CaretRight as ChevronRight,
} from "@phosphor-icons/react";
import { getInitials } from "@/lib/utils";
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
import { ReviewItem } from "@/components/shared/review-item";
import { ProfileHeroBanner, ContactCTACard, MessageModal, ReportReviewModal } from "@/app/pro/[slug]/components";

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
  const [messageOpen, setMessageOpen] = useState(false);
  const [reportReviewId, setReportReviewId] = useState<string | null>(null);

  const handleFlagReview = useCallback((reviewId: string) => {
    setReportReviewId(reviewId);
  }, []);

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

  const directionsUrl = branch.google_maps_url
    || (address && (address.street || address.city)
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([address.street, [address.city, address.state].filter(Boolean).join(", "), address.zip].filter(Boolean).join(" "))}`
      : null);

  const hours = branch.hours_of_operation as HoursOfOperation | null;
  const formattedHours = formatHours(hours);

  // Show More pagination
  const [teamDisplayCount, setTeamDisplayCount] = useState(12);

  // Sort professionals: manager first
  const sortedProfessionals = [...professionals].sort((a, b) => {
    if (a.id === branch.manager_id) return -1;
    if (b.id === branch.manager_id) return 1;
    return 0;
  });

  const displayedProfessionals = sortedProfessionals.slice(0, teamDisplayCount);

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
              <div className="inline-flex rounded-md bg-black/50 px-3 py-1.5">
                <DirectoryBreadcrumbs
                  items={breadcrumbs}
                  className="[&_a]:text-white/70 [&_a:hover]:text-white [&_span[aria-current]]:text-white [&_svg]:text-white/50"
                />
              </div>
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
                {(locationString || organization) && (
                  <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start flex-wrap">
                    {locationString && (
                      <>
                        <MapPin className="h-4 w-4 text-repwell-teal-300" />
                        <span className="text-repwell-teal-400">{locationString}</span>
                      </>
                    )}
                    {locationString && organization && (
                      <span className="text-repwell-teal-300">·</span>
                    )}
                    {organization && (
                      <>
                        <Building2 className="h-4 w-4 text-repwell-teal-300" />
                        <span className="text-repwell-teal-400">{organization.name}</span>
                      </>
                    )}
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
                {branch.description && (
                  <p className="mt-3 text-sm text-repwell-teal-400 leading-relaxed line-clamp-3">
                    {branch.description}
                  </p>
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
            <ContactCTACard
              phone={branch.phone}
              address={address}
              organization={organization ? { name: organization.name, href: `/org/${organization.slug}` } : null}
              contactLabel={`Contact ${branch.name}`}
              personalWebsiteUrl={branch.website_url}
              directionsUrl={directionsUrl}
              linkedinUrl={branch.linkedin_url}
              facebookUrl={branch.facebook_url}
              instagramUrl={branch.instagram_url}
              twitterUrl={branch.twitter_url}
              zillowUrl={branch.zillow_profile_url}
              onMessage={() => setMessageOpen(true)}
              shareButton={
                <ShareProfileButton
                  profileUrl={profileUrl}
                  loanOfficerName={branch.name}
                  title={`${branch.name} - Branch Profile`}
                />
              }
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
                  <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {displayedProfessionals.map((member) => {
                      const isManager = member.id === branch.manager_id;
                      return (
                      <Link
                        key={member.id}
                        href={`/pro/${member.slug || member.id}`}
                        className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-repwell-sage-100/50"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.photo_url || undefined} alt={member.full_name} />
                          <AvatarFallback className="bg-repwell-sage-100 text-repwell-teal-400 text-sm">
                            {getInitials(member.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-sm font-medium truncate text-repwell-teal-500 group-hover:text-repwell-teal-400 transition-colors">
                              {member.full_name}
                            </h4>
                            {isManager && (
                              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-repwell-sage-300">
                                <span className="h-1.5 w-1.5 rounded-full bg-repwell-sage-300" />
                                Mgr
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-repwell-teal-300 truncate">
                            {member.title || "Professional"}
                          </p>
                          {member.average_rating && member.total_reviews ? (
                            <div className="mt-0.5 flex items-center gap-1">
                              <Star weight="fill" className="h-3 w-3 text-amber-500" />
                              <span className="text-xs font-medium text-repwell-teal-500">
                                {Number(member.average_rating).toFixed(1)}
                              </span>
                              <span className="text-xs text-repwell-teal-300">
                                ({member.total_reviews})
                              </span>
                            </div>
                          ) : null}
                        </div>
                        <ChevronRight className="h-4 w-4 text-repwell-teal-300 group-hover:text-repwell-teal-400 transition-colors" />
                      </Link>
                      );
                    })}
                  </div>
                  {sortedProfessionals.length > teamDisplayCount && (
                    <Button
                      variant="outline"
                      className="w-full mt-4"
                      onClick={() => setTeamDisplayCount(prev => prev + 12)}
                    >
                      Show More Team Members ({sortedProfessionals.length - teamDisplayCount} remaining)
                    </Button>
                  )}
                  </>
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
                      <ReviewItem
                        key={review.id}
                        review={{
                          id: review.id,
                          customer_name: review.customer_name,
                          customer_location: review.customer_location,
                          rating: review.rating,
                          text: review.text,
                          title: review.title,
                          review_date: review.review_date,
                          source: review.source,
                          response_text: review.response_text,
                        }}
                        respondentName={review.loan_officer.full_name}
                        attribution={{
                          loanOfficer: {
                            name: review.loan_officer.full_name,
                            href: `/pro/${review.loan_officer.slug || review.loan_officer.id}`,
                            photoUrl: review.loan_officer.photo_url,
                          },
                        }}
                        shareConfig={{ profileUrl, subjectName: branch.name }}
                        onFlag={handleFlagReview}
                      />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>

      {/* Message Modal */}
      <MessageModal
        open={messageOpen}
        onOpenChange={setMessageOpen}
        recipientType="branch"
        recipientId={branch.id}
        recipientName={branch.name}
      />

      {/* Report Review Modal */}
      <ReportReviewModal
        open={reportReviewId !== null}
        onOpenChange={(open) => { if (!open) setReportReviewId(null); }}
        reviewId={reportReviewId ?? ""}
      />
    </div>
  );
}
