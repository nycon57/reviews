import type { IndustryType } from "@/lib/industry/types";

export interface DirectoryBreadcrumbItem {
  label: string;
  href: string;
  type: "directory" | "industry" | "company" | "professional";
}

// Industry display labels
const industryLabels: Record<IndustryType, string> = {
  mortgage: "Mortgage",
  real_estate: "Real Estate",
  insurance: "Insurance",
  financial_advisory: "Financial Advisory",
  healthcare: "Healthcare",
  home_services: "Home Services",
  legal: "Legal",
  consulting: "Consulting",
};

export function getIndustryLabel(industry: IndustryType): string {
  return industryLabels[industry] || industry;
}

export function getIndustrySlug(industry: IndustryType): string {
  return industry.replace(/_/g, "-");
}

export function parseIndustrySlug(slug: string): IndustryType | null {
  const industry = slug.replace(/-/g, "_") as IndustryType;
  return industryLabels[industry] ? industry : null;
}

/**
 * Helper to build breadcrumb items for a professional profile
 */
export function buildProfessionalBreadcrumbs(
  professional: { id: string; full_name: string; slug?: string | null },
  organization?: {
    slug: string;
    name: string;
    industry: IndustryType | null;
  } | null
): DirectoryBreadcrumbItem[] {
  const items: DirectoryBreadcrumbItem[] = [];

  // Add industry if available
  if (organization?.industry) {
    items.push({
      label: getIndustryLabel(organization.industry),
      href: `/directory/${getIndustrySlug(organization.industry)}`,
      type: "industry",
    });
  }

  // Add company if available
  if (organization) {
    items.push({
      label: organization.name,
      href: `/org/${organization.slug}`,
      type: "company",
    });
  }

  // Add professional (current page) - prefer slug for SEO-friendly URL
  items.push({
    label: professional.full_name,
    href: professional.slug ? `/pro/${professional.slug}` : `/pro/${professional.id}`,
    type: "professional",
  });

  return items;
}

/**
 * Helper to build breadcrumb items for a company profile
 */
export function buildCompanyBreadcrumbs(organization: {
  slug: string;
  name: string;
  industry: IndustryType | null;
}): DirectoryBreadcrumbItem[] {
  const items: DirectoryBreadcrumbItem[] = [];

  // Add industry if available
  if (organization.industry) {
    items.push({
      label: getIndustryLabel(organization.industry),
      href: `/directory/${getIndustrySlug(organization.industry)}`,
      type: "industry",
    });
  }

  // Add company (current page)
  items.push({
    label: organization.name,
    href: `/org/${organization.slug}`,
    type: "company",
  });

  return items;
}

/**
 * Helper to build breadcrumb items for a branch profile
 */
export function buildBranchBreadcrumbs(
  branch: { name: string; global_slug: string | null; id: string },
  organization?: {
    slug: string;
    name: string;
  } | null
): DirectoryBreadcrumbItem[] {
  const items: DirectoryBreadcrumbItem[] = [];

  // Add company if available
  if (organization) {
    items.push({
      label: organization.name,
      href: `/org/${organization.slug}`,
      type: "company",
    });
  }

  // Add branch (current page)
  items.push({
    label: branch.name,
    href: `/branch/${branch.global_slug || branch.id}`,
    type: "company",
  });

  return items;
}

/**
 * Helper to build breadcrumb items for an industry directory page
 */
export function buildIndustryBreadcrumbs(
  industry: IndustryType
): DirectoryBreadcrumbItem[] {
  return [
    {
      label: getIndustryLabel(industry),
      href: `/directory/${getIndustrySlug(industry)}`,
      type: "industry",
    },
  ];
}
