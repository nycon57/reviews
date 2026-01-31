import { calculateSegments } from "../segment-calculator";
import type { SegmentInfo } from "../segment-calculator";

// ── Supported merge fields ────────────────────────────────────────────

export const SUPPORTED_MERGE_FIELDS = [
  "first_name",
  "last_name",
  "lo_name",
  "lo_first_name",
  "company_name",
  "review_link",
  "video_link",
  "branch_name",
  "closing_date",
] as const;

export type MergeFieldKey = (typeof SUPPORTED_MERGE_FIELDS)[number];

/** Context object passed to renderTemplate for merge field resolution. */
export type MergeContext = Partial<Record<MergeFieldKey, string>>;

// ── Sample data for template preview ──────────────────────────────────

export const SAMPLE_MERGE_DATA: Record<MergeFieldKey, string> = {
  first_name: "John",
  last_name: "Smith",
  lo_name: "Jane Doe",
  lo_first_name: "Jane",
  company_name: "Acme Mortgage",
  review_link: "https://repwell.co/r/abc123",
  video_link: "https://repwell.co/v/xyz789",
  branch_name: "Downtown Branch",
  closing_date: "01/15/2026",
};

// ── Merge field regex ─────────────────────────────────────────────────

/** Matches valid merge field syntax: {{field_name}} */
const MERGE_FIELD_REGEX = /\{\{([a-z_]+)\}\}/g;

/** Matches malformed merge field syntax (mismatched braces, spaces, etc.) */
const MALFORMED_FIELD_REGEX = /\{\{[^}]*\s[^}]*\}\}/g;

// ── Types ─────────────────────────────────────────────────────────────

export interface RenderResult {
  /** The final rendered message body */
  body: string;
  /** Segment calculation for the rendered body */
  segmentInfo: SegmentInfo;
  /** Merge fields that had no value in the context */
  unresolvedFields: string[];
  /** Whether the opt-out language was auto-appended */
  optOutAppended: boolean;
}

export interface MergeFieldValidation {
  /** Whether all merge field syntax is valid */
  valid: boolean;
  /** Fields found in the template */
  fields: string[];
  /** Fields that are not in the supported list */
  unsupportedFields: string[];
  /** Malformed merge field patterns found */
  malformedPatterns: string[];
}

// ── Core functions ────────────────────────────────────────────────────

const OPT_OUT_PATTERN = /reply\s+stop/i;
const OPT_OUT_SUFFIX = " Reply STOP to opt out.";

/**
 * Extract all merge field names from a template body.
 */
export function extractMergeFields(body: string): string[] {
  const fields: string[] = [];
  const regex = new RegExp(MERGE_FIELD_REGEX.source, "g");
  let match: RegExpExecArray | null;
  while ((match = regex.exec(body)) !== null) {
    if (!fields.includes(match[1])) {
      fields.push(match[1]);
    }
  }
  return fields;
}

/**
 * Validate merge field syntax in a template body.
 * Checks for unsupported fields and malformed patterns.
 */
export function validateMergeFields(body: string): MergeFieldValidation {
  const fields = extractMergeFields(body);
  const supported = new Set<string>(SUPPORTED_MERGE_FIELDS);
  const unsupportedFields = fields.filter((f) => !supported.has(f));

  const malformedPatterns: string[] = [];
  const malformedRegex = new RegExp(MALFORMED_FIELD_REGEX.source, "g");
  let malformed: RegExpExecArray | null;
  while ((malformed = malformedRegex.exec(body)) !== null) {
    malformedPatterns.push(malformed[0]);
  }

  return {
    valid: unsupportedFields.length === 0 && malformedPatterns.length === 0,
    fields,
    unsupportedFields,
    malformedPatterns,
  };
}

/**
 * Render a template body by replacing merge fields with context values.
 * Auto-appends opt-out language if not present.
 * Returns the rendered body with segment info and unresolved fields.
 */
export function renderTemplate(
  body: string,
  context: MergeContext
): RenderResult {
  let optOutAppended = false;
  const unresolvedFields: string[] = [];

  // Replace merge fields with context values
  let rendered = body.replace(
    new RegExp(MERGE_FIELD_REGEX.source, "g"),
    (fullMatch, fieldName: string) => {
      const value = context[fieldName as MergeFieldKey];
      if (value === undefined || value === "") {
        unresolvedFields.push(fieldName);
        return fullMatch;
      }
      return value;
    }
  );

  // Auto-append opt-out language if missing
  if (!OPT_OUT_PATTERN.test(rendered)) {
    rendered += OPT_OUT_SUFFIX;
    optOutAppended = true;
  }

  const segmentInfo = calculateSegments(rendered);

  return {
    body: rendered,
    segmentInfo,
    unresolvedFields,
    optOutAppended,
  };
}

/**
 * Render a template with sample data for preview purposes.
 */
export function renderTemplatePreview(body: string): RenderResult {
  return renderTemplate(body, SAMPLE_MERGE_DATA);
}
