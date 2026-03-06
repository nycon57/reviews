import type { CsvImportConfig } from "@/components/shared/csv-import-wizard";
import {
  autoDetectBranchMappings,
  applyBranchMappings,
  getMissingRequiredBranchFields,
  generateBranchCSVTemplate,
} from "./bulk-import-validation";
import {
  validateBranchImportData,
  bulkImportBranches,
} from "./bulk-import-actions";
import {
  BRANCH_CSV_FIELDS,
  MAX_BRANCH_IMPORT_ROWS,
} from "./bulk-import-types";
import type { BranchCSVFieldKey, ParsedBranchData } from "./bulk-import-types";

export function createBranchImportConfig(): CsvImportConfig {
  return {
    title: "Import Branches from CSV",
    entityName: "Branch",
    entityNamePlural: "Branches",
    maxRows: MAX_BRANCH_IMPORT_ROWS,
    fieldDefinitions: BRANCH_CSV_FIELDS.map((f) => ({
      key: f.key,
      label: f.label,
      required: f.required,
    })),
    templateFilename: "branch-import-template.csv",
    templateContent: generateBranchCSVTemplate(),

    autoDetect: (headers) =>
      autoDetectBranchMappings(headers).map((m) => ({
        csvHeader: m.csvHeader,
        fieldKey: m.fieldKey as string | null,
        autoDetected: m.fieldKey !== null,
      })),

    getMissingRequired: (mappings) => {
      const typed = mappings.map((m) => ({
        csvHeader: m.csvHeader,
        fieldKey: m.fieldKey as BranchCSVFieldKey | null,
      }));
      return getMissingRequiredBranchFields(typed).map((key) => {
        const field = BRANCH_CSV_FIELDS.find((f) => f.key === key);
        return field?.label ?? key;
      });
    },

    applyMappings: (rows, mappings) => {
      const typed = mappings.map((m) => ({
        csvHeader: m.csvHeader,
        fieldKey: m.fieldKey as BranchCSVFieldKey | null,
      }));
      return applyBranchMappings(rows, typed) as Record<string, unknown>[];
    },

    validate: async (mapped) => {
      const result = await validateBranchImportData(
        mapped as Partial<ParsedBranchData>[]
      );
      return {
        rows: result.rows.map((r) => ({
          row: r.rowIndex + 1,
          status: r.status,
          data: r.data as Record<string, unknown>,
          errors: r.errors,
          warnings: r.warnings,
        })),
        validCount: result.validCount,
        warningCount: result.warningCount,
        errorCount: result.errorCount,
      };
    },

    import: async (_mappedRows, validation) => {
      const validRows = validation.rows
        .filter((r) => r.status !== "error")
        .map((r) => r.data as unknown as ParsedBranchData);

      const result = await bulkImportBranches(validRows);
      return {
        successCount: result.successCount,
        failureCount: result.failureCount,
        results: result.results.map((r) => ({
          success: r.success,
          label: r.name,
          error: r.error,
          data: { name: r.name },
        })),
      };
    },

    validationColumns: [
      { key: "name", label: "Branch Name" },
      { key: "manager_email", label: "Manager Email" },
    ],

    completeMessage: "Imported branches are active by default.",
    resultColumns: [{ key: "name", label: "Branch Name" }],
  };
}
