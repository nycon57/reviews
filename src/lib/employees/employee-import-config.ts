import type { CsvImportConfig } from "@/components/shared/csv-import-wizard";
import { bulkImportEmployees } from "./actions";
import {
  EMPLOYEE_CSV_FIELDS,
  REQUIRED_EMPLOYEE_FIELDS,
  MAX_EMPLOYEE_IMPORT_ROWS,
  autoDetectEmployeeMappings,
  type EmployeeCSVRow,
} from "./types";

function generateEmployeeCSVTemplate(): string {
  const headers = EMPLOYEE_CSV_FIELDS.map((f) => f.key);
  const example = [
    "john@example.com",
    "John Smith",
    "Lending",
    "Loan Officer",
    "555-0100",
    "Downtown Branch",
  ];
  return [headers.join(","), example.join(",")].join("\n");
}

export function createEmployeeImportConfig(): CsvImportConfig {
  return {
    title: "Import Employees",
    entityName: "Employee",
    entityNamePlural: "Employees",
    maxRows: MAX_EMPLOYEE_IMPORT_ROWS,
    fieldDefinitions: EMPLOYEE_CSV_FIELDS.map((f) => ({
      key: f.key,
      label: f.label,
      required: f.required,
    })),
    templateFilename: "employee-import-template.csv",
    templateContent: generateEmployeeCSVTemplate(),

    autoDetect: (headers) =>
      autoDetectEmployeeMappings(headers).map((m) => ({
        csvHeader: m.csvHeader,
        fieldKey: m.fieldKey as string | null,
        autoDetected: m.fieldKey !== null,
      })),

    getMissingRequired: (mappings) => {
      const mappedKeys = new Set(
        mappings.map((m) => m.fieldKey).filter(Boolean)
      );
      return REQUIRED_EMPLOYEE_FIELDS.filter(
        (key) => !mappedKeys.has(key)
      ).map((key) => {
        const field = EMPLOYEE_CSV_FIELDS.find((f) => f.key === key);
        return field?.label ?? key;
      });
    },

    applyMappings: (rows, mappings) =>
      rows.map((row) => {
        const mapped: Record<string, string> = {};
        for (const { csvHeader, fieldKey } of mappings) {
          if (fieldKey && row[csvHeader] !== undefined) {
            mapped[fieldKey] = row[csvHeader].trim();
          }
        }
        return mapped;
      }),

    validate: async (mapped) => {
      const rows = mapped.map((row, i) => {
        const data = row as Partial<EmployeeCSVRow>;
        const errors: string[] = [];

        if (!data.email?.trim()) errors.push("Missing email");
        if (!data.full_name?.trim()) errors.push("Missing full name");
        if (
          data.email &&
          !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())
        ) {
          errors.push(`Invalid email: ${data.email}`);
        }

        return {
          row: i + 1,
          status: (errors.length > 0 ? "error" : "valid") as
            | "valid"
            | "error",
          data: row,
          errors,
          warnings: [] as string[],
        };
      });

      return {
        rows,
        validCount: rows.filter((r) => r.status === "valid").length,
        errorCount: rows.filter((r) => r.status === "error").length,
        warningCount: 0,
      };
    },

    import: async (_mappedRows, validation) => {
      const validRows = validation.rows
        .filter((r) => r.status !== "error")
        .map((r) => r.data as unknown as EmployeeCSVRow);

      const result = await bulkImportEmployees(validRows);
      if (result.success && result.data) {
        return {
          successCount: result.data.successCount,
          failureCount: result.data.failureCount,
          results: result.data.results.map((r) => ({
            success: r.success,
            label: r.email,
            error: r.error,
            data: { email: r.email, name: r.fullName },
          })),
        };
      }
      return {
        successCount: 0,
        failureCount: validRows.length,
        results: validRows.map((r) => ({
          success: false,
          label: r.email,
          error: result.error || "Import failed",
          data: { email: r.email, name: r.full_name },
        })),
      };
    },

    validationColumns: [
      { key: "email", label: "Email" },
      { key: "full_name", label: "Name" },
      { key: "department", label: "Department" },
    ],

    resultColumns: [
      { key: "email", label: "Email" },
      { key: "name", label: "Name" },
    ],
  };
}
