"use client";

import Link from "next/link";
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
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "fill-muted text-muted"
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
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <div className="relative border-b bg-card">
        <div
          className="absolute inset-0 h-64 bg-gradient-to-br opacity-5"
          style={{
            backgroundColor: organization.primary_color || "#3B82F6",
          }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          {breadcrumbs && breadcrumbs.length > 0 && (
            <DirectoryBreadcrumbs items={breadcrumbs} className="mb-6" />
          )}

          <div className="flex flex-col items-center gap-6 text-center">
            {/* Logo */}
            <div className="h-28 w-28 overflow-hidden rounded-2xl border-4 border-background bg-white shadow-lg">
              {organization.logo_url ? (
                <img
                  src={organization.logo_url}
                  alt={organization.name}
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary/10">
                  <Building2 className="h-12 w-12 text-primary" />
                </div>
              )}
            </div>

            {/* Organization Info */}
            <div className="max-w-2xl">
              <h1 className="text-4xl font-bold tracking-tight">{organization.name}</h1>

              {organization.mission_statement && (
                <p className="mt-3 text-lg text-muted-foreground italic">
                  "{organization.mission_statement}"
                </p>
              )}

              {/* Stats Summary */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                {organization.aggregate_rating && organization.total_reviews > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={Math.round(Number(organization.aggregate_rating))} />
                    <span className="text-lg font-semibold">
                      {Number(organization.aggregate_rating).toFixed(1)}
                    </span>
                  </div>
                )}

                <Badge variant="secondary" className="text-sm px-3 py-1">
                  <Award className="mr-1.5 h-3.5 w-3.5" />
                  {organization.total_reviews.toLocaleString()} Reviews
                </Badge>

                <Badge variant="outline" className="text-sm px-3 py-1">
                  <Building2 className="mr-1.5 h-3.5 w-3.5" />
                  {organization.total_branches} {organization.total_branches === 1 ? "Location" : "Locations"}
                </Badge>

                <Badge variant="outline" className="text-sm px-3 py-1">
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
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
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

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Main Content Area */}
          <div className="space-y-10 lg:col-span-2">
            {/* About Section */}
            {organization.description && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    About {organization.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {organization.description}
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Branches Directory */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-xl flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Our Locations
                </CardTitle>
                {branches.length > 0 && (
                  <span className="text-sm text-muted-foreground">
                    {branches.length} {branches.length === 1 ? "Branch" : "Branches"}
                  </span>
                )}
              </CardHeader>
              <CardContent>
                {branches.length === 0 ? (
                  <p className="py-8 text-center text-muted-foreground">
                    No branch locations listed.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {branches.map((branch) => (
                      <Link
                        key={branch.id}
                        href={`/branch/${branch.id}`}
                        className="group block"
                      >
                        <div className="flex items-start gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                            {branch.photo_url ? (
                              <img
                                src={branch.photo_url}
                                alt={branch.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-primary/10">
                                <Building2 className="h-5 w-5 text-primary" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate group-hover:text-primary transition-colors">
                              {branch.name}
                            </h3>
                            <p className="mt-0.5 text-sm text-muted-foreground truncate flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {formatBranchLocation(
                                branch.address as BranchAddress | null,
                                branch.region
                              ) || "Location not specified"}
                            </p>
                            {branch.average_rating && branch.total_reviews ? (
                              <div className="mt-2 flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-xs font-medium">
                                    {Number(branch.average_rating).toFixed(1)}
                                  </span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  ({branch.total_reviews} reviews)
                                </span>
                              </div>
                            ) : null}
                          </div>
                          <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Testimonials Section */}
            {testimonials.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Quote className="h-5 w-5" />
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
                              <span className="text-sm font-medium">
                                {testimonial.rating}/5
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                              {testimonial.customer_name || "Anonymous"}
                              {testimonial.customer_location && (
                                <span> - {testimonial.customer_location}</span>
                              )}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(testimonial.review_date)}
                          </span>
                        </div>

                        {testimonial.title && (
                          <h4 className="mt-3 font-medium">{testimonial.title}</h4>
                        )}

                        {testimonial.text && (
                          <div className="mt-2 flex items-start gap-2">
                            <Quote className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {testimonial.text}
                            </p>
                          </div>
                        )}

                        {/* Attribution */}
                        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <Link
                            href={`/pro/${testimonial.loan_officer.id}`}
                            className="flex items-center gap-2 hover:text-primary transition-colors"
                          >
                            <Avatar className="h-5 w-5">
                              <AvatarImage
                                src={testimonial.loan_officer.photo_url || undefined}
                                alt={testimonial.loan_officer.full_name}
                              />
                              <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                                {getInitials(testimonial.loan_officer.full_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span>Served by {testimonial.loan_officer.full_name}</span>
                          </Link>
                          {testimonial.branch && (
                            <>
                              <span className="text-muted-foreground/50">|</span>
                              <Link
                                href={`/branch/${testimonial.branch.id}`}
                                className="hover:text-primary transition-colors"
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
          <div className="space-y-6 lg:col-span-1">
            {/* Featured Loan Officers */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Featured Professionals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {featuredProfessionals.length === 0 ? (
                  <p className="py-4 text-center text-muted-foreground text-sm">
                    No team members listed.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {featuredProfessionals.slice(0, 6).map((member) => (
                      <Link
                        key={member.id}
                        href={`/pro/${member.id}`}
                        className="group flex items-center gap-3 rounded-lg p-2 -mx-2 transition-colors hover:bg-muted/50"
                      >
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={member.photo_url || undefined} alt={member.full_name} />
                          <AvatarFallback className="bg-primary/10 text-primary text-sm">
                            {getInitials(member.full_name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {member.full_name}
                          </h4>
                          <p className="text-xs text-muted-foreground truncate">
                            {member.title || "Professional"}
                          </p>
                          {member.average_rating && member.total_reviews ? (
                            <div className="mt-0.5 flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs font-medium">
                                {Number(member.average_rating).toFixed(1)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({member.total_reviews})
                              </span>
                            </div>
                          ) : null}
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </Link>
                    ))}

                    {featuredProfessionals.length > 6 && (
                      <p className="text-xs text-center text-muted-foreground pt-2">
                        +{featuredProfessionals.length - 6} more professionals
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary">
                      {organization.aggregate_rating
                        ? Number(organization.aggregate_rating).toFixed(1)
                        : "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center">
                      <p className="text-xl font-semibold">{organization.total_reviews.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total Reviews</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xl font-semibold">{organization.total_branches}</p>
                      <p className="text-xs text-muted-foreground">Locations</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CTA */}
            <Card>
              <CardContent className="pt-6 text-center">
                <h3 className="font-semibold">Find Your Local Branch</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Connect with an experienced professional at one of our locations.
                </p>
                {branches.length > 0 && (
                  <Button asChild className="mt-4 w-full">
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

      {/* Footer */}
      <footer className="border-t bg-card py-6 mt-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            Powered by RepWell - Customer Experience Management
          </p>
        </div>
      </footer>
    </div>
  );
}
