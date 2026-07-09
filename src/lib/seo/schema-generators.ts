/**
 * Schema.org JSON-LD generators for structured data
 * These generate valid schema.org markup for rich search results
 */

import type { Json } from "@/types/database.types";
import { getBranchPublicPath } from "@/lib/branches/utils";
import type {
  PersonWithRatingSchema,
  ReviewSchema,
  AggregateRatingSchema,
  BreadcrumbListSchema,
  PostalAddressSchema,
  IdentifierSchema,
  LocalBusinessSchema,
  OpeningHoursSpecificationSchema,
} from "./types";
import { getProfessionalDateModified } from "./date-modified";

// Industry display labels and slugs for breadcrumbs
const industryLabels: Record<string, string> = {
  mortgage: "Mortgage",
  real_estate: "Real Estate",
  insurance: "Insurance",
  financial_advisory: "Financial Advisory",
  healthcare: "Healthcare",
  home_services: "Home Services",
  legal: "Legal",
  consulting: "Consulting",
};

function getIndustrySlug(industry: string): string {
  return industry.replace(/_/g, "-");
}

function getIndustryLabel(industry: string): string {
  return industryLabels[industry] || industry;
}

interface BranchAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

interface HoursOfOperation {
  [day: string]: {
    open?: string;
    close?: string;
    closed?: boolean;
  };
}

/**
 * Minimal branch data needed for schema generation
 */
export interface SchemaBranch {
  id: string;
  name: string;
  slug: string;
  global_slug?: string | null;
  description: string | null;
  address?: Json;
  phone: string | null;
  email: string | null;
  website_url?: string | null;
  hours_of_operation?: Json;
  google_maps_url?: string | null;
  photo_url: string | null;
  average_rating: number | null;
  total_reviews: number | null;
}

/**
 * Minimal professional data for branch schema
 */
export interface SchemaBranchProfessional {
  id: string;
  slug?: string | null;
  full_name: string;
  title: string | null;
}

/** @deprecated Use SchemaBranchProfessional instead */
export type SchemaBranchLoanOfficer = SchemaBranchProfessional;

interface ProfessionalAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

/**
 * Minimal professional data needed for schema generation
 */
export interface SchemaProfessional {
  id: string;
  slug?: string | null;
  full_name: string;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
  email?: string | null;
  phone?: string | null;
  address?: Json;
  linkedin_url?: string | null;
  zillow_profile_url?: string | null;
  nmls_id?: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  updated_at?: string | null;
}

/** @deprecated Use SchemaProfessional instead */
export type SchemaLoanOfficer = SchemaProfessional;

/**
 * Minimal organization data needed for schema generation
 */
export interface SchemaOrganization {
  name: string;
  domain?: string | null;
  slug?: string;
  industry?: string | null;
}

/**
 * Minimal review data needed for schema generation
 */
export interface SchemaReview {
  id: string;
  customer_name: string | null;
  customer_location?: string | null;
  rating: number;
  text: string | null;
  review_date: string;
  updated_at?: string | null;
  is_published?: boolean;
  status?: string;
}

interface OrganizationReviewSchemaInput {
  organizationName: string;
  organizationUrl?: string;
  authorName: string;
  rating: number;
  reviewBody?: string | null;
  datePublished?: string | null;
  publisherName?: string;
}

interface VideoObjectSchemaInput {
  name: string;
  description: string;
  thumbnailUrl?: string | null;
  uploadDate?: string | null;
  durationSeconds?: number | null;
  contentUrl?: string | null;
  embedUrl?: string | null;
  publisherName?: string | null;
  publisherLogoUrl?: string | null;
  authorName?: string | null;
  aboutName?: string | null;
  aboutJobTitle?: string | null;
  aboutOrganizationName?: string | null;
}

interface VideoTestimonialReviewSchemaInput {
  authorName: string;
  organizationName: string;
  organizationLogoUrl?: string | null;
  reviewBody?: string | null;
  videoContentUrl?: string | null;
  videoThumbnailUrl?: string | null;
  videoDurationSeconds?: number | null;
}

function durationToIso8601(durationSeconds?: number | null): string | undefined {
  if (!durationSeconds || durationSeconds <= 0) return undefined;

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = Math.floor(durationSeconds % 60);
  return `PT${minutes}M${seconds}S`;
}

/**
 * Generate Person schema with embedded AggregateRating for a professional profile
 */
export function generatePersonSchema(
  professional: SchemaProfessional,
  organization: SchemaOrganization | null,
  baseUrl: string,
  reviews: SchemaReview[] = []
): PersonWithRatingSchema {
  const profileUrl = `${baseUrl}/pro/${professional.slug || professional.id}`;
  const dateModified = getProfessionalDateModified(professional, reviews);

  // Parse address if available
  const address = professional.address as ProfessionalAddress | null;
  const postalAddress: PostalAddressSchema | undefined = address
    ? {
        "@type": "PostalAddress",
        streetAddress: address.street,
        addressLocality: address.city,
        addressRegion: address.state,
        postalCode: address.zip,
        addressCountry: address.country || "US",
      }
    : undefined;

  // Build sameAs array for social profiles
  const sameAs: string[] = [];
  if (professional.linkedin_url) sameAs.push(professional.linkedin_url);
  if (professional.zillow_profile_url) sameAs.push(professional.zillow_profile_url);

  // Build identifiers (NMLS ID)
  const identifiers: IdentifierSchema[] = [];
  if (professional.nmls_id) {
    identifiers.push({
      "@type": "PropertyValue",
      propertyID: "NMLS",
      value: professional.nmls_id,
    });
  }

  const schema: PersonWithRatingSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: professional.full_name,
    jobTitle: professional.title || "Professional",
    description: professional.bio || `${professional.full_name} is a professional helping clients with their needs.`,
    url: profileUrl,
  };

  if (dateModified) {
    (schema as PersonWithRatingSchema & { dateModified: string }).dateModified =
      dateModified;
  }

  // Add optional fields only if they have values
  if (professional.photo_url) {
    schema.image = professional.photo_url;
  }

  if (professional.email) {
    schema.email = professional.email;
  }

  if (professional.phone) {
    schema.telephone = professional.phone;
  }

  if (organization) {
    schema.worksFor = {
      "@type": "Organization",
      name: organization.name,
      url: organization.domain || undefined,
    };
  }

  if (sameAs.length > 0) {
    schema.sameAs = sameAs;
  }

  if (postalAddress && (postalAddress.addressLocality || postalAddress.addressRegion)) {
    schema.address = postalAddress;
  }

  if (identifiers.length > 0) {
    schema.identifier = identifiers;
  }

  // Add aggregate rating if LO has reviews
  if (professional.average_rating && professional.total_reviews && professional.total_reviews > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(professional.average_rating),
      bestRating: 5,
      worstRating: 1,
      ratingCount: professional.total_reviews,
      reviewCount: professional.total_reviews,
    };
  }

  return schema;
}

/**
 * Generate standalone AggregateRating schema for a Loan Officer
 */
export function generateAggregateRatingSchema(
  professional: SchemaProfessional,
  baseUrl: string
): AggregateRatingSchema | null {
  if (!professional.average_rating || !professional.total_reviews || professional.total_reviews === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    itemReviewed: {
      "@type": "Person",
      name: professional.full_name,
      url: `${baseUrl}/pro/${professional.slug || professional.id}`,
      image: professional.photo_url || undefined,
    },
    ratingValue: Number(professional.average_rating),
    bestRating: 5,
    worstRating: 1,
    ratingCount: professional.total_reviews,
    reviewCount: professional.total_reviews,
  };
}

export function buildAggregateRatingSchema(
  averageRating: number | null | undefined,
  totalReviews: number | null | undefined
) {
  if (!averageRating || !totalReviews || totalReviews === 0) {
    return null;
  }

  return {
    "@type": "AggregateRating",
    ratingValue: Number(averageRating),
    bestRating: 5,
    worstRating: 1,
    ratingCount: totalReviews,
    reviewCount: totalReviews,
  };
}

/**
 * Generate Review schema for an individual review
 */
export function generateReviewSchema(
  review: SchemaReview,
  professional: SchemaProfessional,
  organization: SchemaOrganization | null,
  baseUrl: string
): ReviewSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "Person",
      name: professional.full_name,
      url: `${baseUrl}/pro/${professional.slug || professional.id}`,
    },
    author: {
      "@type": "Person",
      name: review.customer_name || "Anonymous",
      location: review.customer_location || undefined,
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: review.text || undefined,
    datePublished: review.review_date,
    publisher: organization
      ? {
          "@type": "Organization",
          name: organization.name,
        }
      : undefined,
  };
}

/**
 * Generate an array of Review schemas for multiple reviews
 */
export function generateReviewListSchema(
  reviews: SchemaReview[],
  professional: SchemaProfessional,
  organization: SchemaOrganization | null,
  baseUrl: string
): ReviewSchema[] {
  return reviews
    .filter((review) => review.is_published && review.status === "approved")
    .map((review) => generateReviewSchema(review, professional, organization, baseUrl));
}

export function generateOrganizationReviewSnippetSchema(
  input: OrganizationReviewSchemaInput
): object {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    author: {
      "@type": "Person",
      name: input.authorName,
    },
    itemReviewed: {
      "@type": "Organization",
      name: input.organizationName,
      url: input.organizationUrl,
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: input.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: input.reviewBody || undefined,
    datePublished: input.datePublished || undefined,
    publisher: input.publisherName
      ? {
          "@type": "Organization",
          name: input.publisherName,
        }
      : undefined,
  };
}

export function generateVideoObjectSchema(input: VideoObjectSchemaInput): object {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: input.name,
    description: input.description,
    thumbnailUrl: input.thumbnailUrl || undefined,
    uploadDate: input.uploadDate || undefined,
    duration: durationToIso8601(input.durationSeconds),
    contentUrl: input.contentUrl || undefined,
    embedUrl: input.embedUrl || undefined,
    publisher: input.publisherName
      ? {
          "@type": "Organization",
          name: input.publisherName,
          logo: input.publisherLogoUrl
            ? {
                "@type": "ImageObject",
                url: input.publisherLogoUrl,
              }
            : undefined,
        }
      : undefined,
    author: input.authorName
      ? {
          "@type": "Person",
          name: input.authorName,
        }
      : undefined,
    about: input.aboutName
      ? {
          "@type": "Person",
          name: input.aboutName,
          jobTitle: input.aboutJobTitle || "Professional",
          worksFor: input.aboutOrganizationName
            ? {
                "@type": "Organization",
                name: input.aboutOrganizationName,
              }
            : undefined,
        }
      : undefined,
  };
}

export function generateVideoTestimonialReviewSchema(
  input: VideoTestimonialReviewSchemaInput
): object {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    author: {
      "@type": "Person",
      name: input.authorName,
    },
    itemReviewed: {
      "@type": "LocalBusiness",
      name: input.organizationName,
      image: input.organizationLogoUrl || undefined,
    },
    reviewBody: input.reviewBody || undefined,
    video: {
      "@type": "VideoObject",
      contentUrl: input.videoContentUrl || undefined,
      thumbnailUrl: input.videoThumbnailUrl || undefined,
      duration: durationToIso8601(input.videoDurationSeconds),
    },
  };
}

/**
 * Generate BreadcrumbList schema for navigation
 */
export function generateBreadcrumbSchema(
  items: Array<{ name: string; url?: string }>
): BreadcrumbListSchema {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate combined JSON-LD script content for a LO profile page
 * This includes Person schema, AggregateRating, recent Reviews, and Breadcrumbs
 */
export function generateProfilePageSchema(
  professional: SchemaProfessional,
  organization: SchemaOrganization | null,
  reviews: SchemaReview[],
  baseUrl: string
): object[] {
  const schemas: object[] = [];

  // Person schema with embedded aggregate rating
  schemas.push(generatePersonSchema(professional, organization, baseUrl, reviews));

  // Individual review schemas (limit to most recent 10 for performance)
  const publishedReviews = reviews
    .filter((r) => r.is_published && r.status === "approved")
    .slice(0, 10);

  for (const review of publishedReviews) {
    schemas.push(generateReviewSchema(review, professional, organization, baseUrl));
  }

  // Breadcrumb schema - include industry and org if available
  const breadcrumbItems = [
    { name: "Home", url: baseUrl },
    { name: "Find a Professional", url: `${baseUrl}/directory` },
  ];

  if (organization?.industry) {
    const industrySlug = getIndustrySlug(organization.industry);
    const industryLabel = getIndustryLabel(organization.industry);
    breadcrumbItems.push({
      name: industryLabel,
      url: `${baseUrl}/directory/${industrySlug}`,
    });
  }

  if (organization?.slug) {
    breadcrumbItems.push({
      name: organization.name,
      url: `${baseUrl}/org/${organization.slug}`,
    });
  }

  breadcrumbItems.push({
    name: professional.full_name,
    url: `${baseUrl}/pro/${professional.slug || professional.id}`,
  });

  schemas.push(generateBreadcrumbSchema(breadcrumbItems));

  return schemas;
}

/**
 * Serialize schemas to JSON-LD script tag content
 */
export function serializeSchemas(schemas: object[]): string {
  if (schemas.length === 0) return "";
  if (schemas.length === 1) return JSON.stringify(schemas[0]);
  return JSON.stringify(schemas);
}

/**
 * Generate LocalBusiness schema for a branch profile
 */
export function generateLocalBusinessSchema(
  branch: SchemaBranch,
  organization: SchemaOrganization | null,
  professionals: SchemaBranchProfessional[],
  baseUrl: string
): LocalBusinessSchema {
  const profileUrl = `${baseUrl}${getBranchPublicPath(branch)}`;

  // Parse address if available
  const address = branch.address as BranchAddress | null;
  const postalAddress: PostalAddressSchema | undefined = address
    ? {
        "@type": "PostalAddress",
        streetAddress: address.street,
        addressLocality: address.city,
        addressRegion: address.state,
        postalCode: address.zip,
        addressCountry: address.country || "US",
      }
    : undefined;

  // Parse opening hours if available
  const hours = branch.hours_of_operation as HoursOfOperation | null;
  const openingHours: OpeningHoursSpecificationSchema[] = [];
  if (hours) {
    const dayMapping: Record<string, string> = {
      monday: "Monday",
      tuesday: "Tuesday",
      wednesday: "Wednesday",
      thursday: "Thursday",
      friday: "Friday",
      saturday: "Saturday",
      sunday: "Sunday",
    };

    for (const [day, schedule] of Object.entries(hours)) {
      const dayName = dayMapping[day.toLowerCase()];
      if (dayName && schedule && !schedule.closed) {
        openingHours.push({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: dayName,
          opens: schedule.open,
          closes: schedule.close,
        });
      }
    }
  }

  const schema: LocalBusinessSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: branch.name,
    description: branch.description || `${branch.name} - Your trusted mortgage lending branch.`,
    url: profileUrl,
  };

  // Add optional fields only if they have values
  if (branch.photo_url) {
    schema.image = branch.photo_url;
  }

  if (branch.phone) {
    schema.telephone = branch.phone;
  }

  if (branch.email) {
    schema.email = branch.email;
  }

  if (postalAddress && (postalAddress.addressLocality || postalAddress.addressRegion)) {
    schema.address = postalAddress;
  }

  if (openingHours.length > 0) {
    schema.openingHoursSpecification = openingHours;
  }

  if (organization) {
    schema.parentOrganization = {
      "@type": "Organization",
      name: organization.name,
      url: organization.domain || undefined,
    };
  }

  // Add employees (professionals)
  if (professionals.length > 0) {
    schema.employee = professionals.map((prof) => ({
      "@type": "Person" as const,
      name: prof.full_name,
      jobTitle: prof.title || "Professional",
      url: `${baseUrl}/pro/${prof.slug || prof.id}`,
    }));
  }

  // Add Google Maps link
  if (branch.google_maps_url) {
    schema.hasMap = branch.google_maps_url;
  }

  // Add aggregate rating if branch has reviews
  if (branch.average_rating && branch.total_reviews && branch.total_reviews > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(branch.average_rating),
      bestRating: 5,
      worstRating: 1,
      ratingCount: branch.total_reviews,
      reviewCount: branch.total_reviews,
    };
  }

  return schema;
}

/**
 * Generate Review schema for a branch review
 */
export function generateBranchReviewSchema(
  review: SchemaReview,
  branch: SchemaBranch,
  organization: SchemaOrganization | null,
  baseUrl: string
): ReviewSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "LocalBusiness",
      name: branch.name,
      url: `${baseUrl}${getBranchPublicPath(branch)}`,
    },
    author: {
      "@type": "Person",
      name: review.customer_name || "Anonymous",
      location: review.customer_location || undefined,
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: review.text || undefined,
    datePublished: review.review_date,
    publisher: organization
      ? {
          "@type": "Organization",
          name: organization.name,
        }
      : undefined,
  };
}

/**
 * Generate combined JSON-LD script content for a branch profile page
 * This includes LocalBusiness schema, recent Reviews, and Breadcrumbs
 */
export function generateBranchProfilePageSchema(
  branch: SchemaBranch,
  organization: SchemaOrganization | null,
  professionals: SchemaBranchProfessional[],
  reviews: SchemaReview[],
  baseUrl: string
): object[] {
  const schemas: object[] = [];

  // LocalBusiness schema with embedded aggregate rating
  schemas.push(generateLocalBusinessSchema(branch, organization, professionals, baseUrl));

  // Individual review schemas (limit to most recent 10 for performance)
  const publishedReviews = reviews
    .filter((r) => r.is_published && r.status === "approved")
    .slice(0, 10);

  for (const review of publishedReviews) {
    schemas.push(generateBranchReviewSchema(review, branch, organization, baseUrl));
  }

  // Breadcrumb schema
  schemas.push(
    generateBreadcrumbSchema([
      { name: "Home", url: baseUrl },
      { name: "Branches", url: `${baseUrl}/branch` },
      { name: branch.name, url: `${baseUrl}${getBranchPublicPath(branch)}` },
    ])
  );

  return schemas;
}

// ============================================
// ORGANIZATION PROFILE SCHEMA GENERATORS
// ============================================

interface OrganizationAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

/**
 * Minimal organization data needed for full schema generation
 */
export interface SchemaOrganizationFull {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  logo_url: string | null;
  description: string | null;
  mission_statement: string | null;
  website_url: string | null;
  headquarters_address?: OrganizationAddress | null;
  aggregate_rating: number | null;
  total_reviews: number;
  total_branches: number;
  total_members: number;
  industry?: string | null;
}

/**
 * Branch data for organization schema
 */
export interface SchemaOrgBranch {
  id: string;
  name: string;
  global_slug?: string | null;
  address?: Json;
}

/**
 * Professional data for organization schema
 */
export interface SchemaOrgProfessional {
  id: string;
  slug: string | null;
  full_name: string;
  title: string | null;
}

/** @deprecated Use SchemaOrgProfessional instead */
export type SchemaOrgLoanOfficer = SchemaOrgProfessional;

/**
 * Testimonial data for organization schema
 */
export interface SchemaOrgTestimonial {
  id: string;
  customer_name: string | null;
  customer_location?: string | null;
  rating: number;
  text: string | null;
  review_date: string;
}

interface OrganizationWithRatingSchema {
  "@context": "https://schema.org";
  "@type": "Organization";
  "@id": string;
  name: string;
  url?: string;
  logo?: string;
  description?: string;
  slogan?: string;
  address?: PostalAddressSchema;
  numberOfEmployees?: {
    "@type": "QuantitativeValue";
    value: number;
  };
  department?: Array<{
    "@type": "LocalBusiness";
    name: string;
    url: string;
    address?: PostalAddressSchema;
  }>;
  employee?: Array<{
    "@type": "Person";
    name: string;
    jobTitle?: string;
    url: string;
  }>;
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: number;
    bestRating: number;
    worstRating: number;
    ratingCount: number;
    reviewCount: number;
  };
}

/**
 * Generate Organization schema with embedded AggregateRating for organization profile
 */
export function generateOrganizationWithRatingSchema(
  org: SchemaOrganizationFull,
  branches: SchemaOrgBranch[],
  professionals: SchemaOrgProfessional[],
  baseUrl: string
): OrganizationWithRatingSchema {
  const profileUrl = `${baseUrl}/org/${org.slug}`;
  const websiteUrl = org.website_url || org.domain || profileUrl;

  // Parse headquarters address if available
  const address = org.headquarters_address as OrganizationAddress | null;
  const postalAddress: PostalAddressSchema | undefined = address
    ? {
        "@type": "PostalAddress",
        streetAddress: address.street,
        addressLocality: address.city,
        addressRegion: address.state,
        postalCode: address.zip,
        addressCountry: address.country || "US",
      }
    : undefined;

  const schema: OrganizationWithRatingSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": profileUrl,
    name: org.name,
    url: websiteUrl,
  };

  // Add optional fields only if they have values
  if (org.logo_url) {
    schema.logo = org.logo_url;
  }

  if (org.description) {
    schema.description = org.description;
  }

  if (org.mission_statement) {
    schema.slogan = org.mission_statement;
  }

  if (postalAddress && (postalAddress.addressLocality || postalAddress.addressRegion)) {
    schema.address = postalAddress;
  }

  // Add number of employees
  if (org.total_members > 0) {
    schema.numberOfEmployees = {
      "@type": "QuantitativeValue",
      value: org.total_members,
    };
  }

  // Add branches as departments (limit to first 10 for performance)
  if (branches.length > 0) {
    schema.department = branches.slice(0, 10).map((branch) => {
      const branchAddress = branch.address as OrganizationAddress | null;
      const branchEntry: {
        "@type": "LocalBusiness";
        name: string;
        url: string;
        address?: PostalAddressSchema;
      } = {
        "@type": "LocalBusiness",
        name: branch.name,
        url: `${baseUrl}${getBranchPublicPath(branch)}`,
      };

      if (branchAddress && (branchAddress.city || branchAddress.state)) {
        branchEntry.address = {
          "@type": "PostalAddress",
          streetAddress: branchAddress.street,
          addressLocality: branchAddress.city,
          addressRegion: branchAddress.state,
          postalCode: branchAddress.zip,
          addressCountry: branchAddress.country || "US",
        };
      }

      return branchEntry;
    });
  }

  // Add featured employees (limit to first 6 for performance)
  if (professionals.length > 0) {
    schema.employee = professionals.slice(0, 6).map((prof) => ({
      "@type": "Person",
      name: prof.full_name,
      jobTitle: prof.title || "Professional",
      url: `${baseUrl}/pro/${prof.slug || prof.id}`,
    }));
  }

  // Add aggregate rating if organization has reviews
  if (org.aggregate_rating && org.total_reviews > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(org.aggregate_rating.toFixed(2)),
      bestRating: 5,
      worstRating: 1,
      ratingCount: org.total_reviews,
      reviewCount: org.total_reviews,
    };
  }

  return schema;
}

/**
 * Generate Review schema for an organization testimonial
 */
export function generateOrganizationReviewSchema(
  review: SchemaOrgTestimonial,
  org: SchemaOrganizationFull,
  baseUrl: string
): ReviewSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "LocalBusiness",
      name: org.name,
      url: `${baseUrl}/org/${org.slug}`,
    },
    author: {
      "@type": "Person",
      name: review.customer_name || "Anonymous",
      location: review.customer_location || undefined,
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: review.text || undefined,
    datePublished: review.review_date,
    publisher: {
      "@type": "Organization",
      name: org.name,
    },
  };
}

/**
 * Generate combined JSON-LD script content for an organization profile page
 * This includes Organization schema, recent Reviews, and Breadcrumbs
 */
export function generateOrganizationProfilePageSchema(
  org: SchemaOrganizationFull,
  branches: SchemaOrgBranch[],
  professionals: SchemaOrgProfessional[],
  testimonials: SchemaOrgTestimonial[],
  baseUrl: string
): object[] {
  const schemas: object[] = [];

  // Organization schema with embedded aggregate rating
  schemas.push(generateOrganizationWithRatingSchema(org, branches, professionals, baseUrl));

  // Individual review schemas (limit to most recent 5 for performance)
  const topTestimonials = testimonials.slice(0, 5);

  for (const testimonial of topTestimonials) {
    schemas.push(generateOrganizationReviewSchema(testimonial, org, baseUrl));
  }

  // Breadcrumb schema - include industry if available
  const breadcrumbItems = [
    { name: "Home", url: baseUrl },
    { name: "Find a Professional", url: `${baseUrl}/directory` },
  ];

  if (org.industry) {
    const industrySlug = getIndustrySlug(org.industry);
    const industryLabel = getIndustryLabel(org.industry);
    breadcrumbItems.push({
      name: industryLabel,
      url: `${baseUrl}/directory/${industrySlug}`,
    });
  }

  breadcrumbItems.push({
    name: org.name,
    url: `${baseUrl}/org/${org.slug}`,
  });

  schemas.push(generateBreadcrumbSchema(breadcrumbItems));

  return schemas;
}
