import type { CustomerPageConfig, IndustryTag } from "@/lib/customers/types";

export const customerPageConfigs: Record<string, CustomerPageConfig> = {};

/** Get a single case study config by slug */
export function getCustomerPageConfig(
  slug: string,
): CustomerPageConfig | undefined {
  return customerPageConfigs[slug];
}

/** Get all customer slugs for static generation */
export function getAllCustomerSlugs(): string[] {
  return Object.keys(customerPageConfigs);
}

/** Get customers filtered by industry */
export function getCustomersByIndustry(
  industry: IndustryTag,
): CustomerPageConfig[] {
  return Object.values(customerPageConfigs).filter(
    (config) => config.industry === industry,
  );
}

/** Get all unique industries from published customer stories */
export function getAllIndustries(): IndustryTag[] {
  const industries = new Set(
    Object.values(customerPageConfigs).map((config) => config.industry),
  );
  return Array.from(industries);
}

/** Industry display labels for published customer stories */
export const industryLabels: Partial<Record<IndustryTag, string>> = {};
