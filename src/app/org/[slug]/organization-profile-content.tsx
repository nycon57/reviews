"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
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
  ArrowSquareOut as ExternalLink,
  CaretRight as ChevronRight,
  Globe,
  Target,
  Medal as Award,
  Phone,
  Envelope,
  LinkedinLogo,
  FacebookLogo,
  InstagramLogo,
  TwitterLogo,
  MagnifyingGlass,
  SortAscending,
} from "@phosphor-icons/react";
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
import { ProfileHeroBanner } from "@/app/pro/[slug]/components";
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

function formatFullAddress(address: BranchAddress | null): string | null {
  if (!address) return null;
  const parts = [address.street, address.city, address.state, address.zip].filter(Boolean);
  if (parts.length === 0) return null;
  // Format as "street, city, state zip"
  const street = address.street;
  const cityStateZip = [address.city, [address.state, address.zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
  return [street, cityStateZip].filter(Boolean).join(", ");
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

  // Search & sort state
  const [locationSearch, setLocationSearch] = useState("");
  const [locationSort, setLocationSort] = useState("name-asc");
  const [teamSearch, setTeamSearch] = useState("");
  const [teamSort, setTeamSort] = useState("name-asc");

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

  // Derive contact info: prefer org-level fields, fallback to HQ branch
  const hq = organization.headquarters_branch;
  const contactPhone = organization.phone || hq?.phone || null;
  const contactEmail = organization.email || hq?.email || null;
  const contactAddress = hq?.address
    ? formatFullAddress(hq.address as BranchAddress | null)
    : formatFullAddress(organization.headquarters_address as BranchAddress | null);

  const socialLinks = [
    { url: organization.linkedin_url, icon: LinkedinLogo, label: "LinkedIn" },
    { url: organization.facebook_url, icon: FacebookLogo, label: "Facebook" },
    { url: organization.instagram_url, icon: InstagramLogo, label: "Instagram" },
    { url: organization.twitter_url, icon: TwitterLogo, label: "X (Twitter)" },
  ].filter((s) => s.url);

  const hasContactInfo = contactPhone || contactEmail || contactAddress || organization.website_url || socialLinks.length > 0;

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
                <h1 className="text-3xl md:text-4xl font-display font-bold text-repwell-teal-500 tracking-tight">
                  {organization.name}
                </h1>

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
            {hasContactInfo && (
              <Card className="border-t-4 border-t-repwell-sage-200">
                <CardHeader>
                  <CardTitle className="text-lg font-display text-repwell-teal-500 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-repwell-teal-300" />
                    Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* HQ Address */}
                  {contactAddress && (
                    <div className="flex items-start gap-3 text-sm text-repwell-teal-400">
                      <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-repwell-teal-300" />
                      <span>{contactAddress}</span>
                    </div>
                  )}

                  {/* Phone */}
                  {contactPhone && (
                    <a
                      href={`tel:${contactPhone}`}
                      className="flex items-center gap-3 text-sm text-repwell-teal-400 hover:text-repwell-teal-300 transition-colors"
                    >
                      <Phone className="h-4 w-4 shrink-0 text-repwell-teal-300" />
                      <span>{contactPhone}</span>
                    </a>
                  )}

                  {/* Email */}
                  {contactEmail && (
                    <a
                      href={`mailto:${contactEmail}`}
                      className="flex items-center gap-3 text-sm text-repwell-teal-400 hover:text-repwell-teal-300 transition-colors"
                    >
                      <Envelope className="h-4 w-4 shrink-0 text-repwell-teal-300" />
                      <span>{contactEmail}</span>
                    </a>
                  )}

                  {/* Website */}
                  {organization.website_url && (
                    <a
                      href={organization.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 text-sm text-repwell-teal-400 hover:text-repwell-teal-300 transition-colors"
                    >
                      <Globe className="h-4 w-4 shrink-0 text-repwell-teal-300" />
                      <span className="truncate">{organization.website_url.replace(/^https?:\/\//, "")}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  )}

                  {/* Social Links */}
                  {socialLinks.length > 0 && (
                    <div className="flex items-center gap-3 pt-2 border-t border-repwell-sage-200">
                      {socialLinks.map((social) => (
                        <a
                          key={social.label}
                          href={social.url!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-repwell-teal-300 hover:text-repwell-teal-500 transition-colors"
                          title={social.label}
                        >
                          <social.icon className="h-5 w-5" />
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Share Profile */}
            <ShareProfileButton
              profileUrl={profileUrl}
              loanOfficerName={organization.name}
              title={`${organization.name} - Organization Profile`}
            />
          </div>

          {/* Right Content Area */}
          <div className="space-y-10 lg:col-span-2 order-1 lg:order-2">
            {/* About Section */}
            {organization.description && (
              <Card className="border-t-4 border-t-repwell-sage-200">
                <CardHeader>
                  <CardTitle className="text-xl font-display text-repwell-teal-500 flex items-center gap-2">
                    <Target className="h-5 w-5 text-repwell-teal-300" />
                    About {organization.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-repwell-teal-400 leading-relaxed">
                    {organization.description}
                  </p>
                </CardContent>
              </Card>
            )}

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
                          <div className="grid gap-4 sm:grid-cols-2">
                            {filteredBranches.map((branch) => (
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
                          <div className="grid gap-3 sm:grid-cols-2">
                            {filteredProfessionals.map((member) => (
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
                                  <h4 className="text-sm font-medium truncate text-repwell-teal-500 group-hover:text-repwell-teal-400 transition-colors">
                                    {member.full_name}
                                  </h4>
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
                  <div className="space-y-6">
                    {testimonials.map((testimonial) => (
                      <div
                        key={testimonial.id}
                        className="border-b pb-6 last:border-0 last:pb-0"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <StarRating rating={testimonial.rating} />
                              <span className="text-sm font-medium text-repwell-teal-500">
                                {testimonial.rating}/5
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-repwell-teal-300">
                              {testimonial.customer_name || "Anonymous"}
                              {testimonial.customer_location && (
                                <span> - {testimonial.customer_location}</span>
                              )}
                            </p>
                          </div>
                          <span className="text-xs text-repwell-teal-300">
                            {formatDate(testimonial.review_date)}
                          </span>
                        </div>

                        {testimonial.title && (
                          <h4 className="mt-3 font-medium text-repwell-teal-500">{testimonial.title}</h4>
                        )}

                        {testimonial.text && (
                          <div className="mt-2 flex items-start gap-2">
                            <Quote className="h-4 w-4 shrink-0 text-repwell-teal-300/50" />
                            <p className="text-sm text-repwell-teal-400 leading-relaxed">
                              {testimonial.text}
                            </p>
                          </div>
                        )}

                        {/* Attribution */}
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-repwell-teal-300">
                          <Link
                            href={`/pro/${testimonial.loan_officer.slug || testimonial.loan_officer.id}`}
                            className="flex items-center gap-2 text-repwell-teal-400 hover:text-repwell-teal-300 transition-colors"
                          >
                            <Avatar className="h-5 w-5">
                              <AvatarImage
                                src={testimonial.loan_officer.photo_url || undefined}
                                alt={testimonial.loan_officer.full_name}
                              />
                              <AvatarFallback className="text-[10px] bg-repwell-sage-100 text-repwell-teal-400">
                                {getInitials(testimonial.loan_officer.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span>Served by {testimonial.loan_officer.full_name}</span>
                          </Link>
                          {testimonial.branch && (
                            <>
                              <span className="text-repwell-teal-300/50">|</span>
                              <Link
                                href={`/branch/${testimonial.branch.global_slug || testimonial.branch.id}`}
                                className="text-repwell-teal-400 hover:text-repwell-teal-300 transition-colors"
                              >
                                {testimonial.branch.name}
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
