/**
 * Schema.org JSON-LD generators for structured data
 * These generate valid schema.org markup for rich search results
 */

import type { Json } from "@/types/database.types";
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
 * Minimal loan officer data for branch schema
 */
export interface SchemaBranchLoanOfficer {
  id: string;
  full_name: string;
  title: string | null;
}

interface LoanOfficerAddress {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

/**
 * Minimal LO data needed for schema generation
 */
export interface SchemaLoanOfficer {
  id: string;
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
}

/**
 * Minimal organization data needed for schema generation
 */
export interface SchemaOrganization {
  name: string;
  domain?: string | null;
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
  is_published?: boolean;
  status?: string;
}

/**
 * Generate Person schema with embedded AggregateRating for a Loan Officer profile
 */
export function generatePersonSchema(
  loanOfficer: SchemaLoanOfficer,
  organization: SchemaOrganization | null,
  baseUrl: string
): PersonWithRatingSchema {
  const profileUrl = `${baseUrl}/lo/${loanOfficer.id}`;

  // Parse address if available
  const address = loanOfficer.address as LoanOfficerAddress | null;
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
  if (loanOfficer.linkedin_url) sameAs.push(loanOfficer.linkedin_url);
  if (loanOfficer.zillow_profile_url) sameAs.push(loanOfficer.zillow_profile_url);

  // Build identifiers (NMLS ID)
  const identifiers: IdentifierSchema[] = [];
  if (loanOfficer.nmls_id) {
    identifiers.push({
      "@type": "PropertyValue",
      propertyID: "NMLS",
      value: loanOfficer.nmls_id,
    });
  }

  const schema: PersonWithRatingSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: loanOfficer.full_name,
    jobTitle: loanOfficer.title || "Loan Officer",
    description: loanOfficer.bio || `${loanOfficer.full_name} is a mortgage professional helping clients with their home financing needs.`,
    url: profileUrl,
  };

  // Add optional fields only if they have values
  if (loanOfficer.photo_url) {
    schema.image = loanOfficer.photo_url;
  }

  if (loanOfficer.email) {
    schema.email = loanOfficer.email;
  }

  if (loanOfficer.phone) {
    schema.telephone = loanOfficer.phone;
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
  if (loanOfficer.average_rating && loanOfficer.total_reviews && loanOfficer.total_reviews > 0) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(loanOfficer.average_rating),
      bestRating: 5,
      worstRating: 1,
      ratingCount: loanOfficer.total_reviews,
      reviewCount: loanOfficer.total_reviews,
    };
  }

  return schema;
}

/**
 * Generate standalone AggregateRating schema for a Loan Officer
 */
export function generateAggregateRatingSchema(
  loanOfficer: SchemaLoanOfficer,
  baseUrl: string
): AggregateRatingSchema | null {
  if (!loanOfficer.average_rating || !loanOfficer.total_reviews || loanOfficer.total_reviews === 0) {
    return null;
  }

  return {
    "@context": "https://schema.org",
    "@type": "AggregateRating",
    itemReviewed: {
      "@type": "Person",
      name: loanOfficer.full_name,
      url: `${baseUrl}/lo/${loanOfficer.id}`,
      image: loanOfficer.photo_url || undefined,
    },
    ratingValue: Number(loanOfficer.average_rating),
    bestRating: 5,
    worstRating: 1,
    ratingCount: loanOfficer.total_reviews,
    reviewCount: loanOfficer.total_reviews,
  };
}

/**
 * Generate Review schema for an individual review
 */
export function generateReviewSchema(
  review: SchemaReview,
  loanOfficer: SchemaLoanOfficer,
  organization: SchemaOrganization | null,
  baseUrl: string
): ReviewSchema {
  return {
    "@context": "https://schema.org",
    "@type": "Review",
    itemReviewed: {
      "@type": "Person",
      name: loanOfficer.full_name,
      url: `${baseUrl}/lo/${loanOfficer.id}`,
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
  loanOfficer: SchemaLoanOfficer,
  organization: SchemaOrganization | null,
  baseUrl: string
): ReviewSchema[] {
  return reviews
    .filter((review) => review.is_published && review.status === "approved")
    .map((review) => generateReviewSchema(review, loanOfficer, organization, baseUrl));
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
  loanOfficer: SchemaLoanOfficer,
  organization: SchemaOrganization | null,
  reviews: SchemaReview[],
  baseUrl: string
): object[] {
  const schemas: object[] = [];

  // Person schema with embedded aggregate rating
  schemas.push(generatePersonSchema(loanOfficer, organization, baseUrl));

  // Individual review schemas (limit to most recent 10 for performance)
  const publishedReviews = reviews
    .filter((r) => r.is_published && r.status === "approved")
    .slice(0, 10);

  for (const review of publishedReviews) {
    schemas.push(generateReviewSchema(review, loanOfficer, organization, baseUrl));
  }

  // Breadcrumb schema
  schemas.push(
    generateBreadcrumbSchema([
      { name: "Home", url: baseUrl },
      { name: "Loan Officers", url: `${baseUrl}/lo` },
      { name: loanOfficer.full_name, url: `${baseUrl}/lo/${loanOfficer.id}` },
    ])
  );

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
  loanOfficers: SchemaBranchLoanOfficer[],
  baseUrl: string
): LocalBusinessSchema {
  const profileUrl = `${baseUrl}/branch/${branch.id}`;

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

  // Add employees (loan officers)
  if (loanOfficers.length > 0) {
    schema.employee = loanOfficers.map((lo) => ({
      "@type": "Person" as const,
      name: lo.full_name,
      jobTitle: lo.title || "Loan Officer",
      url: `${baseUrl}/lo/${lo.id}`,
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
      url: `${baseUrl}/branch/${branch.id}`,
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
  loanOfficers: SchemaBranchLoanOfficer[],
  reviews: SchemaReview[],
  baseUrl: string
): object[] {
  const schemas: object[] = [];

  // LocalBusiness schema with embedded aggregate rating
  schemas.push(generateLocalBusinessSchema(branch, organization, loanOfficers, baseUrl));

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
      { name: branch.name, url: `${baseUrl}/branch/${branch.id}` },
    ])
  );

  return schemas;
}
