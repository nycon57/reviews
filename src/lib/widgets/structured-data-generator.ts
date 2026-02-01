/**
 * Server-side JSON-LD structured data generator.
 *
 * Shared logic used by both the /api/v1/widgets/:widgetId/structured-data
 * endpoint and the dashboard SEO preview component.
 *
 * Generates schema.org-compliant JSON-LD for LocalBusiness, Organization,
 * Person, and FinancialService types based on widget entity configuration.
 */

// ── Types ────────────────────────────────────────────────────────────

export interface JsonLdOutput {
  "@context": "https://schema.org";
  "@type": string;
  name: string;
  aggregateRating?: {
    "@type": "AggregateRating";
    ratingValue: string;
    reviewCount: number;
    bestRating: string;
    worstRating: string;
  };
  review?: {
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
  }[];
  [key: string]: unknown;
}

export interface ReviewData {
  rating: number;
  customer_name: string | null;
  text: string | null;
  review_date: string | null;
}

export interface EntityData {
  name: string;
  logo_url?: string | null;
  url?: string | null;
  title?: string | null;
  works_for?: string | null;
  address?: {
    street?: string | null;
    city?: string | null;
    state?: string | null;
    zip?: string | null;
    country?: string | null;
  } | null;
  telephone?: string | null;
}

// ── Constants ────────────────────────────────────────────────────────

const MAX_REVIEW_BODY_LENGTH = 200;
const MAX_REVIEW_SNIPPETS = 10;

// ── Helpers ──────────────────────────────────────────────────────────

/** Safely format a date string to ISO 8601 (YYYY-MM-DD). Falls back to today's date. */
function safeIsoDate(dateStr: string | null | undefined): string {
  const fallback = new Date().toISOString().split("T")[0];
  if (!dateStr) return fallback;
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return fallback;
    return d.toISOString().split("T")[0];
  } catch {
    return fallback;
  }
}

function buildAggregateRating(reviews: ReviewData[]) {
  if (reviews.length === 0) return undefined;

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const avg = Math.round((sum / reviews.length) * 10) / 10;

  return {
    "@type": "AggregateRating" as const,
    ratingValue: avg.toFixed(1),
    reviewCount: reviews.length,
    bestRating: "5",
    worstRating: "1",
  };
}

function buildReviewSnippets(reviews: ReviewData[]) {
  return reviews.slice(0, MAX_REVIEW_SNIPPETS).map((r) => ({
    "@type": "Review" as const,
    author: {
      "@type": "Person" as const,
      name: r.customer_name ?? "Anonymous",
    },
    datePublished: safeIsoDate(r.review_date),
    reviewRating: {
      "@type": "Rating" as const,
      ratingValue: r.rating,
      bestRating: 5,
      worstRating: 1,
    },
    reviewBody: r.text ? r.text.slice(0, MAX_REVIEW_BODY_LENGTH) : "",
  }));
}

// ── Schema Builders ──────────────────────────────────────────────────

function buildLocalBusiness(
  entity: EntityData,
  reviews: ReviewData[]
): JsonLdOutput {
  const schema: JsonLdOutput = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: entity.name,
  };

  if (entity.address) {
    const addr = entity.address;
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

  if (entity.telephone) {
    schema.telephone = entity.telephone;
  }

  const agg = buildAggregateRating(reviews);
  if (agg) {
    schema.aggregateRating = agg;
    schema.review = buildReviewSnippets(reviews);
  }

  return schema;
}

function buildOrganization(
  entity: EntityData,
  reviews: ReviewData[]
): JsonLdOutput {
  const schema: JsonLdOutput = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: entity.name,
  };

  if (entity.url) schema.url = entity.url;
  if (entity.logo_url) schema.logo = entity.logo_url;

  const agg = buildAggregateRating(reviews);
  if (agg) {
    schema.aggregateRating = agg;
    schema.review = buildReviewSnippets(reviews);
  }

  return schema;
}

function buildPerson(
  entity: EntityData,
  reviews: ReviewData[]
): JsonLdOutput {
  const schema: JsonLdOutput = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: entity.name,
  };

  if (entity.title) schema.jobTitle = entity.title;
  if (entity.works_for) {
    schema.worksFor = {
      "@type": "Organization",
      name: entity.works_for,
    };
  }

  const agg = buildAggregateRating(reviews);
  if (agg) {
    schema.aggregateRating = agg;
    schema.review = buildReviewSnippets(reviews);
  }

  return schema;
}

function buildFinancialService(
  entity: EntityData,
  reviews: ReviewData[]
): JsonLdOutput {
  const schema: JsonLdOutput = {
    "@context": "https://schema.org",
    "@type": "FinancialService",
    name: entity.name,
  };

  if (entity.url) schema.url = entity.url;
  if (entity.logo_url) schema.logo = entity.logo_url;

  if (entity.address) {
    const addr = entity.address;
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

  if (entity.telephone) {
    schema.telephone = entity.telephone;
  }

  const agg = buildAggregateRating(reviews);
  if (agg) {
    schema.aggregateRating = agg;
    schema.review = buildReviewSnippets(reviews);
  }

  return schema;
}

// ── Main Generator ───────────────────────────────────────────────────

/**
 * Generate JSON-LD structured data for a widget.
 *
 * @param schemaType - The schema.org type (LocalBusiness, Organization, Person, FinancialService, MortgageBroker)
 * @param entity - Entity data (name, logo, address, etc.)
 * @param reviews - Array of review data
 */
export function generateStructuredData(
  schemaType: string,
  entity: EntityData,
  reviews: ReviewData[]
): JsonLdOutput {
  switch (schemaType) {
    case "LocalBusiness":
      return buildLocalBusiness(entity, reviews);
    case "Organization":
      return buildOrganization(entity, reviews);
    case "Person":
      return buildPerson(entity, reviews);
    case "FinancialService":
    case "MortgageBroker":
      return buildFinancialService(entity, reviews);
    default:
      return buildOrganization(entity, reviews);
  }
}

/**
 * Resolve the default schema type based on entity type.
 */
export function resolveDefaultSchemaType(entityType: string): string {
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
