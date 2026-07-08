"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  BuildingOffice as Building2,
  CaretRight as ChevronRight,
  MagnifyingGlass,
  MapPin,
  SortAscending,
  Users,
} from "@phosphor-icons/react";

import { RatingStars } from "@/components/reviews/rating-stars";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export function OrganizationDirectoryTabs({
  branches,
  featuredProfessionals,
}: OrganizationDirectoryTabsProps) {
  const [locationSearch, setLocationSearch] = useState("");
  const [locationSort, setLocationSort] = useState("name-asc");
  const [teamSearch, setTeamSearch] = useState("");
  const [teamSort, setTeamSort] = useState("name-asc");
  const [locationPagination, setLocationPagination] = useState({
    key: "|name-asc",
    count: 12,
  });
  const [teamPagination, setTeamPagination] = useState({
    key: "|name-asc",
    count: 12,
  });

  const filteredBranches = useMemo(() => {
    const query = locationSearch.toLowerCase().trim();
    let filtered = branches;

    if (query) {
      filtered = branches.filter((branch) => {
        const address = branch.address as BranchAddress | null;
        return (
          branch.name.toLowerCase().includes(query) ||
          address?.city?.toLowerCase().includes(query) ||
          address?.state?.toLowerCase().includes(query)
        );
      });
    }

    return [...filtered].sort((a, b) => {
      switch (locationSort) {
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
    });
  }, [branches, locationSearch, locationSort]);

  const filteredProfessionals = useMemo(() => {
    const query = teamSearch.toLowerCase().trim();
    let filtered = featuredProfessionals;

    if (query) {
      filtered = featuredProfessionals.filter(
        (member) =>
          member.full_name.toLowerCase().includes(query) ||
          member.title?.toLowerCase().includes(query)
      );
    }

    return [...filtered].sort((a, b) => {
      switch (teamSort) {
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
    });
  }, [featuredProfessionals, teamSearch, teamSort]);

  const locationFilterKey = `${locationSearch}|${locationSort}`;
  const teamFilterKey = `${teamSearch}|${teamSort}`;
  const locationDisplayCount =
    locationPagination.key === locationFilterKey ? locationPagination.count : 12;
  const teamDisplayCount =
    teamPagination.key === teamFilterKey ? teamPagination.count : 12;
  const displayedBranches = filteredBranches.slice(0, locationDisplayCount);
  const displayedProfessionals = filteredProfessionals.slice(0, teamDisplayCount);

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
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search locations..."
                      value={locationSearch}
                      onChange={(event) => setLocationSearch(event.target.value)}
                      className="h-9 pl-9"
                    />
                  </div>
                  <Select value={locationSort} onValueChange={setLocationSort}>
                    <SelectTrigger className="h-9 w-full sm:w-[180px]">
                      <SortAscending className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">Name A-Z</SelectItem>
                      <SelectItem value="name-desc">Name Z-A</SelectItem>
                      <SelectItem value="rating-high">Highest Rated</SelectItem>
                      <SelectItem value="rating-low">Lowest Rated</SelectItem>
                      <SelectItem value="reviews">Most Reviews</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filteredBranches.length === 0 ? (
                  <p className="py-8 text-center text-repwell-teal-300">
                    No locations match &ldquo;{locationSearch}&rdquo;
                  </p>
                ) : (
                  <>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {displayedBranches.map((branch) => (
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
                    {filteredBranches.length > locationDisplayCount && (
                      <Button
                        variant="outline"
                        className="mt-4 w-full"
                        onClick={() =>
                          setLocationPagination({
                            key: locationFilterKey,
                            count: locationDisplayCount + 12,
                          })
                        }
                      >
                        Show More Locations (
                        {filteredBranches.length - locationDisplayCount} remaining)
                      </Button>
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
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search team members..."
                      value={teamSearch}
                      onChange={(event) => setTeamSearch(event.target.value)}
                      className="h-9 pl-9"
                    />
                  </div>
                  <Select value={teamSort} onValueChange={setTeamSort}>
                    <SelectTrigger className="h-9 w-full sm:w-[180px]">
                      <SortAscending className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name-asc">Name A-Z</SelectItem>
                      <SelectItem value="name-desc">Name Z-A</SelectItem>
                      <SelectItem value="rating-high">Highest Rated</SelectItem>
                      <SelectItem value="rating-low">Lowest Rated</SelectItem>
                      <SelectItem value="reviews">Most Reviews</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {filteredProfessionals.length === 0 ? (
                  <p className="py-8 text-center text-repwell-teal-300">
                    No team members match &ldquo;{teamSearch}&rdquo;
                  </p>
                ) : (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {displayedProfessionals.map((member) => (
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
                    {filteredProfessionals.length > teamDisplayCount && (
                      <Button
                        variant="outline"
                        className="mt-4 w-full"
                        onClick={() =>
                          setTeamPagination({
                            key: teamFilterKey,
                            count: teamDisplayCount + 12,
                          })
                        }
                      >
                        Show More Team Members (
                        {filteredProfessionals.length - teamDisplayCount}{" "}
                        remaining)
                      </Button>
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
