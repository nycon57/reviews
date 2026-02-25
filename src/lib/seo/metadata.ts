/**
 * SEO Metadata utilities for generating Next.js metadata objects
 */

import type { Metadata } from "next";
import type { Tables, Json } from "@/types/database.types";

type Branch = Tables<"branches">;

/**
 * Minimal professional data needed for metadata generation
 */
interface MetadataProfessional {
  id: string;
  slug?: string | null;
  full_name: string;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
  branch?: string | null;
  region?: string | null;
  nmls_id?: string | null;
  address?: Json | null;
  average_rating: number | null;
  total_reviews: number | null;
}

/**
 * Minimal branch data needed for metadata generation
 */
interface MetadataBranch {
  id: string;
  name: string;
  global_slug?: string | null;
  description: string | null;
  photo_url: string | null;
  cover_image_url?: string | null;
  address?: Branch["address"];
  region?: string | null;
  average_rating: number | null;
  total_reviews: number | null;
  total_members?: number | null;
}

interface MetadataOrganization {
  name: string;
}

/**
 * Generate metadata for a professional profile page
 */
export function generateLOProfileMetadata(
  professional: MetadataProfessional,
  organization: MetadataOrganization | null,
  baseUrl: string
): Metadata {
  const title = `${professional.full_name} - ${professional.title || "Professional"} Reviews`;
  const description =
    professional.bio ||
    `Read reviews and ratings for ${professional.full_name}, ${professional.title || "Professional"}${organization ? ` at ${organization.name}` : ""}. ${professional.total_reviews || 0} reviews with ${professional.average_rating ? `${Number(professional.average_rating).toFixed(1)} average rating` : "ratings available"}.`;
  const profileUrl = `${baseUrl}/pro/${professional.slug}`;

  const metadata: Metadata = {
    title,
    description: description.slice(0, 160), // SEO best practice: 155-160 chars
    alternates: {
      canonical: profileUrl,
    },
    openGraph: {
      title,
      description,
      url: profileUrl,
      type: "profile",
      siteName: organization?.name || "RepWell",
      locale: "en_US",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };

  // Add image if photo exists
  if (professional.photo_url) {
    metadata.openGraph = {
      ...metadata.openGraph,
      images: [
        {
          url: professional.photo_url,
          width: 400,
          height: 400,
          alt: `${professional.full_name} profile photo`,
        },
      ],
    };
    metadata.twitter = {
      ...metadata.twitter,
      images: [professional.photo_url],
    };
  }

  return metadata;
}

/**
 * Generate metadata for the professionals listing page
 */
export function generateLOListingMetadata(
  organization: MetadataOrganization | null,
  baseUrl: string
): Metadata {
  const siteName = organization?.name || "RepWell";
  const title = `Our Professionals - ${siteName}`;
  const description = `Meet our team of experienced professionals. Read reviews and ratings to find the right team member for your needs.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${baseUrl}/pro`,
    },
    openGraph: {
      title,
      description,
      url: `${baseUrl}/pro`,
      type: "website",
      siteName,
      locale: "en_US",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

/**
 * Generate base URL from environment or request
 */
export function getBaseUrl(): string {
  // Check for explicit base URL env var first
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  // Vercel deployment URL
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // Default to localhost in development
  return "http://localhost:3000";
}

/**
 * Truncate text for SEO purposes while keeping it readable
 */
export function truncateForSEO(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;

  // Try to cut at a word boundary
  const truncated = text.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > maxLength - 30) {
    return truncated.slice(0, lastSpace) + "...";
  }

  return truncated + "...";
}

/**
 * Generate keywords from LO profile data
 */
export function generateLOKeywords(
  professional: MetadataProfessional,
  organization: MetadataOrganization | null
): string[] {
  const keywords: string[] = [
    professional.full_name,
    "loan officer",
    "mortgage",
    "reviews",
    "ratings",
  ];

  if (professional.title) keywords.push(professional.title);
  if (organization?.name) keywords.push(organization.name);
  if (professional.branch) keywords.push(professional.branch);
  if (professional.region) keywords.push(professional.region);
  if (professional.nmls_id) keywords.push(`NMLS ${professional.nmls_id}`);

  // Parse address for location keywords
  const address = professional.address as { city?: string; state?: string } | null;
  if (address?.city) keywords.push(address.city);
  if (address?.state) keywords.push(address.state);

  return keywords.filter(Boolean);
}

/**
 * Generate metadata for a Branch profile page
 */
export function generateBranchProfileMetadata(
  branch: MetadataBranch,
  organization: MetadataOrganization | null,
  baseUrl: string
): Metadata {
  const siteName = organization?.name || "RepWell";

  // Parse address for location context
  const address = branch.address as { city?: string; state?: string } | null;
  const locationStr = address
    ? [address.city, address.state].filter(Boolean).join(", ")
    : branch.region || "";

  const title = locationStr
    ? `${branch.name} - ${locationStr} - ${siteName}`
    : `${branch.name} - ${siteName}`;

  const loCount = branch.total_members || 0;
  const reviewCount = branch.total_reviews || 0;
  const avgRating = branch.average_rating
    ? Number(branch.average_rating).toFixed(1)
    : null;

  const description =
    branch.description ||
    `Visit ${branch.name}${locationStr ? ` in ${locationStr}` : ""}. Meet our team of ${loCount} experienced professionals. ${reviewCount} customer reviews${avgRating ? ` with ${avgRating} average rating` : ""}.`;

  const profileUrl = `${baseUrl}/branch/${branch.global_slug || branch.id}`;

  const metadata: Metadata = {
    title,
    description: description.slice(0, 160),
    alternates: {
      canonical: profileUrl,
    },
    openGraph: {
      title,
      description,
      url: profileUrl,
      type: "website",
      siteName,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };

  // Add image if photo exists (prefer cover image)
  const imageUrl = branch.cover_image_url || branch.photo_url;
  if (imageUrl) {
    metadata.openGraph = {
      ...metadata.openGraph,
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${branch.name} branch location`,
        },
      ],
    };
    metadata.twitter = {
      ...metadata.twitter,
      images: [imageUrl],
    };
  }

  return metadata;
}

/**
 * Minimal organization data needed for metadata generation
 */
interface MetadataOrganizationFull {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  description: string | null;
  aggregate_rating: number | null;
  total_reviews: number;
  total_branches: number;
  total_members: number;
}

/**
 * Generate metadata for an Organization profile page
 */
export function generateOrganizationProfileMetadata(
  organization: MetadataOrganizationFull,
  baseUrl: string
): Metadata {
  const siteName = organization.name;
  const loCount = organization.total_members || 0;
  const branchCount = organization.total_branches || 0;
  const reviewCount = organization.total_reviews || 0;
  const avgRating = organization.aggregate_rating
    ? Number(organization.aggregate_rating).toFixed(1)
    : null;

  const title = `${organization.name} - Customer Reviews & Locations`;

  const description =
    organization.description ||
    `Explore ${organization.name} with ${branchCount} locations and ${loCount} professionals. ${reviewCount} customer reviews${avgRating ? ` with ${avgRating} average rating` : ""}. Find your local branch and team member.`;

  const profileUrl = `${baseUrl}/org/${organization.slug}`;

  const metadata: Metadata = {
    title,
    description: description.slice(0, 160),
    alternates: {
      canonical: profileUrl,
    },
    openGraph: {
      title,
      description,
      url: profileUrl,
      type: "website",
      siteName,
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };

  // Add image if logo exists
  if (organization.logo_url) {
    metadata.openGraph = {
      ...metadata.openGraph,
      images: [
        {
          url: organization.logo_url,
          width: 800,
          height: 800,
          alt: `${organization.name} logo`,
        },
      ],
    };
    metadata.twitter = {
      ...metadata.twitter,
      images: [organization.logo_url],
    };
  }

  return metadata;
}
