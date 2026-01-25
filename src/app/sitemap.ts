import { MetadataRoute } from "next";
import { getAllPublicLOIds, getAllOrganizationSlugs } from "@/lib/seo/actions";
import { getBaseUrl } from "@/lib/seo";

/**
 * Generate dynamic sitemap for SEO
 * Includes all public-facing pages:
 * - Static pages (home, about, etc.)
 * - Loan officer profile pages
 * - Organization-specific LO listing pages
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getBaseUrl();
  const now = new Date().toISOString();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/directory`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/pro`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  // Dynamic professional profile pages
  const professionalIds = await getAllPublicLOIds();
  const professionalPages: MetadataRoute.Sitemap = professionalIds.map((id) => ({
    url: `${baseUrl}/pro/${id}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Organization-specific listing pages (if using org slugs)
  const orgSlugs = await getAllOrganizationSlugs();
  const orgPages: MetadataRoute.Sitemap = orgSlugs.map((slug) => ({
    url: `${baseUrl}/org/${slug}/team`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...professionalPages, ...orgPages];
}
