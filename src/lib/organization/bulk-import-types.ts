// CSV field definitions for bulk user import
export const CSV_FIELDS = [
  { key: "email", label: "Email", required: true },
  { key: "full_name", label: "Full Name", required: true },
  { key: "role", label: "Role", required: true },
  { key: "phone", label: "Phone", required: false },
  { key: "title", label: "Job Title", required: false },
  { key: "nmls_id", label: "NMLS ID", required: false },
  { key: "branch_name", label: "Branch Name", required: false },
  { key: "manager_email", label: "Manager Email", required: false },
  { key: "hire_date", label: "Hire Date", required: false },
] as const;

export type CSVFieldKey = (typeof CSV_FIELDS)[number]["key"];

export const REQUIRED_FIELDS: CSVFieldKey[] = ["email", "full_name", "role"];

export const MAX_IMPORT_ROWS = 100;

// Raw CSV row before field mapping
export interface ParsedCSVRow {
  [header: string]: string;
}

// Mapped user data ready for validation
export interface ParsedUserData {
  email: string;
  full_name: string;
  role: string;
  phone?: string;
  title?: string;
  nmls_id?: string;
  branch_name?: string;
  manager_email?: string;
  hire_date?: string;
}

// Field mapping: CSV header → our field key
export interface FieldMapping {
  csvHeader: string;
  fieldKey: CSVFieldKey | null;
}

// Per-row validation result
export type ValidationStatus = "valid" | "error" | "warning";

export interface RowValidationResult {
  rowIndex: number;
  data: Partial<ParsedUserData>;
  status: ValidationStatus;
  errors: string[];
  warnings: string[];
}

// Server-side validation response
export interface ValidateImportResponse {
  rows: RowValidationResult[];
  validCount: number;
  errorCount: number;
  warningCount: number;
  tierLimitExceeded: boolean;
  remainingSeats: number;
}

// Per-user import result
export interface UserImportResult {
  email: string;
  full_name: string;
  success: boolean;
  error?: string;
}

// Overall import result
export interface BulkImportResult {
  results: UserImportResult[];
  successCount: number;
  failureCount: number;
}

// Wizard step type
export type WizardStep = "upload" | "mapping" | "validation" | "complete";
