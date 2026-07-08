"use client";

import Link from "next/link";
import {
  BuildingOffice as Building2,
  CaretRight as ChevronRight,
  MapPin,
  Users,
} from "@phosphor-icons/react";

import {
  DirectorySearchSortToolbar,
  DirectoryShowMoreButton,
  useSearchSortPaginate,
} from "@/components/public-profile/directory-tabs-controls";
import { RatingStars } from "@/components/reviews/rating-stars";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TierBadge } from "@/components/shared/tier-badge";
import { getBranchPublicPath } from "@/lib/branches/utils";
import type {
  PublicOrgBranch,
  PublicOrgProfessional,
} from "@/lib/seo/actions";
import { getInitials } from "@/lib/utils";

interface BranchAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

interface OrganizationDirectoryTabsProps {
  branches: PublicOrgBranch[];
  featuredProfessionals: PublicOrgProfessional[];
}

function formatBranchLocation(address: BranchAddress | null): string {
  if (address) {
    const locationParts = [address.city, address.state].filter(Boolean);
    if (locationParts.length > 0) {
      return locationParts.join(", ");
    }
  }
  return "";
}

function sortBranches(a: PublicOrgBranch, b: PublicOrgBranch, sort: string) {
  switch (sort) {
    case "name-desc":
      return b.name.localeCompare(a.name);
    case "rating-high":
      return (Number(b.average_rating) || 0) - (Number(a.average_rating) || 0);
    case "rating-low":
      return (Number(a.average_rating) || 0) - (Number(b.average_rating) || 0);
    case "reviews":
      return (b.total_reviews || 0) - (a.total_reviews || 0);
    default:
      return a.name.localeCompare(b.name);
  }
}

function searchBranch(branch: PublicOrgBranch, query: string) {
  const address = branch.address as BranchAddress | null;
  return Boolean(
    branch.name.toLowerCase().includes(query) ||
    address?.city?.toLowerCase().includes(query) ||
    address?.state?.toLowerCase().includes(query)
  );
}

function sortProfessionals(
  a: PublicOrgProfessional,
  b: PublicOrgProfessional,
  sort: string
) {
  switch (sort) {
    case "name-desc":
      return b.full_name.localeCompare(a.full_name);
    case "rating-high":
      return (Number(b.average_rating) || 0) - (Number(a.average_rating) || 0);
    case "rating-low":
      return (Number(a.average_rating) || 0) - (Number(b.average_rating) || 0);
    case "reviews":
      return (b.total_reviews || 0) - (a.total_reviews || 0);
    default:
      return a.full_name.localeCompare(b.full_name);
  }
}

function searchProfessional(member: PublicOrgProfessional, query: string) {
  return Boolean(
    member.full_name.toLowerCase().includes(query) ||
    member.title?.toLowerCase().includes(query)
  );
}

export function OrganizationDirectoryTabs({
  branches,
  featuredProfessionals,
}: OrganizationDirectoryTabsProps) {
  const locations = useSearchSortPaginate(branches, {
    searchFn: searchBranch,
    sortFn: sortBranches,
  });
  const team = useSearchSortPaginate(featuredProfessionals, {
    searchFn: searchProfessional,
    sortFn: sortProfessionals,
  });

  return (
    <Card className="border-t-4 border-t-repwell-sage-200">
      <CardContent className="pt-6">
        <Tabs defaultValue="locations">
          <TabsList variant="underline" className="w-full justify-start">
            <TabsTrigger
              variant="underline"
              value="locations"
              className="flex items-center gap-2"
            >
              <Building2 className="h-4 w-4" />
              Locations
              {branches.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 bg-repwell-sage-100 px-1.5 py-0 text-xs text-repwell-teal-400"
                >
                  {branches.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              variant="underline"
              value="team"
              className="flex items-center gap-2"
            >
              <Users className="h-4 w-4" />
              Team
              {featuredProfessionals.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 bg-repwell-sage-100 px-1.5 py-0 text-xs text-repwell-teal-400"
                >
                  {featuredProfessionals.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="locations">
            {branches.length === 0 ? (
              <p className="py-8 text-center text-repwell-teal-300">
                No branch locations listed.
              </p>
            ) : (
              <>
                <DirectorySearchSortToolbar
                  search={locations.search}
                  sort={locations.sort}
                  searchPlaceholder="Search locations..."
                  onSearchChange={locations.setSearch}
                  onSortChange={locations.setSort}
                />

                {locations.filteredItems.length === 0 ? (
                  <p className="py-8 text-center text-repwell-teal-300">
                    No locations match &ldquo;{locations.search}&rdquo;
                  </p>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {locations.displayedItems.map((branch) => (
                        <Link
                          key={branch.id}
                          href={getBranchPublicPath(branch)}
                          className="group block"
                        >
                          <div className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-repwell-sage-100/50">
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
                              {branch.photo_url ? (
                                <img
                                  src={branch.photo_url}
                                  alt={branch.name}
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-repwell-sage-100">
                                  <Building2 className="h-5 w-5 text-repwell-teal-400" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="truncate text-sm font-medium text-repwell-teal-500 transition-colors group-hover:text-repwell-teal-400">
                                {branch.name}
                              </h4>
                              <p className="mt-0.5 flex items-center gap-1 truncate text-sm text-repwell-teal-300">
                                <MapPin className="h-3 w-3 shrink-0" />
                                {formatBranchLocation(
                                  branch.address as BranchAddress | null
                                ) || "Location not specified"}
                              </p>
                              {branch.average_rating && branch.total_reviews ? (
                                <div className="mt-2 flex items-center gap-2">
                                  <RatingStars
                                    rating={Number(branch.average_rating)}
                                    size="sm"
                                  />
                                  <span className="text-xs font-medium text-repwell-teal-500">
                                    {Number(branch.average_rating).toFixed(1)}
                                  </span>
                                  <span className="text-xs text-repwell-teal-300">
                                    ({branch.total_reviews} reviews)
                                  </span>
                                </div>
                              ) : null}
                            </div>
                            <ChevronRight className="h-5 w-5 shrink-0 text-repwell-teal-300 transition-colors group-hover:text-repwell-teal-400" />
                          </div>
                        </Link>
                      ))}
                    </div>
                    {locations.hasMore && (
                      <DirectoryShowMoreButton
                        label="Locations"
                        remainingCount={locations.remainingCount}
                        onClick={locations.showMore}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="team">
            {featuredProfessionals.length === 0 ? (
              <p className="py-8 text-center text-repwell-teal-300">
                No team members listed.
              </p>
            ) : (
              <>
                <DirectorySearchSortToolbar
                  search={team.search}
                  sort={team.sort}
                  searchPlaceholder="Search team members..."
                  onSearchChange={team.setSearch}
                  onSortChange={team.setSort}
                />

                {team.filteredItems.length === 0 ? (
                  <p className="py-8 text-center text-repwell-teal-300">
                    No team members match &ldquo;{team.search}&rdquo;
                  </p>
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {team.displayedItems.map((member) => (
                        <Link
                          key={member.id}
                          href={member.slug ? `/pro/${member.slug}` : "#"}
                          className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-repwell-sage-100/50"
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage
                              src={member.photo_url || undefined}
                              alt={member.full_name}
                            />
                            <AvatarFallback className="bg-repwell-sage-100 text-sm text-repwell-teal-400">
                              {getInitials(member.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1">
                              <h4 className="truncate text-sm font-medium text-repwell-teal-500 transition-colors group-hover:text-repwell-teal-400">
                                {member.full_name}
                              </h4>
                              <TierBadge
                                isEnterprise={member.is_enterprise}
                                isPro={member.is_pro}
                                size="sm"
                              />
                            </div>
                            <p className="truncate text-xs text-repwell-teal-300">
                              {member.title || "Professional"}
                            </p>
                            {member.average_rating && member.total_reviews ? (
                              <div className="mt-0.5 flex items-center gap-1">
                                <RatingStars
                                  rating={Number(member.average_rating)}
                                  size="sm"
                                />
                                <span className="text-xs font-medium text-repwell-teal-500">
                                  {Number(member.average_rating).toFixed(1)}
                                </span>
                                <span className="text-xs text-repwell-teal-300">
                                  ({member.total_reviews})
                                </span>
                              </div>
                            ) : null}
                          </div>
                          <ChevronRight className="h-4 w-4 text-repwell-teal-300 transition-colors group-hover:text-repwell-teal-400" />
                        </Link>
                      ))}
                    </div>
                    {team.hasMore && (
                      <DirectoryShowMoreButton
                        label="Team Members"
                        remainingCount={team.remainingCount}
                        onClick={team.showMore}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
