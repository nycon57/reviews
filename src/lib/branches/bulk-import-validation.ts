import { z } from "zod";
import type {
  BranchCSVFieldKey,
  BranchFieldMapping,
  ParsedCSVRow,
  ParsedBranchData,
  BranchRowValidationResult,
} from "./bulk-import-types";
import { BRANCH_CSV_FIELDS, BRANCH_REQUIRED_FIELDS } from "./bulk-import-types";

// Zod schema for a single branch import row
export const branchImportRowSchema = z.object({
  name: z
    .string()
    .min(1, "Branch name is required")
    .max(200, "Branch name must be 200 characters or less")
    .transform((v) => v.trim()),
  phone: z
    .string()
    .max(30, "Phone must be 30 characters or less")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .email("Invalid email format")
    .optional()
    .or(z.literal("")),
  description: z
    .string()
    .max(2000, "Description must be 2000 characters or less")
    .optional()
    .or(z.literal("")),
  street: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(50).optional().or(z.literal("")),
  postal_code: z.string().max(20).optional().or(z.literal("")),
  manager_email: z
    .string()
    .email("Invalid manager email")
    .optional()
    .or(z.literal("")),
});

// Normalization map for auto-detecting CSV headers
const BRANCH_HEADER_ALIASES: Record<string, BranchCSVFieldKey> = {
  name: "name",
  branchname: "name",
  branch_name: "name",
  branch: "name",
  location: "name",
  office: "name",
  phone: "phone",
  phonenumber: "phone",
  phone_number: "phone",
  email: "email",
  branchemail: "email",
  branch_email: "email",
  description: "description",
  desc: "description",
  notes: "description",
  street: "street",
  address: "street",
  street_address: "street",
  streetaddress: "street",
  city: "city",
  state: "state",
  province: "state",
  zip: "postal_code",
  zipcode: "postal_code",
  zip_code: "postal_code",
  postal: "postal_code",
  postal_code: "postal_code",
  postalcode: "postal_code",
  manageremail: "manager_email",
  manager_email: "manager_email",
  manager: "manager_email",
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
export function autoDetectBranchMappings(csvHeaders: string[]): BranchFieldMapping[] {
  const usedFields = new Set<BranchCSVFieldKey>();

  return csvHeaders.map((header) => {
    const normalized = normalizeHeader(header);
    const matchedKey = BRANCH_HEADER_ALIASES[normalized];

    if (matchedKey && !usedFields.has(matchedKey)) {
      usedFields.add(matchedKey);
      return { csvHeader: header, fieldKey: matchedKey };
    }

    return { csvHeader: header, fieldKey: null };
  });
}

/**
 * Check that all required fields have been mapped
 */
export function getMissingRequiredBranchFields(mappings: BranchFieldMapping[]): BranchCSVFieldKey[] {
  const mappedKeys = new Set(mappings.map((m) => m.fieldKey).filter(Boolean));
  return BRANCH_REQUIRED_FIELDS.filter((f) => !mappedKeys.has(f));
}

/**
 * Apply field mappings to raw CSV rows -> ParsedBranchData[]
 */
export function applyBranchMappings(
  rows: ParsedCSVRow[],
  mappings: BranchFieldMapping[]
): Partial<ParsedBranchData>[] {
  return rows.map((row) => {
    const mapped: Record<string, string> = {};

    for (const { csvHeader, fieldKey } of mappings) {
      if (fieldKey && row[csvHeader] !== undefined) {
        mapped[fieldKey] = row[csvHeader].trim();
      }
    }

    return mapped as Partial<ParsedBranchData>;
  });
}

/**
 * Client-side Zod validation of mapped rows
 */
export function validateBranchRowsClient(rows: Partial<ParsedBranchData>[]): BranchRowValidationResult[] {
  const seenNames = new Set<string>();

  return rows.map((data, rowIndex) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const result = branchImportRowSchema.safeParse(data);

    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push(`${issue.path.join(".")}: ${issue.message}`);
      }
    }

    // Check for duplicate names within the import (warning, not error)
    const name = data.name?.trim().toLowerCase();
    if (name) {
      if (seenNames.has(name)) {
        warnings.push("Duplicate branch name within import");
      }
      seenNames.add(name);
    }

    // Manager email warning
    if (data.manager_email && !errors.length) {
      warnings.push("Manager will be matched by email");
    }

    return {
      rowIndex,
      data,
      status: errors.length > 0 ? "error" : warnings.length > 0 ? "warning" : "valid",
      errors,
      warnings,
    };
  });
}

/**
 * Get available field options for the mapping UI (excluding already-mapped ones)
 */
export function getAvailableBranchFieldOptions(
  currentMapping: BranchCSVFieldKey | null,
  allMappings: BranchFieldMapping[]
): { key: BranchCSVFieldKey; label: string; required: boolean }[] {
  const usedKeys = new Set(
    allMappings.map((m) => m.fieldKey).filter((k): k is BranchCSVFieldKey => k !== null)
  );

  return BRANCH_CSV_FIELDS.filter(
    (f) => f.key === currentMapping || !usedKeys.has(f.key)
  ).map((f) => ({ key: f.key, label: f.label, required: f.required }));
}

/**
 * Generate CSV template content
 */
export function generateBranchCSVTemplate(): string {
  const headers = BRANCH_CSV_FIELDS.map((f) => f.key);
  const exampleRow = [
    "Downtown Office",
    "555-0100",
    "downtown@example.com",
    "Main downtown location",
    "123 Main St",
    "Springfield",
    "IL",
    "62704",
    "manager@example.com",
  ];
  return [headers.join(","), exampleRow.join(",")].join("\n");
}
