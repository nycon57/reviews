/**
 * SEO Library exports
 */

// Types
export type {
  PersonSchema,
  PersonWithRatingSchema,
  ReviewSchema,
  AggregateRatingSchema,
  BreadcrumbListSchema,
  OrganizationSchema,
  PostalAddressSchema,
  SEOMetadata,
  SEOAuditItem,
  SEOAuditResult,
  SitemapEntry,
} from "./types";

// Schema generators
export {
  generatePersonSchema,
  generateAggregateRatingSchema,
  generateReviewSchema,
  generateReviewListSchema,
  generateBreadcrumbSchema,
  generateProfilePageSchema,
  serializeSchemas,
} from "./schema-generators";

// Metadata utilities
export {
  generateLOProfileMetadata,
  generateLOListingMetadata,
  getBaseUrl,
  truncateForSEO,
  generateLOKeywords,
} from "./metadata";
