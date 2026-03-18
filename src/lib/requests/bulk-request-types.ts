// CSV field definitions for bulk review request import
// Email-based requests need Name + Email; SMS-based need Name + Phone

export const REQUEST_EMAIL_CSV_FIELDS = [
  { key: "name", label: "Customer Name", required: true },
  { key: "email", label: "Customer Email", required: true },
] as const;

export type RequestEmailFieldKey =
  (typeof REQUEST_EMAIL_CSV_FIELDS)[number]["key"];
export type RequestCSVFieldKey = RequestEmailFieldKey;

export const REQUEST_EMAIL_REQUIRED_FIELDS: RequestEmailFieldKey[] = [
  "name",
  "email",
];

export const MAX_REQUEST_IMPORT_ROWS = 100;

// Raw CSV row before field mapping
export interface ParsedCSVRow {
  [header: string]: string;
}

// Mapped request data ready for validation
export interface ParsedRequestRow {
  name: string;
  email?: string;
  phone?: string;
}

// Field mapping: CSV header -> our field key
export interface RequestFieldMapping {
  csvHeader: string;
  fieldKey: RequestCSVFieldKey | null;
}

// Per-row validation result
export type ValidationStatus = "valid" | "error" | "warning";

export interface RequestRowValidationResult {
  rowIndex: number;
  data: Partial<ParsedRequestRow>;
  status: ValidationStatus;
  errors: string[];
  warnings: string[];
}

// Request type + send method combo
export type RequestType = "text" | "video";
export type SendMethod = "email";

// Bulk send result
export interface BulkSendResult {
  totalSent: number;
  totalFailed: number;
  errors: Array<{ rowIndex: number; error: string }>;
}

// Shared survey template summary (subset of full SurveyTemplate)
export interface SurveyTemplateSummary {
  id: string;
  name: string;
  description: string | null;
}

