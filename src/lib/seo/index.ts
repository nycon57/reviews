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
  LocalBusinessSchema,
  GeoCoordinatesSchema,
  OpeningHoursSpecificationSchema,
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
  generateLocalBusinessSchema,
  generateBranchReviewSchema,
  generateBranchProfilePageSchema,
  serializeSchemas,
} from "./schema-generators";

// Metadata utilities
export {
  generateLOProfileMetadata,
  generateLOListingMetadata,
  generateBranchProfileMetadata,
  getBaseUrl,
  truncateForSEO,
  generateLOKeywords,
} from "./metadata";
