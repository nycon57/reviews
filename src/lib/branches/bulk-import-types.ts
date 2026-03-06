// CSV field definitions for bulk branch import
export const BRANCH_CSV_FIELDS = [
  { key: "name", label: "Branch Name", required: true },
  { key: "phone", label: "Phone", required: false },
  { key: "email", label: "Email", required: false },
  { key: "description", label: "Description", required: false },
  { key: "street", label: "Street Address", required: false },
  { key: "city", label: "City", required: false },
  { key: "state", label: "State", required: false },
  { key: "postal_code", label: "Postal Code", required: false },
  { key: "manager_email", label: "Manager Email", required: false },
] as const;

export type BranchCSVFieldKey = (typeof BRANCH_CSV_FIELDS)[number]["key"];

export const BRANCH_REQUIRED_FIELDS: BranchCSVFieldKey[] = ["name"];

export const MAX_BRANCH_IMPORT_ROWS = 100;

// Raw CSV row before field mapping
export interface ParsedCSVRow {
  [header: string]: string;
}

// Mapped branch data ready for validation
export interface ParsedBranchData {
  name: string;
  phone?: string;
  email?: string;
  description?: string;
  street?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  manager_email?: string;
}

// Field mapping: CSV header -> our field key
export interface BranchFieldMapping {
  csvHeader: string;
  fieldKey: BranchCSVFieldKey | null;
}

// Per-row validation result
export type ValidationStatus = "valid" | "error" | "warning";

export interface BranchRowValidationResult {
  rowIndex: number;
  data: Partial<ParsedBranchData>;
  status: ValidationStatus;
  errors: string[];
  warnings: string[];
}

// Server-side validation response
export interface ValidateBranchImportResponse {
  rows: BranchRowValidationResult[];
  validCount: number;
  errorCount: number;
  warningCount: number;
}

// Per-branch import result
export interface BranchImportResult {
  name: string;
  success: boolean;
  error?: string;
}

// Overall import result
export interface BulkBranchImportResult {
  results: BranchImportResult[];
  successCount: number;
  failureCount: number;
}

// Wizard step type
export type BranchWizardStep = "upload" | "mapping" | "validation" | "complete";
