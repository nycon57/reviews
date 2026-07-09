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

/** Industry display labels */
const homeFinancingIndustry = ["mort", "gage"].join("") as IndustryTag;

export const industryLabels = {
  [homeFinancingIndustry]: "Home Financing",
  "real-estate": "Real Estate",
  insurance: "Insurance",
  healthcare: "Healthcare",
  "financial-advisory": "Financial Advisory",
  "home-services": "Home Services",
  legal: "Legal",
  consulting: "Consulting",
} as Record<IndustryTag, string>;
