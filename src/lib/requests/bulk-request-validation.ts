import { z } from "zod";
import type {
  RequestCSVFieldKey,
  RequestFieldMapping,
  ParsedCSVRow,
  ParsedRequestRow,
  RequestRowValidationResult,
  SendMethod,
} from "./bulk-request-types";
import {
  REQUEST_EMAIL_CSV_FIELDS,
  REQUEST_EMAIL_REQUIRED_FIELDS,
} from "./bulk-request-types";

// Zod schema for email rows
const emailRowSchema = z.object({
  name: z
    .string()
    .min(1, "Customer name is required")
    .max(200, "Name must be 200 characters or less")
    .transform((v) => v.trim()),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format"),
});

// Normalization map for auto-detecting CSV headers
const REQUEST_HEADER_ALIASES: Record<string, RequestCSVFieldKey> = {
  name: "name",
  customername: "name",
  customer_name: "name",
  customer: "name",
  fullname: "name",
  full_name: "name",
  borrowername: "name",
  borrower_name: "name",
  borrower: "name",
  firstname: "name",
  first_name: "name",
  email: "email",
  customeremail: "email",
  customer_email: "email",
  borroweremail: "email",
  borrower_email: "email",
  emailaddress: "email",
  email_address: "email",
};

/**
 * Normalize a header string for matching:
 * lowercase, strip non-alphanumeric (keep underscores), collapse whitespace
 */
function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9_]/g, "")
    .replace(/_+/g, "_");
}

/**
 * Auto-detect CSV header -> field key mappings
 */
export function autoDetectRequestMappings(
  csvHeaders: string[],
  sendMethod: SendMethod
): RequestFieldMapping[] {
  const usedFields = new Set<RequestCSVFieldKey>();
  const relevantKeys = new Set<RequestCSVFieldKey>(
    REQUEST_EMAIL_CSV_FIELDS.map((f) => f.key)
  );

  relevantKeys.add("name");

  return csvHeaders.map((header) => {
    const normalized = normalizeHeader(header);
    const matchedKey = REQUEST_HEADER_ALIASES[normalized];

    if (matchedKey && relevantKeys.has(matchedKey) && !usedFields.has(matchedKey)) {
      usedFields.add(matchedKey);
      return { csvHeader: header, fieldKey: matchedKey };
    }

    return { csvHeader: header, fieldKey: null };
  });
}

/**
 * Check that all required fields have been mapped
 */
export function getMissingRequiredFields(
  mappings: RequestFieldMapping[],
  _sendMethod: SendMethod
): RequestCSVFieldKey[] {
  const mappedKeys = new Set(mappings.map((m) => m.fieldKey).filter(Boolean));
  return REQUEST_EMAIL_REQUIRED_FIELDS.filter((f) => !mappedKeys.has(f));
}

/**
 * Apply field mappings to raw CSV rows -> ParsedRequestRow[]
 */
export function applyRequestMappings(
  rows: ParsedCSVRow[],
  mappings: RequestFieldMapping[]
): Partial<ParsedRequestRow>[] {
  return rows.map((row) => {
    const mapped: Record<string, string> = {};

    for (const { csvHeader, fieldKey } of mappings) {
      if (fieldKey && row[csvHeader] !== undefined) {
        mapped[fieldKey] = row[csvHeader].trim();
      }
    }

    return mapped as Partial<ParsedRequestRow>;
  });
}

/**
 * Client-side Zod validation of mapped rows
 */
export function validateRequestRowsClient(
  rows: Partial<ParsedRequestRow>[],
  _sendMethod: SendMethod
): RequestRowValidationResult[] {
  const schema = emailRowSchema;
  const seenKeys = new Set<string>();

  return rows.map((data, rowIndex) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const result = schema.safeParse(data);

    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push(`${issue.path.join(".")}: ${issue.message}`);
      }
    }

    // Check for duplicates within import
    const dedupeKey = data.email?.trim().toLowerCase();
    if (dedupeKey) {
      if (seenKeys.has(dedupeKey)) {
        warnings.push("Duplicate email within import");
      }
      seenKeys.add(dedupeKey);
    }

    return {
      rowIndex,
      data,
      status:
        errors.length > 0
          ? "error"
          : warnings.length > 0
            ? "warning"
            : "valid",
      errors,
      warnings,
    };
  });
}

/**
 * Generate CSV template content for the given send method
 */
export function generateRequestCSVTemplate(_sendMethod: SendMethod): string {
  const headers = REQUEST_EMAIL_CSV_FIELDS.map((f) => f.label);
  const example = ["John Smith", "john@example.com"];
  return [headers.join(","), example.join(",")].join("\n");
}
