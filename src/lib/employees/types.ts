import { z } from "zod";

// ==================== Zod Schemas ====================

export const employeeSchema = z.object({
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

export const createEmployeeSchema = z.object({
  email: z.string().email("Valid email is required"),
  fullName: z.string().min(1, "Full name is required").max(200),
  department: z.string().max(200).optional(),
  branchId: z.string().uuid().optional(),
  title: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  isActive: z.boolean().optional(),
});

// ==================== Types ====================

export type Employee = z.infer<typeof employeeSchema>;
export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;

export interface EmployeeCSVRow {
  email: string;
  full_name: string;
  department?: string;
  title?: string;
  phone?: string;
  branch_name?: string;
}

// ==================== CSV Field Definitions ====================

export const EMPLOYEE_CSV_FIELDS = [
  { key: "email", label: "Email", required: true },
  { key: "full_name", label: "Full Name", required: true },
  { key: "department", label: "Department", required: false },
  { key: "title", label: "Job Title", required: false },
  { key: "phone", label: "Phone", required: false },
  { key: "branch_name", label: "Branch Name", required: false },
] as const;

export type EmployeeCSVFieldKey = (typeof EMPLOYEE_CSV_FIELDS)[number]["key"];

export const REQUIRED_EMPLOYEE_FIELDS: EmployeeCSVFieldKey[] = ["email", "full_name"];

export const MAX_EMPLOYEE_IMPORT_ROWS = 500;

// Field mapping for CSV import
export interface EmployeeFieldMapping {
  csvHeader: string;
  fieldKey: EmployeeCSVFieldKey | null;
}

// Per-row validation result
export interface EmployeeRowValidationResult {
  rowIndex: number;
  data: Partial<EmployeeCSVRow>;
  status: "valid" | "error" | "warning";
  errors: string[];
  warnings: string[];
}

// Import validation response
export interface EmployeeValidateResponse {
  rows: EmployeeRowValidationResult[];
  validCount: number;
  errorCount: number;
  warningCount: number;
}

// Per-employee import result
export interface EmployeeImportResult {
  email: string;
  fullName: string;
  success: boolean;
  error?: string;
}

// Overall import result
export interface EmployeeBulkImportResult {
  results: EmployeeImportResult[];
  successCount: number;
  failureCount: number;
}

// Auto-detect CSV header → field key mapping
const HEADER_ALIASES: Record<EmployeeCSVFieldKey, string[]> = {
  email: ["email", "e-mail", "email_address", "emailaddress", "mail"],
  full_name: ["full_name", "fullname", "name", "full name", "employee name", "employee_name"],
  department: ["department", "dept", "department_name", "team"],
  title: ["title", "job_title", "jobtitle", "job title", "position", "role"],
  phone: ["phone", "phone_number", "phonenumber", "telephone", "tel", "mobile"],
  branch_name: ["branch_name", "branch", "branchname", "office", "location"],
};

export function autoDetectEmployeeMappings(headers: string[]): EmployeeFieldMapping[] {
  return headers.map((header) => {
    const normalised = header.toLowerCase().trim().replace(/[^a-z0-9_]/g, "_");
    let matched: EmployeeCSVFieldKey | null = null;

    for (const [fieldKey, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.some((a) => a.replace(/[^a-z0-9_]/g, "_") === normalised)) {
        matched = fieldKey as EmployeeCSVFieldKey;
        break;
      }
    }

    return { csvHeader: header, fieldKey: matched };
  });
}
