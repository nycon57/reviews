import Image from "next/image";
import {
  BuildingOffice as Building2,
  Clock,
  MapPin,
  SealCheck,
  Users,
} from "@phosphor-icons/react/dist/ssr";

import {
  OfficeLocationMap,
  ProfileHeroBanner,
  ProfileMessageAction,
} from "@/app/pro/[slug]/components";
import { ShareProfileButton } from "@/app/pro/[slug]/components/share-profile-button";
import { PublicProfileContactCard } from "@/components/public-profile/contact-card";
import { RatingStars } from "@/components/reviews/rating-stars";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DirectoryBreadcrumbs,
  type DirectoryBreadcrumbItem,
} from "@/components/shared/directory-breadcrumbs";
import { getBranchPublicPath } from "@/lib/branches/utils";
import type {
  PublicBranch,
  PublicBranchProfessional,
  PublicBranchReview,
} from "@/lib/seo/actions";
import type { Tables } from "@/types/database.types";
import { BranchReviewsIsland } from "./branch-reviews-island";
import { BranchTeamList } from "./branch-team-list";

interface BranchProfileContentProps {
  branch: PublicBranch;
  organization:
    | (Pick<
        Tables<"organizations">,
        "id" | "name" | "logo_url" | "avatar_url" | "banner_url" | "domain"
      > & { slug: string })
    | null;
  professionals: PublicBranchProfessional[];
  reviews: PublicBranchReview[];
  breadcrumbs?: DirectoryBreadcrumbItem[];
  isEnterprise?: boolean;
  profileUrl?: string;
}

interface Address {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
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

  const dayOrder = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];
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
      if (schedule.closed) return `${dayNames[day]}: Closed`;
      if (schedule.open && schedule.close) {
        return `${dayNames[day]}: ${schedule.open} - ${schedule.close}`;
      }
      return `${dayNames[day]}: Hours vary`;
    });
}

function getDirectionsUrl(
  googleMapsUrl: string | null,
  address: Address | null
) {
  if (googleMapsUrl) return googleMapsUrl;
  if (!address || (!address.street && !address.city)) return null;

  const query = [
    address.street,
    [address.city, address.state].filter(Boolean).join(", "),
    address.zip,
  ]
    .filter(Boolean)
    .join(" ");

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    query
  )}`;
}

export function BranchProfileContent({
  branch,
  organization,
  professionals,
  reviews,
  breadcrumbs,
  isEnterprise = false,
  profileUrl,
}: BranchProfileContentProps) {
  const resolvedProfileUrl = profileUrl || getBranchPublicPath(branch);
  const address = branch.address as Address | null;
  const locationString = address
    ? [address.city, address.state].filter(Boolean).join(", ")
    : "";
  const directionsUrl = getDirectionsUrl(branch.google_maps_url, address);
  const hours = branch.hours_of_operation as HoursOfOperation | null;
  const formattedHours = formatHours(hours);
  const branchLocation = branch as PublicBranch & {
    latitude?: number | null;
    longitude?: number | null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="relative">
        <ProfileHeroBanner
          bannerUrl={branch.cover_image_url || organization?.banner_url}
          orgLogo={organization?.logo_url}
          orgName={organization?.name}
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
                <div className="-mt-16 h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-white shadow-lg sm:-mt-20 md:h-32 md:w-32">
                  {branch.photo_url || organization?.avatar_url ? (
                    <img
                      src={(branch.photo_url || organization?.avatar_url)!}
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

              <div className="min-w-0 flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center gap-2 sm:justify-start">
                  <h1 className="text-2xl font-display font-bold tracking-tight text-repwell-teal-500 md:text-3xl">
                    {branch.name}
                  </h1>
                  {isEnterprise && (
                    <SealCheck
                      weight="fill"
                      className="h-6 w-6 shrink-0 text-repwell-teal-300"
                    />
                  )}
                </div>

                {(locationString || organization) && (
                  <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    {locationString && (
                      <>
                        <MapPin className="h-4 w-4 text-repwell-teal-300" />
                        <span className="text-repwell-teal-400">
                          {locationString}
                        </span>
                      </>
                    )}
                    {locationString && organization && (
                      <span className="text-repwell-teal-300">·</span>
                    )}
                    {organization && (
                      <>
                        <Building2 className="h-4 w-4 text-repwell-teal-300" />
                        <span className="text-repwell-teal-400">
                          {organization.name}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {branch.average_rating && branch.total_reviews ? (
                  <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                    <div className="flex items-center gap-2">
                      <RatingStars rating={Number(branch.average_rating)} size="md" />
                      <span className="text-lg font-semibold text-repwell-teal-500">
                        {Number(branch.average_rating).toFixed(1)}
                      </span>
                    </div>
                    <Badge
                      variant="secondary"
                      className="bg-repwell-sage-100 text-repwell-teal-400"
                    >
                      {branch.total_reviews}{" "}
                      {branch.total_reviews === 1 ? "Review" : "Reviews"}
                    </Badge>
                    {branch.total_members && branch.total_members > 0 && (
                      <Badge
                        variant="outline"
                        className="border-repwell-sage-200 text-repwell-teal-400"
                      >
                        <Users className="mr-1 h-3 w-3" />
                        {branch.total_members}{" "}
                        {branch.total_members === 1
                          ? "Professional"
                          : "Professionals"}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-repwell-teal-300">
                    No reviews yet
                  </p>
                )}

                {branch.description && (
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-repwell-teal-400">
                    {branch.description}
                  </p>
                )}
              </div>

              {organization?.logo_url && (
                <div className="hidden shrink-0 sm:block">
                  <div className="relative h-16 w-32 overflow-hidden md:h-20 md:w-40">
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

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-6 lg:sticky lg:top-20 lg:col-span-1 lg:self-start">
            <PublicProfileContactCard
              phone={branch.phone}
              address={address}
              organization={
                organization
                  ? { name: organization.name, href: `/org/${organization.slug}` }
                  : null
              }
              contactLabel={`Contact ${branch.name}`}
              personalWebsiteUrl={branch.website_url}
              directionsUrl={directionsUrl}
              linkedinUrl={branch.linkedin_url}
              facebookUrl={branch.facebook_url}
              instagramUrl={branch.instagram_url}
              twitterUrl={branch.twitter_url}
              zillowUrl={branch.zillow_profile_url}
              messageAction={
                <ProfileMessageAction
                  recipientType="branch"
                  recipientId={branch.id}
                  recipientName={branch.name}
                />
              }
              shareAction={
                <ShareProfileButton
                  profileUrl={resolvedProfileUrl}
                  loanOfficerName={branch.name}
                  title={`${branch.name} - Branch Profile`}
                />
              }
            />

            <OfficeLocationMap
              address={address}
              googleMapsUrl={branch.google_maps_url || directionsUrl}
              latitude={branchLocation.latitude ?? null}
              longitude={branchLocation.longitude ?? null}
            />

            {formattedHours.length > 0 && (
              <Card className="border-t-4 border-t-repwell-sage-200">
                <CardHeader variant="plain">
                  <CardTitle className="flex items-center gap-2 text-lg font-display text-repwell-teal-500">
                    <Clock className="h-5 w-5 text-repwell-teal-300" />
                    Hours of Operation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1 text-sm">
                    {formattedHours.map((line) => (
                      <p key={line} className="text-repwell-teal-400">
                        {line}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-8 lg:col-span-2">
            <BranchTeamList
              managerId={branch.manager_id}
              professionals={professionals}
            />
            <BranchReviewsIsland
              reviews={reviews}
              branchName={branch.name}
              profileUrl={resolvedProfileUrl}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
