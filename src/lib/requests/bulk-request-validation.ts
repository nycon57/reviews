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
  REQUEST_SMS_CSV_FIELDS,
  REQUEST_EMAIL_REQUIRED_FIELDS,
  REQUEST_SMS_REQUIRED_FIELDS,
} from "./bulk-request-types";
import { toE164 } from "@/lib/sms/phone-utils";

// Zod schemas per send method
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

const smsRowSchema = z.object({
  name: z
    .string()
    .min(1, "Customer name is required")
    .max(200, "Name must be 200 characters or less")
    .transform((v) => v.trim()),
  phone: z
    .string()
    .min(1, "Phone number is required")
    .refine((val) => toE164(val) !== null, "Invalid US phone number"),
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
  phone: "phone",
  phonenumber: "phone",
  phone_number: "phone",
  customerphone: "phone",
  customer_phone: "phone",
  borrowerphone: "phone",
  borrower_phone: "phone",
  mobile: "phone",
  cell: "phone",
  cellphone: "phone",
  cell_phone: "phone",
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
    sendMethod === "email"
      ? REQUEST_EMAIL_CSV_FIELDS.map((f) => f.key)
      : REQUEST_SMS_CSV_FIELDS.map((f) => f.key)
  );

  // Also include "name" for both
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
  sendMethod: SendMethod
): RequestCSVFieldKey[] {
  const required =
    sendMethod === "email"
      ? REQUEST_EMAIL_REQUIRED_FIELDS
      : REQUEST_SMS_REQUIRED_FIELDS;
  const mappedKeys = new Set(mappings.map((m) => m.fieldKey).filter(Boolean));
  return required.filter((f) => !mappedKeys.has(f));
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
  sendMethod: SendMethod
): RequestRowValidationResult[] {
  const schema = sendMethod === "email" ? emailRowSchema : smsRowSchema;
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
    const dedupeKey =
      sendMethod === "email"
        ? data.email?.trim().toLowerCase()
        : data.phone?.trim();
    if (dedupeKey) {
      if (seenKeys.has(dedupeKey)) {
        warnings.push(
          `Duplicate ${sendMethod === "email" ? "email" : "phone"} within import`
        );
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
export function generateRequestCSVTemplate(sendMethod: SendMethod): string {
  if (sendMethod === "email") {
    const headers = REQUEST_EMAIL_CSV_FIELDS.map((f) => f.label);
    const example = ["John Smith", "john@example.com"];
    return [headers.join(","), example.join(",")].join("\n");
  }
  const headers = REQUEST_SMS_CSV_FIELDS.map((f) => f.label);
  const example = ["John Smith", "(555) 123-4567"];
  return [headers.join(","), example.join(",")].join("\n");
}
