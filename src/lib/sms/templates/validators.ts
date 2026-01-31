import { calculateSegments } from "../segment-calculator";
import { validateMergeFields } from "./merge-engine";

// ── Constants ─────────────────────────────────────────────────────────

/** Maximum template body length: 480 characters (3 SMS segments) */
export const MAX_TEMPLATE_BODY_LENGTH = 480;

/** RESPA-prohibited language patterns for mortgage industry */
export const RESPA_PROHIBITED_PATTERNS: readonly RegExp[] = [
  /\bgift\s*card\b/i,
  /\breward\b/i,
  /\bincentive\b/i,
  /\bdiscount\b/i,
  /\bcompensation\b/i,
  /\bcash\s*back\b/i,
  /\bfree\s+gift\b/i,
  /\bbonus\b/i,
  /\bprize\b/i,
  /\bkickback\b/i,
  /\breferral\s*fee\b/i,
];

/** Opt-out language pattern */
const OPT_OUT_PATTERN = /reply\s+stop/i;

// ── Types ─────────────────────────────────────────────────────────────

export interface ValidationIssue {
  field: string;
  code: string;
  message: string;
  severity: "error" | "warning";
}

export interface TemplateValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  characterCount: number;
  segmentCount: number;
  encoding: "GSM-7" | "UCS-2";
}

// ── Validation functions ──────────────────────────────────────────────

/**
 * Check template body for RESPA-prohibited language patterns.
 */
export function checkRespaCompliance(body: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  for (const pattern of RESPA_PROHIBITED_PATTERNS) {
    const match = pattern.exec(body);
    if (match) {
      issues.push({
        field: "body",
        code: "RESPA_PROHIBITED",
        message: `Contains prohibited RESPA language: "${match[0]}"`,
        severity: "error",
      });
    }
  }

  return issues;
}

/**
 * Check whether the template body contains opt-out language.
 * If not, returns a warning (opt-out will be auto-appended at send time).
 */
export function checkOptOutLanguage(body: string): ValidationIssue[] {
  if (!OPT_OUT_PATTERN.test(body)) {
    return [
      {
        field: "body",
        code: "MISSING_OPT_OUT",
        message:
          '"Reply STOP to opt out" will be auto-appended at send time.',
        severity: "warning",
      },
    ];
  }
  return [];
}

/**
 * Validate template body length against the 480-character (3 segment) limit.
 */
export function checkBodyLength(body: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (body.length === 0) {
    issues.push({
      field: "body",
      code: "BODY_EMPTY",
      message: "Template body is required.",
      severity: "error",
    });
    return issues;
  }

  if (body.length > MAX_TEMPLATE_BODY_LENGTH) {
    issues.push({
      field: "body",
      code: "BODY_TOO_LONG",
      message: `Template body exceeds ${MAX_TEMPLATE_BODY_LENGTH} characters (${body.length} characters). Max 3 SMS segments.`,
      severity: "error",
    });
  }

  return issues;
}

/**
 * Validate merge field syntax and supported fields.
 */
export function checkMergeFields(body: string): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const validation = validateMergeFields(body);

  for (const pattern of validation.malformedPatterns) {
    issues.push({
      field: "body",
      code: "MALFORMED_MERGE_FIELD",
      message: `Malformed merge field syntax: "${pattern}"`,
      severity: "error",
    });
  }

  for (const field of validation.unsupportedFields) {
    issues.push({
      field: "body",
      code: "UNSUPPORTED_MERGE_FIELD",
      message: `Unknown merge field: "{{${field}}}"`,
      severity: "warning",
    });
  }

  return issues;
}

/**
 * Run all template body validations and return a comprehensive result.
 */
export function validateTemplateBody(body: string): TemplateValidationResult {
  const segmentInfo = calculateSegments(body);

  const issues = [
    ...checkBodyLength(body),
    ...checkRespaCompliance(body),
    ...checkOptOutLanguage(body),
    ...checkMergeFields(body),
  ];

  const hasErrors = issues.some((i) => i.severity === "error");

  return {
    valid: !hasErrors,
    issues,
    characterCount: segmentInfo.characterCount,
    segmentCount: segmentInfo.segments,
    encoding: segmentInfo.encoding,
  };
}
