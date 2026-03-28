"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "@phosphor-icons/react";
import { AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import type { PublicProfessional, PublicReview, BusinessHours, OrgDisplay } from "@/lib/seo/actions";
import { TierBadge } from "@/components/shared/tier-badge";
import { useIsDesktop } from "@/hooks/use-is-desktop";
import {
  ProfileHeroBanner,
  FeaturedReviewsCarousel,
  ReviewsList,
  ContactCTACard,
  BusinessHoursCard,
  ReferFriendModal,
  WriteReviewModal,
  MessageModal,
  ReportReviewModal,
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
  organization: OrgDisplay | null;
  branch: { name: string; slug: string } | null;
  reviews: PublicReview[];
  featuredReviews: PublicReview[];
  businessHours: BusinessHours | null;
  breadcrumbs?: DirectoryBreadcrumbItem[];
  isEnterprise?: boolean;
  isPro?: boolean;
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
  branch,
  reviews,
  featuredReviews,
  businessHours,
  breadcrumbs,
  isEnterprise = false,
  isPro = false,
}: ProProfileContentProps) {
  const [isReferModalOpen, setIsReferModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [reportReviewId, setReportReviewId] = useState<string | null>(null);
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

  // Compute directions URL from google_maps_url or address
  const directionsUrl = professional.google_maps_url
    || (address && (address.street || address.city)
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([address.street, [address.city, address.state].filter(Boolean).join(", "), address.zip].filter(Boolean).join(" "))}`
      : null);

  // Profile URL for sharing (prefer slug for SEO-friendly URL)
  const profileUrl = typeof window !== "undefined"
    ? window.location.href
    : `/pro/${professional.slug}`;

  const handleWriteReview = useCallback(() => {
    setIsReviewModalOpen(true);
  }, []);

  const handleFlagReview = useCallback((reviewId: string) => {
    setReportReviewId(reviewId);
  }, []);

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
        {/* Hero Banner with overlaid breadcrumbs — flush to viewport top */}
        <div className="relative">
          <ProfileHeroBanner
            bannerUrl={professional.banner_url}
            orgLogo={organization?.logoUrl}
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

        {/* Header Section - always visible, scrolls off naturally */}
        <div className="relative -mt-16 z-10">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
                  <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                    {/* Avatar */}
                    <div>
                      <Avatar className="h-28 w-28 md:h-32 md:w-32 rounded-2xl border-4 border-white shadow-lg -mt-16 sm:-mt-20">
                        <AvatarImage src={professional.photo_url || undefined} alt={professional.full_name} />
                        <AvatarFallback className="rounded-2xl text-2xl md:text-3xl font-semibold bg-repwell-sage-100 text-repwell-teal-400">
                          {getInitials(professional.full_name)}
                        </AvatarFallback>
                      </Avatar>
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1 text-center sm:text-left min-w-0">
                      <div className="flex items-center justify-center gap-2 sm:justify-start">
                        <h1 className="text-2xl md:text-3xl font-display font-bold text-repwell-teal-500 tracking-tight">
                          {professional.full_name}
                        </h1>
                        <TierBadge isEnterprise={isEnterprise} isPro={isPro} size="md" />
                      </div>
                      <p className="text-sm text-repwell-teal-400">
                        {professional.title || "Professional"}
                        {professional.nmls_id && (
                          <span> · NMLS# {professional.nmls_id}</span>
                        )}
                      </p>

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
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-repwell-teal-300">No reviews yet</p>
                      )}

                      {professional.bio && (
                        <p className="mt-3 text-sm text-repwell-teal-400 leading-relaxed">
                          {professional.bio}
                        </p>
                      )}
                    </div>

                    {/* Organization Logo */}
                    {organization?.logoUrl && (
                      <div className="hidden sm:block shrink-0">
                        <div className="relative h-16 w-32 md:h-20 md:w-40 overflow-hidden">
                          <Image
                            src={organization.logoUrl}
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
                    averageRating={professional.average_rating}
                    totalReviews={professional.total_reviews}
                  />
                )}
              </AnimatePresence>

              {/* Contact CTA Card */}
              <ContactCTACard
                phone={professional.phone}
                address={address}
                organization={organization ? { name: organization.name, href: organization.href } : null}
                branch={branch}
                professionalName={professional.full_name}
                ctaText={professional.cta_button_text}
                ctaUrl={professional.cta_button_url}
                directionsUrl={directionsUrl}
                linkedinUrl={professional.linkedin_url}
                facebookUrl={professional.facebook_url}
                instagramUrl={professional.instagram_url}
                twitterUrl={professional.twitter_url}
                personalWebsiteUrl={professional.personal_website_url}
                zillowUrl={professional.zillow_profile_url}
                onMessage={() => setIsMessageModalOpen(true)}
                shareButton={
                  <ShareProfileButton
                    profileUrl={profileUrl}
                    loanOfficerName={professional.full_name}
                  />
                }
              />

              {/* Business Hours */}
              <BusinessHoursCard hours={businessHours} />

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
                onReferFriend={() => setIsReferModalOpen(true)}
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

        <MessageModal
          open={isMessageModalOpen}
          onOpenChange={setIsMessageModalOpen}
          professionalId={professional.id}
          professionalName={professional.full_name}
        />

        <ReportReviewModal
          open={reportReviewId !== null}
          onOpenChange={(open) => { if (!open) setReportReviewId(null); }}
          reviewId={reportReviewId ?? ""}
        />
      </div>
    </>
  );
}
