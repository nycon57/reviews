import Image from "next/image";
import {
  BuildingOffice as Building2,
  Medal as Award,
  SealCheck,
  Users,
} from "@phosphor-icons/react/dist/ssr";

import { ProfileHeroBanner, ProfileMessageAction } from "@/app/pro/[slug]/components";
import { ShareProfileButton } from "@/app/pro/[slug]/components/share-profile-button";
import { PublicProfileContactCard } from "@/components/public-profile/contact-card";
import { RatingStars } from "@/components/reviews/rating-stars";
import { Badge } from "@/components/ui/badge";
import {
  DirectoryBreadcrumbs,
  type DirectoryBreadcrumbItem,
} from "@/components/shared/directory-breadcrumbs";
import type {
  PublicOrganization,
  PublicOrgBranch,
  PublicOrgProfessional,
  PublicOrgTestimonial,
} from "@/lib/seo/actions";
import { OrganizationDirectoryTabs } from "./organization-directory-tabs";
import { OrganizationReviewsIsland } from "./organization-reviews-island";

interface OrganizationProfileContentProps {
  organization: PublicOrganization;
  branches: PublicOrgBranch[];
  featuredProfessionals: PublicOrgProfessional[];
  testimonials: PublicOrgTestimonial[];
  breadcrumbs?: DirectoryBreadcrumbItem[];
  profileUrl?: string;
}

interface BranchAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

function getDirectionsUrl(address: BranchAddress | null) {
  if (!address) return null;

  const query = [
    address.street,
    address.city,
    address.state,
    address.zip,
  ]
    .filter(Boolean)
    .join(" ");

  if (!query) return null;

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query
  )}`;
}

export function OrganizationProfileContent({
  organization,
  branches,
  featuredProfessionals,
  testimonials,
  breadcrumbs,
  profileUrl,
}: OrganizationProfileContentProps) {
  const resolvedProfileUrl =
    profileUrl || `/org/${organization.slug || organization.id}`;
  const hq = organization.headquarters_branch;
  const contactPhone = organization.phone || hq?.phone || null;
  const rawAddress = (hq?.address ||
    organization.headquarters_address) as BranchAddress | null;
  const hqAddress = rawAddress
    ? {
        street: rawAddress.street,
        city: rawAddress.city,
        state: rawAddress.state,
        zip: rawAddress.zip,
      }
    : null;
  const hqDirectionsUrl = getDirectionsUrl(hqAddress);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="relative">
        <ProfileHeroBanner
          bannerUrl={organization.banner_url}
          orgLogo={organization.logo_url}
          orgName={organization.name}
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
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="-mt-16 h-28 w-28 overflow-hidden rounded-2xl border-4 border-white shadow-lg sm:-mt-20 md:h-32 md:w-32">
                {organization.avatar_url || organization.logo_url ? (
                  <div className="relative h-full w-full bg-white">
                    <Image
                      src={(organization.avatar_url || organization.logo_url)!}
                      alt={organization.name}
                      fill
                      className={
                        organization.avatar_url ? "object-cover" : "object-contain p-2"
                      }
                    />
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-repwell-sage-100">
                    <Building2 className="h-12 w-12 text-repwell-teal-400" />
                  </div>
                )}
              </div>

              <div className="max-w-2xl">
                <div className="flex items-center justify-center gap-2">
                  <h1 className="text-3xl font-display font-bold tracking-tight text-repwell-teal-500 md:text-4xl">
                    {organization.name}
                  </h1>
                  <SealCheck
                    weight="fill"
                    className="h-6 w-6 shrink-0 text-repwell-teal-300"
                  />
                </div>

                {organization.mission_statement && (
                  <p className="mt-3 text-lg italic text-repwell-teal-400">
                    &ldquo;{organization.mission_statement}&rdquo;
                  </p>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  {organization.aggregate_rating &&
                    organization.total_reviews > 0 && (
                      <div className="flex items-center gap-2">
                        <RatingStars
                          rating={Number(organization.aggregate_rating)}
                          size="md"
                        />
                        <span className="text-lg font-semibold text-repwell-teal-500">
                          {Number(organization.aggregate_rating).toFixed(1)}
                        </span>
                      </div>
                    )}

                  <Badge
                    variant="secondary"
                    className="bg-repwell-sage-100 px-3 py-1 text-repwell-teal-400"
                  >
                    <Award className="mr-1.5 h-3.5 w-3.5" />
                    {organization.total_reviews.toLocaleString()} Reviews
                  </Badge>

                  <Badge
                    variant="outline"
                    className="border-repwell-sage-200 px-3 py-1 text-repwell-teal-400"
                  >
                    <Building2 className="mr-1.5 h-3.5 w-3.5" />
                    {organization.total_branches}{" "}
                    {organization.total_branches === 1 ? "Location" : "Locations"}
                  </Badge>

                  <Badge
                    variant="outline"
                    className="border-repwell-sage-200 px-3 py-1 text-repwell-teal-400"
                  >
                    <Users className="mr-1.5 h-3.5 w-3.5" />
                    {organization.total_members} Professionals
                  </Badge>
                </div>

                {organization.description && (
                  <p className="mt-4 max-w-xl text-sm leading-relaxed text-repwell-teal-400">
                    {organization.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          <div className="order-2 space-y-6 lg:sticky lg:top-20 lg:order-1 lg:col-span-1 lg:self-start">
            <PublicProfileContactCard
              phone={contactPhone}
              address={hqAddress}
              professionalName={organization.name}
              logoUrl={organization.logo_url}
              contactLabel={`Contact ${organization.name}`}
              personalWebsiteUrl={organization.website_url}
              directionsUrl={hqDirectionsUrl}
              linkedinUrl={organization.linkedin_url}
              facebookUrl={organization.facebook_url}
              instagramUrl={organization.instagram_url}
              twitterUrl={organization.twitter_url}
              messageAction={
                <ProfileMessageAction
                  recipientType="organization"
                  recipientId={organization.id}
                  recipientName={organization.name}
                />
              }
              shareAction={
                <ShareProfileButton
                  profileUrl={resolvedProfileUrl}
                  loanOfficerName={organization.name}
                  title={`${organization.name} - Organization Profile`}
                />
              }
            />
          </div>

          <div className="order-1 space-y-10 lg:order-2 lg:col-span-2">
            <OrganizationDirectoryTabs
              branches={branches}
              featuredProfessionals={featuredProfessionals}
            />
            <OrganizationReviewsIsland
              testimonials={testimonials}
              organizationName={organization.name}
              profileUrl={resolvedProfileUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
