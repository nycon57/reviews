import { MetadataRoute } from "next";
import { getAllPublicUserSlugs, getAllOrganizationSlugs, getAllPublicBranchSlugs } from "@/lib/seo/actions";
import { getBaseUrl } from "@/lib/seo";
import { industryFilterConfig } from "@/components/directory/industry-filter";
import { competitorSlugs } from "@/lib/competitor-pages";
import { getAllIntegrationSlugs } from "@/config/integration-pages";
import { docSections } from "@/lib/docs/content";
import { getAllCustomerSlugs } from "@/config/customer-pages";
import { getAllPostSlugs } from "@/lib/blog";
import { getAllIndustryPageSlugs } from "@/config/industry-pages";
import { getAllSolutionPageSlugs } from "@/config/solution-pages";
import { getAllFeaturePageSlugs } from "@/config/feature-pages";

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
  const toSitemapEntries = (
    slugs: string[],
    prefix: string,
    priority: number
  ): MetadataRoute.Sitemap =>
    slugs.map((slug) => ({
      url: `${baseUrl}/${prefix}/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority,
    }));

  const [blogSlugs, professionalSlugs, orgSlugs, branchSlugs] = await Promise.all([
    getAllPostSlugs(),
    getAllPublicUserSlugs(),
    getAllOrganizationSlugs(),
    getAllPublicBranchSlugs(),
  ]);

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
    {
      url: `${baseUrl}/security`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.75,
    },
  ];

  // Industry directory pages
  const industryPages: MetadataRoute.Sitemap = Object.values(industryFilterConfig).map(({ slug }) => ({
    url: `${baseUrl}/directory/${slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  // Blog posts
  const blogPages = toSitemapEntries(blogSlugs, "blog", 0.65);

  // Industry landing pages
  const industryLandingPages = toSitemapEntries(
    getAllIndustryPageSlugs(),
    "for",
    0.75
  );

  // Solution landing pages
  const solutionPages = toSitemapEntries(
    getAllSolutionPageSlugs(),
    "solutions",
    0.75
  );

  // Feature landing pages
  const featurePages = toSitemapEntries(
    getAllFeaturePageSlugs(),
    "features",
    0.75
  );

  // Dynamic professional profile pages (using SEO-friendly slugs)
  const professionalPages: MetadataRoute.Sitemap = professionalSlugs.map((slug) => ({
    url: `${baseUrl}/pro/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Organization profile pages
  const orgPages: MetadataRoute.Sitemap = orgSlugs.map((slug) => ({
    url: `${baseUrl}/org/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.75,
  }));

  // Branch profile pages
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

  // Integration pages
  const integrationSlugs = getAllIntegrationSlugs();
  const integrationIndexPage: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/integrations`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    },
  ];
  const integrationDetailPages: MetadataRoute.Sitemap = integrationSlugs.map((slug) => ({
    url: `${baseUrl}/integrations/${slug}`,
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

  // Documentation pages
  const docsLandingPage: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/docs`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const docsArticlePages: MetadataRoute.Sitemap = docSections.flatMap((section) =>
    section.articles.map((article) => ({
      url: `${baseUrl}/docs/${section.slug}/${article.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }))
  );

  // Developer portal pages
  const developerPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/developers`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/developers/api`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];

  return [
    ...staticPages,
    ...industryPages,
    ...blogPages,
    ...industryLandingPages,
    ...solutionPages,
    ...featurePages,
    ...comparisonPages,
    ...integrationIndexPage,
    ...integrationDetailPages,
    ...customerIndexPage,
    ...customerDetailPages,
    ...professionalPages,
    ...orgPages,
    ...branchPages,
    ...docsLandingPage,
    ...docsArticlePages,
    ...developerPages,
  ];
}
