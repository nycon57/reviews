import Image from "next/image";

import { Badge } from "@/components/ui/badge";
import {
  OfficeLocationMap,
  ProfileHeroBanner,
  ProfileMessageAction,
  PublicProfileContactCard,
  ShareProfileButton,
} from "@/components/public-profile";
import { RatingStars } from "@/components/reviews/rating-stars";
import {
  DirectoryBreadcrumbs,
  type DirectoryBreadcrumbItem,
} from "@/components/shared/directory-breadcrumbs";
import { TierBadgeSSR } from "@/components/shared/tier-badge-ssr";
import { getInitials } from "@/lib/utils";
import {
  buildDirectionsUrl,
  type ContactAddress,
} from "@/lib/contact-display";
import type {
  BusinessHours,
  OrgDisplay,
  PublicProfessional,
  PublicReview,
} from "@/lib/seo/actions";
import {
  BusinessHoursCard,
  FeaturedReviewsCarousel,
  ProCompactHeaderIsland,
  ProReviewsIsland,
  VideoTestimonialSlot,
} from "./components";

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
  profileUrl?: string;
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
  profileUrl,
}: ProProfileContentProps) {
  const address = professional.address as ContactAddress | null;
  const directionsUrl = buildDirectionsUrl(address, professional.google_maps_url);
  const resolvedProfileUrl =
    profileUrl || `/pro/${professional.slug || professional.id}`;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="relative">
        <ProfileHeroBanner
          bannerUrl={professional.banner_url}
        />

        {breadcrumbs && breadcrumbs.length > 0 && (
          <div className="absolute left-0 right-0 top-0 z-10">
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

      <div className="relative z-10 -mt-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-xl bg-white p-6 shadow-lg md:p-8">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <div>
                <div className="-mt-16 flex h-28 w-28 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-repwell-sage-100 shadow-lg sm:-mt-20 md:h-32 md:w-32">
                  {professional.photo_url ? (
                    <img
                      src={professional.photo_url}
                      alt={professional.full_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-semibold text-repwell-teal-400 md:text-3xl">
                      {getInitials(professional.full_name)}
                    </span>
                  )}
                </div>
              </div>

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  <h1 className="text-2xl font-display font-bold tracking-tight text-repwell-teal-500 md:text-3xl">
                    {professional.full_name}
                  </h1>
                  <TierBadgeSSR
                    isEnterprise={isEnterprise}
                    isPro={isPro}
                    size="md"
                  />
                </div>
                <p className="text-sm text-repwell-teal-400">
                  {professional.title || "Professional"}
                  {professional.nmls_id && (
                    <span> · NMLS# {professional.nmls_id}</span>
                  )}
                </p>

                {professional.average_rating && professional.total_reviews ? (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                    <div className="flex items-center gap-2">
                      <RatingStars
                        rating={Number(professional.average_rating)}
                        size="md"
                      />
                      <span className="text-lg font-semibold text-repwell-teal-500">
                        {Number(professional.average_rating).toFixed(1)}
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-repwell-sage-100 text-repwell-teal-400"
                    >
                      {professional.total_reviews}{" "}
                      {professional.total_reviews === 1 ? "Review" : "Reviews"}
                    </Badge>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-repwell-teal-300">
                    No reviews yet
                  </p>
                )}

                {professional.bio && (
                  <p className="mt-3 text-sm leading-relaxed text-repwell-teal-400">
                    {professional.bio}
                  </p>
                )}
              </div>

              {organization?.logoUrl && (
                <div className="hidden shrink-0 sm:block">
                  <div className="relative h-16 w-32 overflow-hidden md:h-20 md:w-40">
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

      {featuredReviews.length > 0 && (
        <FeaturedReviewsCarousel reviews={featuredReviews} className="mt-8" />
      )}

      {professional.video_testimonial_url && (
        <VideoTestimonialSlot
          videoUrl={professional.video_testimonial_url}
          thumbnailUrl={professional.video_thumbnail_url}
        />
      )}

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:sticky lg:top-20 lg:col-span-1 lg:self-start">
            <ProCompactHeaderIsland
              fullName={professional.full_name}
              photoUrl={professional.photo_url}
              title={professional.title}
              averageRating={professional.average_rating}
              totalReviews={professional.total_reviews}
            />

            <PublicProfileContactCard
              phone={professional.phone}
              address={address}
              organization={
                organization
                  ? { name: organization.name, href: organization.href }
                  : null
              }
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
              messageAction={
                <ProfileMessageAction
                  recipientId={professional.id}
                  recipientName={professional.full_name}
                />
              }
              shareAction={
                <ShareProfileButton
                  profileUrl={resolvedProfileUrl}
                  loanOfficerName={professional.full_name}
                />
              }
            />

            <OfficeLocationMap
              address={address}
              googleMapsUrl={professional.google_maps_url || directionsUrl}
              latitude={professional.latitude}
              longitude={professional.longitude}
            />

            <BusinessHoursCard hours={businessHours} />
          </div>

          <div className="lg:col-span-2">
            <ProReviewsIsland
              reviews={reviews}
              professionalId={professional.id}
              professionalName={professional.full_name}
              profileUrl={resolvedProfileUrl}
              acceptsPublicReviews={professional.accepts_public_reviews}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
