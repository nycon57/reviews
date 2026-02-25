"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Star,
  MapPin,
  Users,
  Quotes as Quote,
  BuildingOffice as Building2,
  CaretRight as ChevronRight,
  Medal as Award,
  MagnifyingGlass,
  SortAscending,
  SealCheck,
} from "@phosphor-icons/react";
import { getInitials } from "@/lib/utils";
import { ReviewItem } from "@/components/shared/review-item";
import { TierBadge } from "@/components/shared/tier-badge";
import type {
  PublicOrganization,
  PublicOrgBranch,
  PublicOrgProfessional,
  PublicOrgTestimonial,
} from "@/lib/seo/actions";
import {
  DirectoryBreadcrumbs,
  type DirectoryBreadcrumbItem,
} from "@/components/shared/directory-breadcrumbs";
import { ProfileHeroBanner, ContactCTACard, MessageModal, ReportReviewModal, ReviewFiltersBar, type ReviewFilters } from "@/app/pro/[slug]/components";
import { ShareProfileButton } from "@/app/pro/[slug]/components/share-profile-button";

interface OrganizationProfileContentProps {
  organization: PublicOrganization;
  branches: PublicOrgBranch[];
  featuredProfessionals: PublicOrgProfessional[];
  testimonials: PublicOrgTestimonial[];
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

interface BranchAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
}

function formatBranchLocation(address: BranchAddress | null, region: string | null): string {
  if (address) {
    const locationParts = [address.city, address.state].filter(Boolean);
    if (locationParts.length > 0) {
      return locationParts.join(", ");
    }
  }
  return region || "";
}

export function OrganizationProfileContent({
  organization,
  branches,
  featuredProfessionals,
  testimonials,
  breadcrumbs,
}: OrganizationProfileContentProps) {
  const profileUrl = typeof window !== "undefined"
    ? window.location.href
    : `/org/${organization.slug || organization.id}`;

  // Message modal state
  const [messageOpen, setMessageOpen] = useState(false);
  const [reportReviewId, setReportReviewId] = useState<string | null>(null);

  const handleFlagReview = useCallback((reviewId: string) => {
    setReportReviewId(reviewId);
  }, []);

  // Search & sort state
  const [locationSearch, setLocationSearch] = useState("");
  const [locationSort, setLocationSort] = useState("name-asc");
  const [teamSearch, setTeamSearch] = useState("");
  const [teamSort, setTeamSort] = useState("name-asc");

  // Review filters
  const [reviewFilters, setReviewFilters] = useState<ReviewFilters>({
    search: "",
    rating: null,
    sources: [],
    dateRange: undefined,
    sort: "newest",
  });
  const [reviewDisplayCount, setReviewDisplayCount] = useState(10);

  const reviewSources = useMemo(() => {
    const sourceSet = new Set(testimonials.map((t) => (t.source || "").toLowerCase()).filter(Boolean));
    return Array.from(sourceSet).filter((s) => s !== "internal" && s !== "survey");
  }, [testimonials]);

  const filteredTestimonials = useMemo(() => {
    let result = [...testimonials];
    if (reviewFilters.search) {
      const q = reviewFilters.search.toLowerCase();
      result = result.filter(
        (t) =>
          t.text?.toLowerCase().includes(q) ||
          t.title?.toLowerCase().includes(q) ||
          t.customer_name?.toLowerCase().includes(q)
      );
    }
    if (reviewFilters.rating !== null) {
      result = result.filter((t) => t.rating >= reviewFilters.rating!);
    }
    if (reviewFilters.sources.length > 0) {
      const selected = new Set(reviewFilters.sources.map((s) => s.toLowerCase()));
      result = result.filter((t) => selected.has((t.source || "").toLowerCase()));
    }
    if (reviewFilters.dateRange?.from) {
      const from = new Date(reviewFilters.dateRange.from).setHours(0, 0, 0, 0);
      const to = reviewFilters.dateRange.to
        ? new Date(reviewFilters.dateRange.to).setHours(23, 59, 59, 999)
        : new Date(reviewFilters.dateRange.from).setHours(23, 59, 59, 999);
      result = result.filter((t) => {
        const d = t.review_date ? Date.parse(t.review_date) : NaN;
        if (Number.isNaN(d)) return true;
        return d >= from && d <= to;
      });
    }
    result.sort((a, b) => {
      switch (reviewFilters.sort) {
        case "oldest":
          return new Date(a.review_date).getTime() - new Date(b.review_date).getTime();
        case "highest":
          return b.rating - a.rating;
        case "lowest":
          return a.rating - b.rating;
        default:
          return new Date(b.review_date).getTime() - new Date(a.review_date).getTime();
      }
    });
    return result;
  }, [testimonials, reviewFilters]);

  const displayedTestimonials = filteredTestimonials.slice(0, reviewDisplayCount);

  const handleReviewFiltersChange = useCallback((f: ReviewFilters) => {
    setReviewFilters(f);
    setReviewDisplayCount(10);
  }, [setReviewDisplayCount]);

  // Show More pagination
  const [locationDisplayCount, setLocationDisplayCount] = useState(12);
  const [teamDisplayCount, setTeamDisplayCount] = useState(12);

  const filteredBranches = useMemo(() => {
    const q = locationSearch.toLowerCase().trim();
    let filtered = branches;
    if (q) {
      filtered = branches.filter((b) => {
        const addr = b.address as BranchAddress | null;
        return (
          b.name.toLowerCase().includes(q) ||
          addr?.city?.toLowerCase().includes(q) ||
          addr?.state?.toLowerCase().includes(q) ||
          b.region?.toLowerCase().includes(q)
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
    const q = teamSearch.toLowerCase().trim();
    let filtered = featuredProfessionals;
    if (q) {
      filtered = featuredProfessionals.filter(
        (m) =>
          m.full_name.toLowerCase().includes(q) ||
          m.title?.toLowerCase().includes(q)
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

  // Reset display counts when search/sort changes
  const locationFilterKey = `${locationSearch}|${locationSort}`;
  const teamFilterKey = `${teamSearch}|${teamSort}`;
  const [prevLocationKey, setPrevLocationKey] = useState(locationFilterKey);
  const [prevTeamKey, setPrevTeamKey] = useState(teamFilterKey);
  if (locationFilterKey !== prevLocationKey) {
    setPrevLocationKey(locationFilterKey);
    setLocationDisplayCount(12);
  }
  if (teamFilterKey !== prevTeamKey) {
    setPrevTeamKey(teamFilterKey);
    setTeamDisplayCount(12);
  }

  const displayedBranches = filteredBranches.slice(0, locationDisplayCount);
  const displayedProfessionals = filteredProfessionals.slice(0, teamDisplayCount);

  // Derive contact info: prefer org-level fields, fallback to HQ branch
  const hq = organization.headquarters_branch;
  const contactPhone = organization.phone || hq?.phone || null;
  const rawAddr = (hq?.address || organization.headquarters_address) as BranchAddress | null;
  const hqAddress = rawAddr ? { street: rawAddr.street, city: rawAddr.city, state: rawAddr.state, zip: rawAddr.zip } : null;
  const hqDirectionsUrl = hqAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([hqAddress.street, hqAddress.city, hqAddress.state, hqAddress.zip].filter(Boolean).join(" "))}`
    : null;
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Banner */}
      <div className="relative">
        <ProfileHeroBanner
          orgLogo={organization.logo_url}
          orgName={organization.name}
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
            <div className="flex flex-col items-center gap-6 text-center">
              {/* Logo */}
              <div className="h-28 w-28 overflow-hidden rounded-2xl border-4 border-white shadow-lg -mt-16">
                {organization.logo_url ? (
                  <div className="relative h-full w-full bg-white">
                    <Image
                      src={organization.logo_url}
                      alt={organization.name}
                      fill
                      className="object-contain p-2"
                    />
                  </div>
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-repwell-sage-100">
                    <Building2 className="h-12 w-12 text-repwell-teal-400" />
                  </div>
                )}
              </div>

              {/* Organization Info */}
              <div className="max-w-2xl">
                <div className="flex items-center justify-center gap-2">
                  <h1 className="text-3xl md:text-4xl font-display font-bold text-repwell-teal-500 tracking-tight">
                    {organization.name}
                  </h1>
                  <SealCheck weight="fill" className="h-6 w-6 text-repwell-teal-300 shrink-0" />
                </div>

                {organization.mission_statement && (
                  <p className="mt-3 text-lg text-repwell-teal-400 italic">
                    &ldquo;{organization.mission_statement}&rdquo;
                  </p>
                )}

                {/* Stats Summary */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  {organization.aggregate_rating && organization.total_reviews > 0 && (
                    <div className="flex items-center gap-2">
                      <StarRating rating={Math.round(Number(organization.aggregate_rating))} />
                      <span className="text-lg font-semibold text-repwell-teal-500">
                        {Number(organization.aggregate_rating).toFixed(1)}
                      </span>
                    </div>
                  )}

                  <Badge variant="secondary" className="bg-repwell-sage-100 text-repwell-teal-400 px-3 py-1">
                    <Award className="mr-1.5 h-3.5 w-3.5" />
                    {organization.total_reviews.toLocaleString()} Reviews
                  </Badge>

                  <Badge variant="outline" className="border-repwell-sage-200 text-repwell-teal-400 px-3 py-1">
                    <Building2 className="mr-1.5 h-3.5 w-3.5" />
                    {organization.total_branches} {organization.total_branches === 1 ? "Location" : "Locations"}
                  </Badge>

                  <Badge variant="outline" className="border-repwell-sage-200 text-repwell-teal-400 px-3 py-1">
                    <Users className="mr-1.5 h-3.5 w-3.5" />
                    {organization.total_members} Professionals
                  </Badge>
                </div>

                {/* Description / Bio */}
                {organization.description && (
                  <p className="mt-4 text-sm text-repwell-teal-400 leading-relaxed max-w-xl">
                    {organization.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Sidebar Left + Content Right */}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Left Sidebar — Contact Info */}
          <div className="lg:sticky lg:top-20 lg:self-start space-y-6 lg:col-span-1 order-2 lg:order-1">
            <ContactCTACard
              phone={contactPhone}
              address={hqAddress}
              professionalName={organization.name}
              contactLabel={`Contact ${organization.name}`}
              personalWebsiteUrl={organization.website_url}
              directionsUrl={hqDirectionsUrl}
              linkedinUrl={organization.linkedin_url}
              facebookUrl={organization.facebook_url}
              instagramUrl={organization.instagram_url}
              twitterUrl={organization.twitter_url}
              onMessage={() => setMessageOpen(true)}
              shareButton={
                <ShareProfileButton
                  profileUrl={profileUrl}
                  loanOfficerName={organization.name}
                  title={`${organization.name} - Organization Profile`}
                />
              }
            />
          </div>

          {/* Right Content Area */}
          <div className="space-y-10 lg:col-span-2 order-1 lg:order-2">
            {/* Tabbed Locations / Team */}
            <Card className="border-t-4 border-t-repwell-sage-200">
              <CardContent className="pt-6">
                <Tabs defaultValue="locations">
                  <TabsList variant="underline" className="w-full justify-start">
                    <TabsTrigger variant="underline" value="locations" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Locations
                      {branches.length > 0 && (
                        <Badge variant="secondary" className="ml-1 bg-repwell-sage-100 text-repwell-teal-400 text-xs px-1.5 py-0">
                          {branches.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                    <TabsTrigger variant="underline" value="team" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Team
                      {featuredProfessionals.length > 0 && (
                        <Badge variant="secondary" className="ml-1 bg-repwell-sage-100 text-repwell-teal-400 text-xs px-1.5 py-0">
                          {featuredProfessionals.length}
                        </Badge>
                      )}
                    </TabsTrigger>
                  </TabsList>

                  {/* Locations Tab */}
                  <TabsContent value="locations">
                    {branches.length === 0 ? (
                      <p className="py-8 text-center text-repwell-teal-300">
                        No branch locations listed.
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
                          <div className="relative flex-1">
                            <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="Search locations..."
                              value={locationSearch}
                              onChange={(e) => setLocationSearch(e.target.value)}
                              className="pl-9 h-9"
                            />
                          </div>
                          <Select value={locationSort} onValueChange={setLocationSort}>
                            <SelectTrigger className="w-full sm:w-[180px] h-9">
                              <SortAscending className="mr-2 h-4 w-4 text-muted-foreground" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="name-asc">Name A–Z</SelectItem>
                              <SelectItem value="name-desc">Name Z–A</SelectItem>
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
                                href={`/branch/${branch.global_slug || branch.id}`}
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
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium truncate text-repwell-teal-500 group-hover:text-repwell-teal-400 transition-colors">
                                      {branch.name}
                                    </h4>
                                    <p className="mt-0.5 text-sm text-repwell-teal-300 truncate flex items-center gap-1">
                                      <MapPin className="h-3 w-3 shrink-0" />
                                      {formatBranchLocation(
                                        branch.address as BranchAddress | null,
                                        branch.region
                                      ) || "Location not specified"}
                                    </p>
                                    {branch.average_rating && branch.total_reviews ? (
                                      <div className="mt-2 flex items-center gap-2">
                                        <div className="flex items-center gap-1">
                                          <Star weight="fill" className="h-3 w-3 text-amber-500" />
                                          <span className="text-xs font-medium text-repwell-teal-500">
                                            {Number(branch.average_rating).toFixed(1)}
                                          </span>
                                        </div>
                                        <span className="text-xs text-repwell-teal-300">
                                          ({branch.total_reviews} reviews)
                                        </span>
                                      </div>
                                    ) : null}
                                  </div>
                                  <ChevronRight className="h-5 w-5 text-repwell-teal-300 group-hover:text-repwell-teal-400 transition-colors shrink-0" />
                                </div>
                              </Link>
                            ))}
                          </div>
                          {filteredBranches.length > locationDisplayCount && (
                            <Button
                              variant="outline"
                              className="w-full mt-4"
                              onClick={() => setLocationDisplayCount(prev => prev + 12)}
                            >
                              Show More Locations ({filteredBranches.length - locationDisplayCount} remaining)
                            </Button>
                          )}
                          </>
                        )}
                      </>
                    )}
                  </TabsContent>

                  {/* Team Tab */}
                  <TabsContent value="team">
                    {featuredProfessionals.length === 0 ? (
                      <p className="py-8 text-center text-repwell-teal-300">
                        No team members listed.
                      </p>
                    ) : (
                      <>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-4">
                          <div className="relative flex-1">
                            <MagnifyingGlass className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                              placeholder="Search team members..."
                              value={teamSearch}
                              onChange={(e) => setTeamSearch(e.target.value)}
                              className="pl-9 h-9"
                            />
                          </div>
                          <Select value={teamSort} onValueChange={setTeamSort}>
                            <SelectTrigger className="w-full sm:w-[180px] h-9">
                              <SortAscending className="mr-2 h-4 w-4 text-muted-foreground" />
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="name-asc">Name A–Z</SelectItem>
                              <SelectItem value="name-desc">Name Z–A</SelectItem>
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
                                  <AvatarImage src={member.photo_url || undefined} alt={member.full_name} />
                                  <AvatarFallback className="bg-repwell-sage-100 text-repwell-teal-400 text-sm">
                                    {getInitials(member.full_name)}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <h4 className="text-sm font-medium truncate text-repwell-teal-500 group-hover:text-repwell-teal-400 transition-colors">
                                      {member.full_name}
                                    </h4>
                                    <TierBadge isEnterprise={member.is_enterprise} isPro={member.is_pro} size="sm" />
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
                            ))}
                          </div>
                          {filteredProfessionals.length > teamDisplayCount && (
                            <Button
                              variant="outline"
                              className="w-full mt-4"
                              onClick={() => setTeamDisplayCount(prev => prev + 12)}
                            >
                              Show More Team Members ({filteredProfessionals.length - teamDisplayCount} remaining)
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

            {/* Testimonials Section */}
            {testimonials.length > 0 && (
              <Card className="border-t-4 border-t-repwell-sage-200">
                <CardHeader>
                  <CardTitle className="text-xl font-display text-repwell-teal-500 flex items-center gap-2">
                    <Quote className="h-5 w-5 text-repwell-teal-300" />
                    Customer Testimonials
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewFiltersBar
                    filters={reviewFilters}
                    onFiltersChange={handleReviewFiltersChange}
                    sources={reviewSources}
                    className="mb-8"
                  />

                  {filteredTestimonials.length === 0 ? (
                    <p className="py-8 text-center text-repwell-teal-300">
                      No testimonials match your filters.
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {displayedTestimonials.map((testimonial) => (
                        <ReviewItem
                          key={testimonial.id}
                          review={{
                            id: testimonial.id,
                            customer_name: testimonial.customer_name,
                            customer_location: testimonial.customer_location,
                            rating: testimonial.rating,
                            text: testimonial.text,
                            title: testimonial.title,
                            review_date: testimonial.review_date,
                            source: testimonial.source,
                          }}
                          attributionLabel="Served by"
                          attribution={{
                            loanOfficer: {
                              name: testimonial.loan_officer.full_name,
                              href: testimonial.loan_officer.slug ? `/pro/${testimonial.loan_officer.slug}` : "#",
                              photoUrl: testimonial.loan_officer.photo_url,
                            },
                            branch: testimonial.branch ? {
                              name: testimonial.branch.name,
                              href: testimonial.branch.global_slug ? `/branch/${testimonial.branch.global_slug}` : "#",
                            } : undefined,
                          }}
                          shareConfig={{ profileUrl, subjectName: organization.name }}
                          onFlag={handleFlagReview}
                        />
                      ))}

                      {filteredTestimonials.length > reviewDisplayCount && (
                        <div className="flex justify-center pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setReviewDisplayCount((prev) => prev + 10)}
                            className="border-repwell-teal-300 text-repwell-teal-400 hover:bg-repwell-sage-100"
                          >
                            Load More Testimonials
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Message Modal */}
      <MessageModal
        open={messageOpen}
        onOpenChange={setMessageOpen}
        recipientType="organization"
        recipientId={organization.id}
        recipientName={organization.name}
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
