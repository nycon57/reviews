import { z } from "zod";
import type {
  CSVFieldKey,
  FieldMapping,
  ParsedCSVRow,
  ParsedUserData,
  RowValidationResult,
} from "./bulk-import-types";
import { CSV_FIELDS, REQUIRED_FIELDS } from "./bulk-import-types";

// Zod schema for a single import row
export const importRowSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .transform((v) => v.toLowerCase().trim()),
  full_name: z
    .string()
    .min(1, "Full name is required")
    .max(100, "Full name must be 100 characters or less")
    .transform((v) => v.trim()),
  role: z.enum(["admin", "manager", "user"], {
    errorMap: () => ({ message: "Role must be admin, manager, or user" }),
  }),
  phone: z
    .string()
    .max(20, "Phone must be 20 characters or less")
    .optional()
    .or(z.literal("")),
  title: z.string().max(100).optional().or(z.literal("")),
  nmls_id: z.string().max(20).optional().or(z.literal("")),
  branch_name: z.string().max(200).optional().or(z.literal("")),
  manager_email: z
    .string()
    .email("Invalid manager email")
    .optional()
    .or(z.literal("")),
  hire_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD")
    .refine((val) => {
      const [y, m, d] = val.split("-").map(Number);
      const date = new Date(y, m - 1, d);
      return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
    }, "Invalid calendar date")
    .optional()
    .or(z.literal("")),
});

// Normalization map for auto-detecting CSV headers
// Maps normalized key → our field key
const HEADER_ALIASES: Record<string, CSVFieldKey> = {
  email: "email",
  emailaddress: "email",
  email_address: "email",
  fullname: "full_name",
  full_name: "full_name",
  name: "full_name",
  role: "role",
  userrole: "role",
  user_role: "role",
  phone: "phone",
  phonenumber: "phone",
  phone_number: "phone",
  mobile: "phone",
  title: "title",
  jobtitle: "title",
  job_title: "title",
  position: "title",
  nmlsid: "nmls_id",
  nmls_id: "nmls_id",
  nmls: "nmls_id",
  branchname: "branch_name",
  branch_name: "branch_name",
  branch: "branch_name",
  office: "branch_name",
  manageremail: "manager_email",
  manager_email: "manager_email",
  manager: "manager_email",
  hiredate: "hire_date",
  hire_date: "hire_date",
  startdate: "hire_date",
  start_date: "hire_date",
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
 * Auto-detect CSV header → field key mappings
 */
export function autoDetectMappings(csvHeaders: string[]): FieldMapping[] {
  const usedFields = new Set<CSVFieldKey>();

  return csvHeaders.map((header) => {
    const normalized = normalizeHeader(header);
    const matchedKey = HEADER_ALIASES[normalized];

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
export function getMissingRequiredFields(mappings: FieldMapping[]): CSVFieldKey[] {
  const mappedKeys = new Set(mappings.map((m) => m.fieldKey).filter(Boolean));
  return REQUIRED_FIELDS.filter((f) => !mappedKeys.has(f));
}

/**
 * Apply field mappings to raw CSV rows → ParsedUserData[]
 */
export function applyMappings(
  rows: ParsedCSVRow[],
  mappings: FieldMapping[]
): Partial<ParsedUserData>[] {
  return rows.map((row) => {
    const mapped: Record<string, string> = {};

    for (const { csvHeader, fieldKey } of mappings) {
      if (fieldKey && row[csvHeader] !== undefined) {
        mapped[fieldKey] = row[csvHeader].trim();
      }
    }

    return mapped as Partial<ParsedUserData>;
  });
}

/**
 * Client-side Zod validation of mapped rows
 */
export function validateRowsClient(rows: Partial<ParsedUserData>[]): RowValidationResult[] {
  const seenEmails = new Set<string>();

  return rows.map((data, rowIndex) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    const result = importRowSchema.safeParse(data);

    if (!result.success) {
      for (const issue of result.error.issues) {
        errors.push(`${issue.path.join(".")}: ${issue.message}`);
      }
    }

    // Check for duplicate emails within the import
    const email = data.email?.toLowerCase().trim();
    if (email) {
      if (seenEmails.has(email)) {
        errors.push("Duplicate email within import");
      }
      seenEmails.add(email);
    }

    // Warnings for optional fields
    if (data.branch_name && !errors.length) {
      warnings.push("Branch will be matched by name — ensure it exists");
    }
    if (data.manager_email && !errors.length) {
      warnings.push("Manager will be matched by email — ensure they exist");
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
export function getAvailableFieldOptions(
  currentMapping: CSVFieldKey | null,
  allMappings: FieldMapping[]
): { key: CSVFieldKey; label: string; required: boolean }[] {
  const usedKeys = new Set(
    allMappings.map((m) => m.fieldKey).filter((k): k is CSVFieldKey => k !== null)
  );

  return CSV_FIELDS.filter(
    (f) => f.key === currentMapping || !usedKeys.has(f.key)
  ).map((f) => ({ key: f.key, label: f.label, required: f.required }));
}

/**
 * Generate CSV template content
 */
export function generateCSVTemplate(): string {
  const headers = CSV_FIELDS.map((f) => f.key);
  const exampleRow = [
    "john@example.com",
    "John Smith",
    "user",
    "555-0100",
    "Loan Officer",
    "123456",
    "Downtown Branch",
    "manager@example.com",
    "2024-01-15",
  ];
  return [headers.join(","), exampleRow.join(",")].join("\n");
}
