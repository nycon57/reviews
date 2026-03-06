/**
 * Generic types for the shared CSV import wizard.
 * Feature-specific types live in their own lib/ directories.
 */

import type { ReactNode } from 'react';

export type WizardStep = "upload" | "mapping" | "validation" | "complete";

export interface ParsedCSVRow {
  [header: string]: string;
}

export interface FieldDefinition {
  key: string;
  label: string;
  required: boolean;
}

export interface FieldMapping {
  csvHeader: string;
  fieldKey: string | null;
  autoDetected?: boolean;
}

export interface RowValidationResult {
  row: number;
  status: "valid" | "warning" | "error";
  data: Record<string, unknown>;
  errors: string[];
  warnings: string[];
}

export interface ValidationResponse {
  rows: RowValidationResult[];
  validCount: number;
  warningCount: number;
  errorCount: number;
}

export interface ImportResultItem {
  success: boolean;
  label: string;
  error?: string;
  data?: Record<string, unknown>;
}

export interface ImportResult {
  successCount: number;
  failureCount: number;
  results: ImportResultItem[];
}

/**
 * Configuration object that each feature provides to customise the wizard.
 */
export interface CsvImportConfig {
  /** Dialog title (e.g. "Import Users from CSV") */
  title: string;
  /** Singular entity name (e.g. "User") */
  entityName: string;
  /** Plural entity name (e.g. "Users") */
  entityNamePlural: string;
  /** Max rows allowed per import */
  maxRows: number;
  /** Field definitions for mapping step */
  fieldDefinitions: FieldDefinition[];
  /** Template CSV filename for download (e.g. "user-import-template.csv") */
  templateFilename: string;
  /** Template CSV content for download */
  templateContent: string;

  // Functions — feature provides its own logic
  /** Auto-detect CSV header → field mappings */
  autoDetect: (headers: string[]) => FieldMapping[];
  /** Check which required fields are missing from current mappings */
  getMissingRequired: (mappings: FieldMapping[]) => string[];
  /** Apply mappings to raw rows, producing typed data for validation */
  applyMappings: (
    rows: ParsedCSVRow[],
    mappings: FieldMapping[]
  ) => Record<string, unknown>[];
  /** Server-side validation */
  validate: (
    mappedRows: Record<string, unknown>[]
  ) => Promise<ValidationResponse>;
  /** Execute the import for valid rows */
  import: (
    validRows: Record<string, unknown>[],
    validation: ValidationResponse
  ) => Promise<ImportResult>;

  // Validation step columns
  validationColumns: { key: string; label: string }[];
  /** Optional extra content for validation step (e.g. tier limit warning) */
  renderValidationExtra?: (validation: ValidationResponse) => ReactNode;

  // Complete step
  /** Message shown on completion (e.g. "Users are inactive by default.") */
  completeMessage?: string;
  /** Column configs for the results table */
  resultColumns?: { key: string; label: string }[];
}
