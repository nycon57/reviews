/**
 * JSON-LD schema builders for structured data injection.
 *
 * Builds schema.org-compliant objects from widget config and reviews data.
 * Used by the embed script to inject structured data into the host page <head>.
 */

import type { PublicWidgetConfig, PublicReview, EntityProfile } from "../types";

// ── Types ────────────────────────────────────────────────────────────

export interface JsonLdSchema {
  "@context": "https://schema.org";
  "@type": string;
  name: string;
  aggregateRating?: AggregateRatingSchema;
  review?: ReviewSchema[];
  [key: string]: unknown;
}

interface AggregateRatingSchema {
  "@type": "AggregateRating";
  ratingValue: string;
  reviewCount: number;
  bestRating: string;
  worstRating: string;
}

interface ReviewSchema {
  "@type": "Review";
  author: { "@type": "Person"; name: string };
  datePublished: string;
  reviewRating: {
    "@type": "Rating";
    ratingValue: number;
    bestRating: number;
    worstRating: number;
  };
  reviewBody: string;
}

// ── Constants ────────────────────────────────────────────────────────

const MAX_REVIEW_BODY_LENGTH = 200;
const MAX_REVIEW_SNIPPETS = 10;

// ── Helpers ──────────────────────────────────────────────────────────

function buildAggregateRating(
  ratingValue: number,
  reviewCount: number
): AggregateRatingSchema {
  return {
    "@type": "AggregateRating",
    ratingValue: ratingValue.toFixed(1),
    reviewCount,
    bestRating: "5",
    worstRating: "1",
  };
}

function buildReviewSnippets(reviews: PublicReview[]): ReviewSchema[] {
  return reviews.slice(0, MAX_REVIEW_SNIPPETS).map((r) => ({
    "@type": "Review" as const,
    author: {
      "@type": "Person" as const,
      name: r.reviewer_name ?? "Anonymous",
    },
    datePublished: r.review_date
      ? new Date(r.review_date).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0],
    reviewRating: {
      "@type": "Rating" as const,
      ratingValue: r.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: r.text ? r.text.slice(0, MAX_REVIEW_BODY_LENGTH) : "",
  }));
}

function computeAverageRating(reviews: PublicReview[]): number {
  if (reviews.length === 0) return 0;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  return Math.round((sum / reviews.length) * 10) / 10;
}

// ── Schema Builders ──────────────────────────────────────────────────

/**
 * Build a LocalBusiness JSON-LD schema.
 * Used for branch widgets.
 */
function buildLocalBusiness(
  name: string,
  reviews: PublicReview[],
  profile: EntityProfile | null
): JsonLdSchema {
  const schema: JsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name,
  };

  if (profile?.address) {
    const addr = profile.address;
    if (addr.street || addr.city || addr.state) {
      schema.address = {
        "@type": "PostalAddress",
        ...(addr.street && { streetAddress: addr.street }),
        ...(addr.city && { addressLocality: addr.city }),
        ...(addr.state && { addressRegion: addr.state }),
        ...(addr.zip && { postalCode: addr.zip }),
        ...(addr.country && { addressCountry: addr.country }),
      };
    }
  }

  if (profile?.telephone) {
    schema.telephone = profile.telephone;
  }

  const avg = profile?.average_rating ?? computeAverageRating(reviews);
  const count = profile?.total_reviews ?? reviews.length;

  if (count > 0) {
    schema.aggregateRating = buildAggregateRating(avg, count);
    schema.review = buildReviewSnippets(reviews);
  }

  return schema;
}

/**
 * Build an Organization JSON-LD schema.
 * Used for company widgets.
 */
function buildOrganization(
  name: string,
  reviews: PublicReview[],
  profile: EntityProfile | null
): JsonLdSchema {
  const schema: JsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
  };

  if (profile?.url) schema.url = profile.url;
  if (profile?.logo_url) {
    schema.logo = profile.logo_url;
  }

  const avg = profile?.average_rating ?? computeAverageRating(reviews);
  const count = profile?.total_reviews ?? reviews.length;

  if (count > 0) {
    schema.aggregateRating = buildAggregateRating(avg, count);
    schema.review = buildReviewSnippets(reviews);
  }

  return schema;
}

/**
 * Build a Person JSON-LD schema.
 * Used for loan officer widgets.
 */
function buildPerson(
  name: string,
  reviews: PublicReview[],
  profile: EntityProfile | null
): JsonLdSchema {
  const schema: JsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
  };

  if (profile?.title) {
    schema.jobTitle = profile.title;
  }
  if (profile?.organization_name) {
    schema.worksFor = {
      "@type": "Organization",
      name: profile.organization_name,
    };
  }

  const avg = profile?.average_rating ?? computeAverageRating(reviews);
  const count = profile?.total_reviews ?? reviews.length;

  if (count > 0) {
    schema.aggregateRating = buildAggregateRating(avg, count);
    schema.review = buildReviewSnippets(reviews);
  }

  return schema;
}

/**
 * Build a FinancialService JSON-LD schema.
 * Fallback for MortgageBroker (maps to FinancialService per schema.org).
 */
function buildFinancialService(
  name: string,
  reviews: PublicReview[],
  profile: EntityProfile | null
): JsonLdSchema {
  const schema: JsonLdSchema = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    name,
  };

  if (profile?.logo_url) {
    schema.logo = profile.logo_url;
  }

  const avg = profile?.average_rating ?? computeAverageRating(reviews);
  const count = profile?.total_reviews ?? reviews.length;

  if (count > 0) {
    schema.aggregateRating = buildAggregateRating(avg, count);
    schema.review = buildReviewSnippets(reviews);
  }

  return schema;
}

// ── Main Builder ─────────────────────────────────────────────────────

/**
 * Build JSON-LD structured data from widget config, reviews, and entity profile.
 *
 * Schema type is resolved from `config.structured_data_type`, with fallback
 * based on `config.entity_type`:
 * - "user" -> Person
 * - "branch" -> LocalBusiness
 * - "organization" -> Organization
 */
export function buildJsonLdFromWidget(
  config: PublicWidgetConfig,
  reviews: PublicReview[],
  profile: EntityProfile | null | undefined
): JsonLdSchema {
  const schemaType = config.structured_data_type ?? resolveDefaultSchemaType(config.entity_type);
  const name = resolveName(config, profile);

  switch (schemaType) {
    case "LocalBusiness":
      return buildLocalBusiness(name, reviews, profile ?? null);
    case "Organization":
      return buildOrganization(name, reviews, profile ?? null);
    case "Person":
      return buildPerson(name, reviews, profile ?? null);
    case "FinancialService":
    case "MortgageBroker":
      return buildFinancialService(name, reviews, profile ?? null);
    default:
      // Default to Organization for unknown types
      return buildOrganization(name, reviews, profile ?? null);
  }
}

function resolveDefaultSchemaType(entityType: string): string {
  switch (entityType) {
    case "user":
      return "Person";
    case "branch":
      return "LocalBusiness";
    case "organization":
      return "Organization";
    default:
      return "Organization";
  }
}

function resolveName(
  config: PublicWidgetConfig,
  profile: EntityProfile | null | undefined
): string {
  return (
    profile?.full_name ??
    profile?.organization_name ??
    config.name ??
    "Unknown"
  );
}
