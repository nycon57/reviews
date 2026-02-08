"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Star,
  LinkedinLogo as Linkedin,
  ArrowSquareOut as ExternalLink,
  BuildingOffice as Building2,
  Medal as Award,
  Users,
} from "@phosphor-icons/react";
import { AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import type { PublicProfessional, PublicReview, BusinessHours } from "@/lib/seo/actions";
import type { Tables } from "@/types/database.types";
import type { IndustryType } from "@/lib/industry/types";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import {
  ProfileHeroBanner,
  FeaturedReviewsCarousel,
  ReviewsList,
  ContactCTACard,
  BusinessHoursCard,
  OfficeLocationMap,
  ReferFriendModal,
  WriteReviewModal,
  VideoTestimonialSlot,
  ShareProfileButton,
  CompactProfileCard,
} from "./components";
import {
  DirectoryBreadcrumbs,
  type DirectoryBreadcrumbItem,
} from "@/components/shared/directory-breadcrumbs";

const SCROLL_THRESHOLD = 200;

interface ProProfileContentProps {
  professional: PublicProfessional;
  organization: (Pick<Tables<"organizations">, "id" | "name" | "logo_url" | "domain"> & {
    slug: string;
    industry: IndustryType | null;
  }) | null;
  reviews: PublicReview[];
  featuredReviews: PublicReview[];
  businessHours: BusinessHours | null;
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProProfileContent({
  professional,
  organization,
  reviews,
  featuredReviews,
  businessHours,
  breadcrumbs,
}: ProProfileContentProps) {
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  const isDesktop = useIsDesktop();
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsCompact((prev) => {
      if (!prev && latest > SCROLL_THRESHOLD) return true;
      if (prev && latest < SCROLL_THRESHOLD - 100) return false;
      return prev;
    });
  });

  const shouldMorph = isDesktop && isCompact;

  const address = professional.address as {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  } | null;

  const locationString = address
    ? [address.city, address.state].filter(Boolean).join(", ")
    : [professional.branch, professional.region].filter(Boolean).join(", ");

  // Profile URL for sharing (prefer slug for SEO-friendly URL)
  const profileUrl = typeof window !== "undefined"
    ? window.location.href
    : `/pro/${professional.slug || professional.id}`;

  const handleWriteReview = useCallback(() => {
    setIsReviewModalOpen(true);
  }, []);

  const handleFlagReview = useCallback((reviewId: string) => {
    // For now, we just log - could open a flag modal
    console.log("Flag review:", reviewId);
  }, []);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* Hero Banner with overlaid breadcrumbs — flush to viewport top */}
        <div className="relative">
          <ProfileHeroBanner
            bannerUrl={professional.banner_url}
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

        {/* Header Section - always visible, scrolls off naturally */}
        <div className="relative -mt-16 z-10">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                  <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                    {/* Avatar */}
                    <div>
                      <Avatar className="h-28 w-28 md:h-32 md:w-32 border-4 border-white shadow-lg -mt-16 sm:-mt-20">
                        <AvatarImage src={professional.photo_url || undefined} alt={professional.full_name} />
                        <AvatarFallback className="text-2xl md:text-3xl font-semibold bg-repwell-sage-100 text-repwell-teal-400">
                          {getInitials(professional.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1 text-center sm:text-left min-w-0">
                      <h1 className="text-2xl md:text-3xl font-display font-bold text-repwell-teal-500 tracking-tight">
                        {professional.full_name}
                      </h1>
                      <p className="text-lg text-repwell-teal-400">
                        {professional.title || "Professional"}
                      </p>

                      {organization && (
                        <div className="mt-2 flex items-center justify-center gap-2 sm:justify-start">
                          <Building2 className="h-4 w-4 text-repwell-teal-300" />
                          <span className="text-repwell-teal-400">{organization.name}</span>
                        </div>
                      )}

                      {/* Rating Summary */}
                      {professional.average_rating && professional.total_reviews ? (
                        <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                          <div className="flex items-center gap-2">
                            <StarRating rating={Math.round(Number(professional.average_rating))} />
                            <span className="text-lg font-semibold text-repwell-teal-500">
                              {Number(professional.average_rating).toFixed(1)}
                            </span>
                          </div>
                          <Badge variant="secondary" className="bg-repwell-sage-100 text-repwell-teal-400">
                            {professional.total_reviews} {professional.total_reviews === 1 ? "Review" : "Reviews"}
                          </Badge>
                          {professional.nps_score !== null && (
                            <Badge variant="outline" className="border-repwell-sage-200 text-repwell-teal-400">
                              NPS: {professional.nps_score}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-repwell-teal-300">No reviews yet</p>
                      )}

                      {/* NMLS Badge */}
                      {professional.nmls_id && (
                        <div className="mt-3 flex items-center justify-center gap-2 sm:justify-start">
                          <Award className="h-4 w-4 text-repwell-teal-300" />
                          <span className="text-sm text-repwell-teal-400">
                            NMLS# {professional.nmls_id}
                          </span>
                        </div>
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

        {/* Featured Reviews Carousel */}
        {featuredReviews.length > 0 && (
          <FeaturedReviewsCarousel reviews={featuredReviews} className="mt-8" />
        )}

        {/* Video Testimonial */}
        {professional.video_testimonial_url && (
          <VideoTestimonialSlot
            videoUrl={professional.video_testimonial_url}
            thumbnailUrl={professional.video_thumbnail_url}
          />
        )}

        {/* Main Content */}
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Sidebar */}
            <div className="lg:sticky lg:top-20 lg:self-start space-y-6 lg:col-span-1">
              {/* Compact Profile Card - shows when scrolled on desktop */}
              <AnimatePresence>
                {shouldMorph && (
                  <CompactProfileCard
                    fullName={professional.full_name}
                    photoUrl={professional.photo_url}
                    title={professional.title}
                    organizationName={organization?.name || null}
                    averageRating={professional.average_rating}
                    totalReviews={professional.total_reviews}
                    npsScore={professional.nps_score}
                    nmlsId={professional.nmls_id}
                  />
                )}
              </AnimatePresence>

              {/* Contact CTA Card */}
              <ContactCTACard
                phone={professional.phone}
                email={professional.email}
                location={locationString}
                ctaText={professional.cta_button_text}
                ctaUrl={professional.cta_button_url}
              />

              {/* Business Hours */}
              <BusinessHoursCard hours={businessHours} />

              {/* Office Location Map */}
              <OfficeLocationMap address={address} />

              {/* Action Buttons */}
              <div className="space-y-3">
                {professional.referral_enabled && (
                  <Button
                    onClick={() => setIsReferModalOpen(true)}
                    variant="outline"
                    className="w-full border-repwell-teal-300 text-repwell-teal-400 hover:bg-repwell-sage-100"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Refer a Friend
                  </Button>
                )}

                <ShareProfileButton
                  profileUrl={profileUrl}
                  loanOfficerName={professional.full_name}
                />
              </div>

              {/* External Links */}
              {(professional.linkedin_url || professional.zillow_profile_url) && (
                <Card className="border-t-4 border-t-repwell-sage-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-display text-repwell-teal-500">
                      Links
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {professional.linkedin_url && (
                      <a
                        href={professional.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm text-repwell-teal-400 hover:text-repwell-teal-300 hover:underline"
                      >
                        <Linkedin className="h-5 w-5" />
                        LinkedIn Profile
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                    {professional.zillow_profile_url && (
                      <a
                        href={professional.zillow_profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 text-sm text-repwell-teal-400 hover:text-repwell-teal-300 hover:underline"
                      >
                        <ExternalLink className="h-5 w-5" />
                        Zillow Profile
                      </a>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Bio */}
              {professional.bio && (
                <Card className="border-t-4 border-t-repwell-sage-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-display text-repwell-teal-500">
                      About
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-repwell-teal-400 leading-relaxed">
                      {professional.bio}
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Reviews Section */}
            <div className="lg:col-span-2">
              <ReviewsList
                reviews={reviews}
                loanOfficerName={professional.full_name}
                profileUrl={profileUrl}
                zillowUrl={professional.zillow_profile_url}
                linkedinUrl={professional.linkedin_url}
                acceptsPublicReviews={professional.accepts_public_reviews}
                onWriteReview={handleWriteReview}
                onFlagReview={handleFlagReview}
              />
            </div>
          </div>
        </div>

        {/* Modals */}
        <ReferFriendModal
          open={isReferModalOpen}
          onOpenChange={setIsReferModalOpen}
          loanOfficerId={professional.id}
          loanOfficerName={professional.full_name}
        />

        <WriteReviewModal
          open={isReviewModalOpen}
          onOpenChange={setIsReviewModalOpen}
          loanOfficerId={professional.id}
          loanOfficerName={professional.full_name}
        />
      </div>
    </>
  );
}
