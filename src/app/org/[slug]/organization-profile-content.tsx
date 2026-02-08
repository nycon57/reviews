"use client";

import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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

                {/* Website Link */}
                {organization.website_url && (
                  <div className="mt-4">
                    <a
                      href={organization.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-repwell-teal-400 hover:text-repwell-teal-300 hover:underline"
                    >
                      <Globe className="h-4 w-4" />
                      Visit Official Website
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Main Content Area */}
          <div className="space-y-10 lg:col-span-2">
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

            {/* Branches Directory */}
            <Card className="border-t-4 border-t-repwell-sage-200" id="locations">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl font-display text-repwell-teal-500 flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-repwell-teal-300" />
                  Our Locations
                </CardTitle>
                {branches.length > 0 && (
                  <span className="text-sm text-repwell-teal-300">
                    {branches.length} {branches.length === 1 ? "Branch" : "Branches"}
                  </span>
                )}
              </CardHeader>
              <CardContent>
                {branches.length === 0 ? (
                  <p className="py-8 text-center text-repwell-teal-300">
                    No branch locations listed.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {branches.map((branch) => (
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
                            <h4 className="font-medium truncate text-repwell-teal-500 group-hover:text-repwell-teal-400 transition-colors">
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
                            href={`/pro/${testimonial.loan_officer.id}`}
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

          {/* Sidebar */}
          <div className="lg:sticky lg:top-20 lg:self-start space-y-6 lg:col-span-1">
            {/* Featured Loan Officers */}
            <Card className="border-t-4 border-t-repwell-sage-200">
              <CardHeader>
                <CardTitle className="text-lg font-display text-repwell-teal-500 flex items-center gap-2">
                  <Users className="h-5 w-5 text-repwell-teal-300" />
                  Featured Professionals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {featuredProfessionals.length === 0 ? (
                  <p className="py-4 text-center text-repwell-teal-300 text-sm">
                    No team members listed.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {featuredProfessionals.slice(0, 6).map((member) => (
                      <Link
                        key={member.id}
                        href={`/pro/${member.id}`}
                        className="group flex items-center gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-repwell-sage-100/50"
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

                    {featuredProfessionals.length > 6 && (
                      <p className="text-xs text-center text-repwell-teal-300 pt-2">
                        +{featuredProfessionals.length - 6} more professionals
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Share Profile */}
            <ShareProfileButton
              profileUrl={profileUrl}
              loanOfficerName={organization.name}
              title={`${organization.name} - Organization Profile`}
            />

            {/* Quick Stats Card */}
            <Card className="bg-repwell-sage-100 border-repwell-sage-200">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-repwell-teal-500">
                      {organization.aggregate_rating
                        ? Number(organization.aggregate_rating).toFixed(1)
                        : "N/A"}
                    </p>
                    <p className="text-sm text-repwell-teal-400">Average Rating</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center">
                      <p className="text-xl font-semibold text-repwell-teal-500">{organization.total_reviews.toLocaleString()}</p>
                      <p className="text-xs text-repwell-teal-300">Total Reviews</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-semibold text-repwell-teal-500">{organization.total_branches}</p>
                      <p className="text-xs text-repwell-teal-300">Locations</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card className="border-t-4 border-t-repwell-sage-200">
              <CardContent className="pt-6 text-center">
                <h3 className="font-display font-semibold text-repwell-teal-500">Find Your Local Branch</h3>
                <p className="mt-2 text-sm text-repwell-teal-400">
                  Connect with an experienced professional at one of our locations.
                </p>
                {branches.length > 0 && (
                  <Button asChild className="mt-4 w-full bg-repwell-teal-400 hover:bg-repwell-teal-500 text-white">
                    <Link href="#locations">
                      <MapPin className="mr-2 h-4 w-4" />
                      View All Locations
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

    </div>
  );
}
