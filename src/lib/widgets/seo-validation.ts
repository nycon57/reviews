/**
 * Client-side JSON-LD validation against schema.org rules.
 *
 * Validates structured data output from the structured-data-generator
 * without external API calls, enabling fast in-dashboard validation.
 */

import type { JsonLdOutput } from "./structured-data-generator";

// ── Types ────────────────────────────────────────────────────────────

export type ValidationSeverity = "error" | "warning" | "info";

export interface ValidationIssue {
  severity: ValidationSeverity;
  field: string;
  message: string;
  fix?: QuickFix;
}

export interface QuickFix {
  label: string;
  field: string;
  suggestedValue: unknown;
}

export interface ValidationResult {
  valid: boolean;
  errors: number;
  warnings: number;
  issues: ValidationIssue[];
}

export type WidgetValidationStatus = "valid" | "warnings" | "errors";

export interface WidgetValidationSummary {
  configId: string;
  widgetId: string;
  widgetName: string;
  widgetType: string;
  entityType: string;
  structuredDataEnabled: boolean;
  schemaType: string | null;
  status: WidgetValidationStatus;
  errorCount: number;
  warningCount: number;
  lastValidated: string;
}

// ── Constants ────────────────────────────────────────────────────────

const VALID_SCHEMA_TYPES = [
  "LocalBusiness",
  "Organization",
  "Person",
  "FinancialService",
  "MortgageBroker",
] as const;

const VALID_CONTEXTS = [
  "https://schema.org",
  "http://schema.org",
  "https://schema.org/",
  "http://schema.org/",
];

const ENTITY_TYPE_SCHEMA_MAP: Record<string, string[]> = {
  user: ["Person"],
  branch: ["LocalBusiness", "FinancialService", "MortgageBroker"],
  organization: [
    "Organization",
    "LocalBusiness",
    "FinancialService",
    "MortgageBroker",
  ],
};

// ── Validation Rules ─────────────────────────────────────────────────

function validateContext(
  jsonLd: JsonLdOutput,
  issues: ValidationIssue[]
): void {
  if (!jsonLd["@context"]) {
    issues.push({
      severity: "error",
      field: "@context",
      message: "Missing @context property. Required for valid JSON-LD.",
      fix: {
        label: "Add schema.org context",
        field: "@context",
        suggestedValue: "https://schema.org",
      },
    });
  } else if (!VALID_CONTEXTS.includes(jsonLd["@context"] as string)) {
    issues.push({
      severity: "error",
      field: "@context",
      message: `Invalid @context: "${jsonLd["@context"]}". Must be "https://schema.org".`,
      fix: {
        label: "Fix context URL",
        field: "@context",
        suggestedValue: "https://schema.org",
      },
    });
  }
}

function validateType(jsonLd: JsonLdOutput, issues: ValidationIssue[]): void {
  if (!jsonLd["@type"]) {
    issues.push({
      severity: "error",
      field: "@type",
      message: "Missing @type property. Required for schema.org validation.",
    });
  } else if (
    !VALID_SCHEMA_TYPES.includes(
      jsonLd["@type"] as (typeof VALID_SCHEMA_TYPES)[number]
    )
  ) {
    issues.push({
      severity: "warning",
      field: "@type",
      message: `Schema type "${jsonLd["@type"]}" is not in the recommended set: ${VALID_SCHEMA_TYPES.join(", ")}.`,
    });
  }
}

function validateName(jsonLd: JsonLdOutput, issues: ValidationIssue[]): void {
  if (!jsonLd.name) {
    issues.push({
      severity: "error",
      field: "name",
      message: "Missing required 'name' property.",
    });
  } else if (typeof jsonLd.name !== "string" || jsonLd.name.trim() === "") {
    issues.push({
      severity: "error",
      field: "name",
      message: "'name' must be a non-empty string.",
    });
  }
}

function validateAggregateRating(
  jsonLd: JsonLdOutput,
  issues: ValidationIssue[]
): void {
  const agg = jsonLd.aggregateRating;
  if (!agg) {
    issues.push({
      severity: "info",
      field: "aggregateRating",
      message:
        "No aggregateRating present. Add reviews to enable star-rated rich snippets.",
    });
    return;
  }

  if (agg["@type"] !== "AggregateRating") {
    issues.push({
      severity: "error",
      field: "aggregateRating.@type",
      message: 'aggregateRating @type must be "AggregateRating".',
    });
  }

  const rating = parseFloat(agg.ratingValue);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    issues.push({
      severity: "error",
      field: "aggregateRating.ratingValue",
      message: `ratingValue "${agg.ratingValue}" must be between 1 and 5.`,
    });
  }

  if (
    typeof agg.reviewCount !== "number" ||
    agg.reviewCount < 1 ||
    !Number.isInteger(agg.reviewCount)
  ) {
    issues.push({
      severity: "error",
      field: "aggregateRating.reviewCount",
      message: "reviewCount must be a positive integer.",
    });
  }

  if (agg.bestRating !== "5") {
    issues.push({
      severity: "warning",
      field: "aggregateRating.bestRating",
      message: `bestRating is "${agg.bestRating}". Google expects "5".`,
      fix: {
        label: "Set bestRating to 5",
        field: "aggregateRating.bestRating",
        suggestedValue: "5",
      },
    });
  }

  if (agg.worstRating !== "1") {
    issues.push({
      severity: "warning",
      field: "aggregateRating.worstRating",
      message: `worstRating is "${agg.worstRating}". Google expects "1".`,
      fix: {
        label: "Set worstRating to 1",
        field: "aggregateRating.worstRating",
        suggestedValue: "1",
      },
    });
  }
}

function validateReviews(
  jsonLd: JsonLdOutput,
  issues: ValidationIssue[]
): void {
  const reviews = jsonLd.review;
  if (!reviews || !Array.isArray(reviews)) return;

  if (reviews.length > 10) {
    issues.push({
      severity: "warning",
      field: "review",
      message: `${reviews.length} review snippets included. Google recommends at most 10.`,
    });
  }

  for (let i = 0; i < Math.min(reviews.length, 10); i++) {
    const r = reviews[i];
    if (!r.author?.name || r.author.name === "Anonymous") {
      issues.push({
        severity: "warning",
        field: `review[${i}].author.name`,
        message: `Review ${i + 1} has no author name. Named authors improve trust signals.`,
      });
    }

    if (!r.reviewBody || r.reviewBody.trim() === "") {
      issues.push({
        severity: "warning",
        field: `review[${i}].reviewBody`,
        message: `Review ${i + 1} has empty reviewBody.`,
      });
    }

    if (r.reviewRating) {
      const val = r.reviewRating.ratingValue;
      if (typeof val !== "number" || val < 1 || val > 5) {
        issues.push({
          severity: "error",
          field: `review[${i}].reviewRating.ratingValue`,
          message: `Review ${i + 1} ratingValue "${val}" must be between 1 and 5.`,
        });
      }
    }
  }
}

function validateTypeSpecificFields(
  jsonLd: JsonLdOutput,
  issues: ValidationIssue[]
): void {
  const type = jsonLd["@type"];

  if (type === "LocalBusiness" || type === "FinancialService") {
    if (!jsonLd.address) {
      issues.push({
        severity: "warning",
        field: "address",
        message: `${type} should include an address for better local search results.`,
      });
    }
  }

  if (type === "Organization" || type === "FinancialService") {
    if (!jsonLd.url) {
      issues.push({
        severity: "info",
        field: "url",
        message: "Adding a URL helps Google verify your organization.",
      });
    }
    if (!jsonLd.logo) {
      issues.push({
        severity: "info",
        field: "logo",
        message: "Adding a logo improves brand visibility in search results.",
      });
    }
  }

  if (type === "Person") {
    if (!jsonLd.jobTitle) {
      issues.push({
        severity: "info",
        field: "jobTitle",
        message:
          "Adding a jobTitle improves person schema for professional results.",
      });
    }
  }
}

// ── Main Validator ───────────────────────────────────────────────────

/**
 * Validate a JSON-LD structured data object against schema.org rules.
 */
export function validateStructuredData(jsonLd: JsonLdOutput): ValidationResult {
  const issues: ValidationIssue[] = [];

  validateContext(jsonLd, issues);
  validateType(jsonLd, issues);
  validateName(jsonLd, issues);
  validateAggregateRating(jsonLd, issues);
  validateReviews(jsonLd, issues);
  validateTypeSpecificFields(jsonLd, issues);

  let errors = 0;
  let warnings = 0;
  for (const issue of issues) {
    if (issue.severity === "error") errors++;
    else if (issue.severity === "warning") warnings++;
  }

  return {
    valid: errors === 0,
    errors,
    warnings,
    issues,
  };
}

/**
 * Derive the validation status from a validation result.
 */
export function getValidationStatus(
  result: ValidationResult
): WidgetValidationStatus {
  if (result.errors > 0) return "errors";
  if (result.warnings > 0) return "warnings";
  return "valid";
}

/**
 * Get recommended schema types for an entity type.
 */
export function getRecommendedSchemaTypes(entityType: string): string[] {
  return ENTITY_TYPE_SCHEMA_MAP[entityType] ?? ["Organization"];
}

/**
 * Get schema type recommendation based on entity type and industry.
 */
export function recommendSchemaType(
  entityType: string,
  industry?: string
): { type: string; reason: string } {
  const isMortgage =
    industry &&
    /mortgage|loan|lending|finance/i.test(industry);

  if (entityType === "user") {
    return {
      type: "Person",
      reason: "Individual loan officers and professionals use Person schema.",
    };
  }

  if (entityType === "branch") {
    if (isMortgage) {
      return {
        type: "FinancialService",
        reason:
          "Branch locations in financial services benefit from FinancialService schema with address data.",
      };
    }
    return {
      type: "LocalBusiness",
      reason:
        "Physical branch locations should use LocalBusiness for local search visibility.",
    };
  }

  if (isMortgage) {
    return {
      type: "FinancialService",
      reason:
        "Financial services organizations get better rich snippet support with FinancialService schema.",
    };
  }

  return {
    type: "Organization",
    reason:
      "Organizations benefit from Organization schema for brand presence in search.",
  };
}
