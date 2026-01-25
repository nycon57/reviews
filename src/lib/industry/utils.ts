// Industry system utility functions
import type { IndustryConfig, IndustryType } from "./types";
import { getIndustryConfig, industryConfigs } from "./configs";

/**
 * Get the professional label for an industry
 */
export function getProfessionalLabel(
  industry: IndustryType,
  plural = false
): string {
  const config = getIndustryConfig(industry);
  return plural
    ? config.labels.professionalPlural
    : config.labels.professional;
}

/**
 * Get the customer label for an industry
 */
export function getCustomerLabel(
  industry: IndustryType,
  plural = false
): string {
  const config = getIndustryConfig(industry);
  return plural ? config.labels.customerPlural : config.labels.customer;
}

/**
 * Get the transaction label for an industry
 */
export function getTransactionLabel(
  industry: IndustryType,
  plural = false
): string {
  const config = getIndustryConfig(industry);
  return plural
    ? config.labels.transactionPlural
    : config.labels.transaction;
}

/**
 * Check if an industry has a specific integration available
 */
export function hasIntegration(
  industry: IndustryType,
  integrationId: string
): boolean {
  const config = getIndustryConfig(industry);
  return config.integrations.some(
    (int) => int.id === integrationId && int.available
  );
}

/**
 * Get all available integrations for an industry
 */
export function getAvailableIntegrations(industry: IndustryType) {
  const config = getIndustryConfig(industry);
  return config.integrations.filter((int) => int.available);
}

/**
 * Get review sources for an industry
 */
export function getReviewSources(industry: IndustryType) {
  const config = getIndustryConfig(industry);
  return config.reviewSources;
}

/**
 * Get syncable review sources for an industry
 */
export function getSyncableReviewSources(industry: IndustryType) {
  const config = getIndustryConfig(industry);
  return config.reviewSources.filter((source) => source.canSync);
}

/**
 * Get required credentials for an industry
 */
export function getRequiredCredentials(industry: IndustryType) {
  const config = getIndustryConfig(industry);
  return config.credentials.filter((cred) => cred.required);
}

/**
 * Get all credentials for an industry
 */
export function getCredentials(industry: IndustryType) {
  const config = getIndustryConfig(industry);
  return config.credentials;
}

/**
 * Validate a credential value against its pattern
 */
export function validateCredential(
  industry: IndustryType,
  credentialId: string,
  value: string
): { valid: boolean; error?: string } {
  const config = getIndustryConfig(industry);
  const credential = config.credentials.find((c) => c.id === credentialId);

  if (!credential) {
    return { valid: false, error: "Unknown credential type" };
  }

  if (credential.required && !value.trim()) {
    return { valid: false, error: `${credential.label} is required` };
  }

  if (credential.pattern && value.trim()) {
    const regex = new RegExp(credential.pattern);
    if (!regex.test(value)) {
      return {
        valid: false,
        error: `Invalid ${credential.label} format`,
      };
    }
  }

  return { valid: true };
}

/**
 * Get industry benchmarks
 */
export function getIndustryBenchmarks(industry: IndustryType) {
  const config = getIndustryConfig(industry);
  return config.benchmarks;
}

/**
 * Get default survey questions for an industry
 */
export function getDefaultSurveyQuestions(industry: IndustryType): string[] {
  const config = getIndustryConfig(industry);
  return config.defaultSurveyQuestions;
}

/**
 * Get analysis themes for an industry (for AI sentiment analysis)
 */
export function getAnalysisThemes(industry: IndustryType): string[] {
  const config = getIndustryConfig(industry);
  return config.analysisThemes;
}

/**
 * Convert URL slug to industry type
 */
export function slugToIndustry(slug: string): IndustryType | null {
  const normalized = slug.toLowerCase().replace(/-/g, "_");
  if (normalized in industryConfigs) {
    return normalized as IndustryType;
  }
  return null;
}

/**
 * Convert industry type to URL slug
 */
export function industryToSlug(industry: IndustryType): string {
  return industry.replace(/_/g, "-");
}

/**
 * Get industry icon name
 */
export function getIndustryIcon(industry: IndustryType): string {
  const config = getIndustryConfig(industry);
  return config.icon;
}

/**
 * Get industry accent color
 */
export function getIndustryAccentColor(industry: IndustryType): string {
  const config = getIndustryConfig(industry);
  return config.accentColor;
}

/**
 * Get all industries with their display names
 */
export function getAllIndustries(): Array<{
  type: IndustryType;
  name: string;
  description: string;
  icon: string;
}> {
  return Object.values(industryConfigs).map((config) => ({
    type: config.type,
    name: config.name,
    description: config.description,
    icon: config.icon,
  }));
}

/**
 * Check if industry is supported
 */
export function isValidIndustry(value: string): value is IndustryType {
  return value in industryConfigs;
}

/**
 * Default fallback label when no industry context is available
 */
export const DEFAULT_PROFESSIONAL_LABEL = "Team Member";
export const DEFAULT_PROFESSIONAL_LABEL_PLURAL = "Team Members";

/**
 * Get the professional label with a fallback for when industry is unknown
 * Use this when org/industry context may not be available
 */
export function getProfessionalLabelWithFallback(
  industry?: IndustryType | null,
  plural = false
): string {
  if (!industry) {
    return plural ? DEFAULT_PROFESSIONAL_LABEL_PLURAL : DEFAULT_PROFESSIONAL_LABEL;
  }
  return getProfessionalLabel(industry, plural);
}

/**
 * Replace template variables in text with industry-specific values
 * Supports: {{professional}}, {{professionals}}, {{customer}}, {{customers}}, {{transaction}}, {{transactions}}
 */
export function replaceIndustryVariables(
  text: string,
  industry: IndustryType
): string {
  const config = getIndustryConfig(industry);
  return text
    .replace(/\{\{professional\}\}/gi, config.labels.professional)
    .replace(/\{\{professionals\}\}/gi, config.labels.professionalPlural)
    .replace(/\{\{customer\}\}/gi, config.labels.customer)
    .replace(/\{\{customers\}\}/gi, config.labels.customerPlural)
    .replace(/\{\{transaction\}\}/gi, config.labels.transaction)
    .replace(/\{\{transactions\}\}/gi, config.labels.transactionPlural)
    .replace(/\{\{industry\}\}/gi, config.name);
}

/**
 * Create industry-aware copy from a template
 */
export function createIndustryCopy(
  template: string,
  config: IndustryConfig
): string {
  return template
    .replace(/\{\{professional\}\}/gi, config.labels.professional)
    .replace(/\{\{professionals\}\}/gi, config.labels.professionalPlural)
    .replace(/\{\{customer\}\}/gi, config.labels.customer)
    .replace(/\{\{customers\}\}/gi, config.labels.customerPlural)
    .replace(/\{\{transaction\}\}/gi, config.labels.transaction)
    .replace(/\{\{transactions\}\}/gi, config.labels.transactionPlural)
    .replace(/\{\{industry\}\}/gi, config.name);
}
