import { z } from "zod";

// ==================== Zod Schemas ====================

export const contactSchema = z.object({
  id: z.string().uuid(),
  organizationId: z.string().uuid(),
  email: z.string().email(),
  fullName: z.string().min(1),
  department: z.string().nullable().optional(),
  branchId: z.string().uuid().nullable().optional(),
  title: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  isActive: z.boolean(),
  userId: z.string().uuid().nullable().optional(),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const createContactSchema = z.object({
  email: z.string().email("Valid email is required"),
  fullName: z.string().min(1, "Full name is required").max(200),
  department: z.string().max(200).optional(),
  branchId: z.string().uuid().optional(),
  title: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
});

export const updateContactSchema = createContactSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ==================== Types ====================

export type Contact = z.infer<typeof contactSchema>;
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;

export interface ContactCSVRow {
  email: string;
  full_name: string;
  department?: string;
  title?: string;
  phone?: string;
  branch_name?: string;
}

// ==================== CSV Field Definitions ====================

export const CONTACT_CSV_FIELDS = [
  { key: "email", label: "Email", required: true },
  { key: "full_name", label: "Full Name", required: true },
  { key: "department", label: "Department", required: false },
  { key: "title", label: "Job Title", required: false },
  { key: "phone", label: "Phone", required: false },
  { key: "branch_name", label: "Branch Name", required: false },
] as const;

export type ContactCSVFieldKey = (typeof CONTACT_CSV_FIELDS)[number]["key"];

export const REQUIRED_CONTACT_FIELDS: ContactCSVFieldKey[] = ["email", "full_name"];

export const MAX_CONTACT_IMPORT_ROWS = 500;

// Field mapping for CSV import
export interface ContactFieldMapping {
  csvHeader: string;
  fieldKey: ContactCSVFieldKey | null;
}

// Per-row validation result
export interface ContactRowValidationResult {
  rowIndex: number;
  data: Partial<ContactCSVRow>;
  status: "valid" | "error" | "warning";
  errors: string[];
  warnings: string[];
}

// Import validation response
export interface ContactValidateResponse {
  rows: ContactRowValidationResult[];
  validCount: number;
  errorCount: number;
  warningCount: number;
}

// Per-contact import result
export interface ContactImportResult {
  email: string;
  fullName: string;
  success: boolean;
  error?: string;
}

// Overall import result
export interface ContactBulkImportResult {
  results: ContactImportResult[];
  successCount: number;
  failureCount: number;
}

// Auto-detect CSV header → field key mapping
const HEADER_ALIASES: Record<ContactCSVFieldKey, string[]> = {
  email: ["email", "e-mail", "email_address", "emailaddress", "mail"],
  full_name: ["full_name", "fullname", "name", "full name", "employee name", "employee_name"],
  department: ["department", "dept", "department_name", "team"],
  title: ["title", "job_title", "jobtitle", "job title", "position", "role"],
  phone: ["phone", "phone_number", "phonenumber", "telephone", "tel", "mobile"],
  branch_name: ["branch_name", "branch", "branchname", "office", "location"],
};

export function autoDetectContactMappings(headers: string[]): ContactFieldMapping[] {
  return headers.map((header) => {
    const normalised = header.toLowerCase().trim().replace(/[^a-z0-9_]/g, "_");
    let matched: ContactCSVFieldKey | null = null;

    for (const [fieldKey, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.some((a) => a.replace(/[^a-z0-9_]/g, "_") === normalised)) {
        matched = fieldKey as ContactCSVFieldKey;
        break;
      }
    }

    return { csvHeader: header, fieldKey: matched };
  });
}
