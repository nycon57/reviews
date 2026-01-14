/**
 * SEO Types and Schema.org Structured Data Interfaces
 * Based on schema.org vocabulary for rich search results
 */

// Base schema.org types
export interface WithContext<T> {
  "@context": "https://schema.org";
  "@type": T;
}

// Person schema for Loan Officers
export interface PersonSchema extends WithContext<"Person"> {
  name: string;
  jobTitle?: string;
  description?: string;
  image?: string;
  email?: string;
  telephone?: string;
  url?: string;
  worksFor?: OrganizationSchema | { "@type": "Organization"; name: string };
  sameAs?: string[];
  address?: PostalAddressSchema;
  identifier?: IdentifierSchema[];
}

// Organization schema
export interface OrganizationSchema {
  "@type": "Organization";
  name: string;
  url?: string;
  logo?: string;
  address?: PostalAddressSchema;
}

// PostalAddress schema
export interface PostalAddressSchema {
  "@type": "PostalAddress";
  streetAddress?: string;
  addressLocality?: string;
  addressRegion?: string;
  postalCode?: string;
  addressCountry?: string;
}

// Identifier schema for NMLS, licenses, etc.
export interface IdentifierSchema {
  "@type": "PropertyValue";
  propertyID: string;
  value: string;
}

// Review schema
export interface ReviewSchema extends WithContext<"Review"> {
  itemReviewed: {
    "@type": "Person" | "LocalBusiness";
    name: string;
    url?: string;
  };
  author: {
    "@type": "Person";
    name: string;
    location?: string;
  };
  reviewRating: RatingSchema;
  reviewBody?: string;
  datePublished: string;
  publisher?: {
    "@type": "Organization";
    name: string;
  };
}

// Rating schema
export interface RatingSchema {
  "@type": "Rating";
  ratingValue: number;
  bestRating: number;
  worstRating: number;
}

// AggregateRating schema
export interface AggregateRatingSchema extends WithContext<"AggregateRating"> {
  itemReviewed: {
    "@type": "Person" | "LocalBusiness";
    name: string;
    url?: string;
    image?: string;
  };
  ratingValue: number;
  bestRating: number;
  worstRating: number;
  ratingCount: number;
  reviewCount: number;
}

// Combined schema for LO profile page (Person + AggregateRating)
export interface PersonWithRatingSchema extends WithContext<"Person"> {
  name: string;
  jobTitle?: string;
  description?: string;
  image?: string;
  email?: string;
  telephone?: string;
  url?: string;
  worksFor?: { "@type": "Organization"; name: string; url?: string };
  sameAs?: string[];
  address?: PostalAddressSchema;
  identifier?: IdentifierSchema[];
  aggregateRating?: Omit<AggregateRatingSchema, "@context" | "@type" | "itemReviewed"> & {
    "@type": "AggregateRating";
  };
}

// LocalBusiness schema for branch profiles
export interface LocalBusinessSchema extends WithContext<"LocalBusiness"> {
  name: string;
  description?: string;
  url?: string;
  image?: string;
  telephone?: string;
  email?: string;
  address?: PostalAddressSchema;
  geo?: GeoCoordinatesSchema;
  openingHoursSpecification?: OpeningHoursSpecificationSchema[];
  priceRange?: string;
  aggregateRating?: Omit<AggregateRatingSchema, "@context" | "@type" | "itemReviewed"> & {
    "@type": "AggregateRating";
  };
  parentOrganization?: {
    "@type": "Organization";
    name: string;
    url?: string;
  };
  employee?: Array<{
    "@type": "Person";
    name: string;
    jobTitle?: string;
    url?: string;
  }>;
  hasMap?: string;
}

// GeoCoordinates schema for location
export interface GeoCoordinatesSchema {
  "@type": "GeoCoordinates";
  latitude?: number;
  longitude?: number;
}

// Opening hours specification
export interface OpeningHoursSpecificationSchema {
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string | string[];
  opens?: string;
  closes?: string;
}

// BreadcrumbList schema for navigation
export interface BreadcrumbListSchema extends WithContext<"BreadcrumbList"> {
  itemListElement: BreadcrumbItemSchema[];
}

export interface BreadcrumbItemSchema {
  "@type": "ListItem";
  position: number;
  name: string;
  item?: string;
}

// SEO metadata types
export interface SEOMetadata {
  title: string;
  description: string;
  canonicalUrl?: string;
  openGraph?: OpenGraphMetadata;
  twitter?: TwitterMetadata;
  robots?: RobotsMetadata;
}

export interface OpenGraphMetadata {
  title?: string;
  description?: string;
  url?: string;
  siteName?: string;
  images?: OpenGraphImage[];
  type?: "website" | "profile" | "article";
  locale?: string;
}

export interface OpenGraphImage {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
}

export interface TwitterMetadata {
  card?: "summary" | "summary_large_image" | "app" | "player";
  site?: string;
  creator?: string;
  title?: string;
  description?: string;
  image?: string;
}

export interface RobotsMetadata {
  index?: boolean;
  follow?: boolean;
  noarchive?: boolean;
  nocache?: boolean;
  noimageindex?: boolean;
}

// SEO Audit types
export interface SEOAuditItem {
  id: string;
  category: "technical" | "content" | "structured_data" | "social";
  title: string;
  description: string;
  status: "pass" | "fail" | "warning" | "not_applicable";
  details?: string;
  priority: "high" | "medium" | "low";
}

export interface SEOAuditResult {
  score: number;
  items: SEOAuditItem[];
  generatedAt: string;
}

// Sitemap types
export interface SitemapEntry {
  url: string;
  lastModified?: string;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
}
