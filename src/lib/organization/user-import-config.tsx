import { z } from "zod";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { WarningCircle } from "@phosphor-icons/react";
import type { CsvImportConfig } from "@/components/shared/csv-import-wizard";
import {
  autoDetectMappings,
  applyMappings,
  getMissingRequiredFields,
  generateCSVTemplate,
} from "./bulk-import-validation";
import { validateImportData, bulkImportUsers } from "./bulk-import-actions";
import { CSV_FIELDS, MAX_IMPORT_ROWS } from "./bulk-import-types";
import type { CSVFieldKey, ParsedUserData } from "./bulk-import-types";

/**
 * The wizard hands validated rows back as opaque records, so read the import fields off them by
 * name. Each field falls back rather than throwing — `validateImportData` already rejected the
 * rows that are missing required values.
 */
const parsedUserDataSchema = z.object({
  email: z.string().catch(""),
  full_name: z.string().catch(""),
  role: z.string().catch(""),
  phone: z.string().optional().catch(undefined),
  title: z.string().optional().catch(undefined),
  nmls_id: z.string().optional().catch(undefined),
  branch_name: z.string().optional().catch(undefined),
  manager_email: z.string().optional().catch(undefined),
  hire_date: z.string().optional().catch(undefined),
});

export function createUserImportConfig(): CsvImportConfig {
  let tierInfo = { exceeded: false, remaining: 0 };

  return {
    title: "Import Users from CSV",
    entityName: "User",
    entityNamePlural: "Users",
    maxRows: MAX_IMPORT_ROWS,
    fieldDefinitions: CSV_FIELDS.map((f) => ({
      key: f.key,
      label: f.label,
      required: f.required,
    })),
    templateFilename: "user-import-template.csv",
    templateContent: generateCSVTemplate(),

    autoDetect: (headers) =>
      autoDetectMappings(headers).map((m) => ({
        csvHeader: m.csvHeader,
        fieldKey: m.fieldKey as string | null,
        autoDetected: m.fieldKey !== null,
      })),

    getMissingRequired: (mappings) => {
      const typed = mappings.map((m) => ({
        csvHeader: m.csvHeader,
        fieldKey: m.fieldKey as CSVFieldKey | null,
      }));
      return getMissingRequiredFields(typed).map((key) => {
        const field = CSV_FIELDS.find((f) => f.key === key);
        return field?.label ?? key;
      });
    },

    applyMappings: (rows, mappings) => {
      const typed = mappings.map((m) => ({
        csvHeader: m.csvHeader,
        fieldKey: m.fieldKey as CSVFieldKey | null,
      }));
      return applyMappings(rows, typed) as Record<string, unknown>[];
    },

    validate: async (mapped) => {
      const result = await validateImportData(
        mapped as Partial<ParsedUserData>[]
      );
      tierInfo = {
        exceeded: result.tierLimitExceeded,
        remaining: result.remainingSeats,
      };
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
        .map((r) => parsedUserDataSchema.parse(r.data));

      const toImport = tierInfo.exceeded
        ? validRows.slice(0, Math.max(0, tierInfo.remaining))
        : validRows;

      const result = await bulkImportUsers(toImport);
      return {
        successCount: result.successCount,
        failureCount: result.failureCount,
        results: result.results.map((r) => ({
          success: r.success,
          label: r.email,
          error: r.error,
          data: { email: r.email, name: r.full_name },
        })),
      };
    },

    validationColumns: [
      { key: "email", label: "Email" },
      { key: "full_name", label: "Name" },
      { key: "role", label: "Role" },
    ],

    renderValidationExtra: () => {
      if (!tierInfo.exceeded) return null;
      return (
        <Alert variant="destructive">
          <WarningCircle className="h-4 w-4" />
          <AlertTitle>Tier limit exceeded</AlertTitle>
          <AlertDescription>
            {tierInfo.remaining === -1
              ? "Cannot determine remaining seats."
              : `You have ${tierInfo.remaining} seat(s) remaining. Only the first ${tierInfo.remaining} valid users will be imported.`}
          </AlertDescription>
        </Alert>
      );
    },

    completeMessage:
      "Imported users are inactive by default. Activate them from the team members list when ready.",
    resultColumns: [
      { key: "email", label: "Email" },
      { key: "name", label: "Name" },
    ],
  };
}
