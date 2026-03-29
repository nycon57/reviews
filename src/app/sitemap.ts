import { MetadataRoute } from "next";
import { getAllPublicUserSlugs, getAllOrganizationSlugs, getAllPublicBranchSlugs } from "@/lib/seo/actions";
import { getBaseUrl } from "@/lib/seo";
import { industryFilterConfig } from "@/components/directory/industry-filter";
import { competitorSlugs } from "@/lib/competitor-pages";
import { getAllCustomerSlugs } from "@/config/customer-pages";

/**
 * Generate dynamic sitemap for SEO
 * Includes all public-facing pages:
 * - Static pages (home, about, etc.)
 * - Industry directory pages
 * - Professional profile pages
 * - Organization profile pages
 * - Branch profile pages
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

  // Industry directory pages
  const industryPages: MetadataRoute.Sitemap = Object.values(industryFilterConfig).map(({ slug }) => ({
    url: `${baseUrl}/directory/${slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  // Dynamic professional profile pages (using SEO-friendly slugs)
  const professionalSlugs = await getAllPublicUserSlugs();
  const professionalPages: MetadataRoute.Sitemap = professionalSlugs.map((slug) => ({
    url: `${baseUrl}/pro/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Organization profile pages
  const orgSlugs = await getAllOrganizationSlugs();
  const orgPages: MetadataRoute.Sitemap = orgSlugs.map((slug) => ({
    url: `${baseUrl}/org/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  // Branch profile pages
  const branchSlugs = await getAllPublicBranchSlugs();
  const branchPages: MetadataRoute.Sitemap = branchSlugs.map((slug) => ({
    url: `${baseUrl}/branch/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Competitor comparison pages
  const comparisonPages: MetadataRoute.Sitemap = competitorSlugs.map((slug) => ({
    url: `${baseUrl}/compare/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Customer case study pages
  const customerSlugs = getAllCustomerSlugs();
  const customerIndexPage: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/customers`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
  const customerDetailPages: MetadataRoute.Sitemap = customerSlugs.map((slug) => ({
    url: `${baseUrl}/customers/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...industryPages, ...comparisonPages, ...customerIndexPage, ...customerDetailPages, ...professionalPages, ...orgPages, ...branchPages];
}
