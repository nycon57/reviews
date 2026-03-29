/**
 * Breadcrumb builder utilities for marketing template pages.
 *
 * Each helper returns both the visual breadcrumb items (for MarketingBreadcrumbs)
 * and the JSON-LD BreadcrumbList schema (for SEO).
 */

import type { FeaturePageConfig } from "@/lib/features/types";
import type { SolutionPageConfig } from "@/lib/solutions/types";
import type { IndustryPageConfig } from "@/lib/industry/types";
import type { CompetitorPageConfig } from "@/lib/competitor-pages/types";
import type { BlogPost } from "@/types/blog";
import type { BreadcrumbListSchema } from "./types";
import { generateBreadcrumbSchema } from "./schema-generators";

// ---------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------

export interface MarketingBreadcrumbItem {
  /** Display label */
  label: string;
  /** Link target. Omit for non-linked segments (no index page). */
  href?: string;
}

interface MarketingBreadcrumbResult {
  items: MarketingBreadcrumbItem[];
  schema: BreadcrumbListSchema;
}

// ---------------------------------------------------------------
// Industry label lookup (mirrors schema-generators.ts)
// ---------------------------------------------------------------

const industryLabels: Record<string, string> = {
  mortgage: "Mortgage",
  "real-estate": "Real Estate",
  insurance: "Insurance",
  "financial-advisory": "Financial Advisory",
  healthcare: "Healthcare",
  "home-services": "Home Services",
  legal: "Legal",
  consulting: "Consulting",
};

function getIndustryDisplayName(slug: string): string {
  return (
    industryLabels[slug] ||
    slug
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ")
  );
}

// ---------------------------------------------------------------
// Builders
// ---------------------------------------------------------------

/** /features/[feature] — Home > Features > [Feature Title] */
export function buildFeatureBreadcrumbs(
  config: FeaturePageConfig,
  baseUrl: string,
): MarketingBreadcrumbResult {
  const items: MarketingBreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Features", href: "/features" },
    { label: config.title },
  ];

  const schema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "Features", url: `${baseUrl}/features` },
    { name: config.title, url: `${baseUrl}/features/${config.slug}` },
  ]);

  return { items, schema };
}

/** /solutions/[solution] — Home > Solutions > [Solution Title] */
export function buildSolutionBreadcrumbs(
  config: SolutionPageConfig,
  baseUrl: string,
): MarketingBreadcrumbResult {
  const items: MarketingBreadcrumbItem[] = [
    { label: "Home", href: "/" },
    // No /solutions index page — render as non-linked text
    { label: "Solutions" },
    { label: config.title },
  ];

  const schema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "Solutions" },
    { name: config.title, url: `${baseUrl}/solutions/${config.slug}` },
  ]);

  return { items, schema };
}

/** /for/[industry] — Home > Industries > [Industry Name] */
export function buildIndustryBreadcrumbs(
  config: IndustryPageConfig,
  baseUrl: string,
): MarketingBreadcrumbResult {
  const displayName = getIndustryDisplayName(config.slug);

  const items: MarketingBreadcrumbItem[] = [
    { label: "Home", href: "/" },
    // No /for index page — render as non-linked text
    { label: "Industries" },
    { label: displayName },
  ];

  const schema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "Industries" },
    { name: displayName, url: `${baseUrl}/for/${config.slug}` },
  ]);

  return { items, schema };
}

/** /compare/[slug] — Home > Compare > vs [Competitor] */
export function buildCompareBreadcrumbs(
  config: CompetitorPageConfig,
  baseUrl: string,
): MarketingBreadcrumbResult {
  const currentLabel = `vs ${config.competitorName}`;

  const items: MarketingBreadcrumbItem[] = [
    { label: "Home", href: "/" },
    // No /compare index page — render as non-linked text
    { label: "Compare" },
    { label: currentLabel },
  ];

  const schema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "Compare" },
    { name: currentLabel, url: `${baseUrl}/compare/${config.slug}` },
  ]);

  return { items, schema };
}

/** /blog/[slug] — Home > Blog > [Post Title] */
export function buildBlogBreadcrumbs(
  post: BlogPost,
  baseUrl: string,
): MarketingBreadcrumbResult {
  const items: MarketingBreadcrumbItem[] = [
    { label: "Home", href: "/" },
    { label: "Blog", href: "/blog" },
    { label: post.title },
  ];

  const schema = generateBreadcrumbSchema([
    { name: "Home", url: baseUrl },
    { name: "Blog", url: `${baseUrl}/blog` },
    { name: post.title, url: `${baseUrl}/blog/${post.slug}` },
  ]);

  return { items, schema };
}
