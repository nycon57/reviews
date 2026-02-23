"use client";

import Papa from "papaparse";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SpinnerGap as Loader2,
  ArrowLeft,
  ArrowRight,
  UploadSimple,
  CheckCircle,
  XCircle,
  FileText,
} from "@phosphor-icons/react";
import { bulkImportContacts } from "@/lib/contacts/actions";
import {
  autoDetectContactMappings,
  CONTACT_CSV_FIELDS,
  REQUIRED_CONTACT_FIELDS,
  MAX_CONTACT_IMPORT_ROWS,
  type ContactFieldMapping,
  type ContactCSVRow,
  type ContactBulkImportResult,
  type ContactCSVFieldKey,
} from "@/lib/contacts/types";

type WizardStep = "upload" | "mapping" | "validation" | "complete";

const STEPS: { key: WizardStep; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "mapping", label: "Map Fields" },
  { key: "validation", label: "Validate" },
  { key: "complete", label: "Results" },
];

interface ContactImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

interface ParsedCSVRow {
  [header: string]: string;
}

function parseCSV(text: string): { headers: string[]; rows: ParsedCSVRow[] } {
  const parsed = Papa.parse<ParsedCSVRow>(text, {
    header: true,
    skipEmptyLines: true,
  });

  const headers = parsed.meta.fields ?? [];
  if (headers.length === 0) return { headers: [], rows: [] };

  const rows = parsed.data.slice(0, MAX_CONTACT_IMPORT_ROWS);
  return { headers, rows };
}

export function ContactImportWizard({ open, onOpenChange, onComplete }: ContactImportWizardProps) {
  const [step, setStep] = useState<WizardStep>("upload");
  const [isPending, startTransition] = useTransition();

  // Upload state
  const [rawRows, setRawRows] = useState<ParsedCSVRow[]>([]);

  // Mapping state
  const [mappings, setMappings] = useState<ContactFieldMapping[]>([]);

  // Validation state
  const [validRows, setValidRows] = useState<ContactCSVRow[]>([]);
  const [errors, setErrors] = useState<{ row: number; message: string }[]>([]);

  // Result state
  const [importResult, setImportResult] = useState<ContactBulkImportResult | null>(null);

  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const resetWizard = useCallback(() => {
    setStep("upload");
    setRawRows([]);
    setMappings([]);
    setValidRows([]);
    setErrors([]);
    setImportResult(null);
  }, []);

  // ==================== Step 1: Upload ====================
  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new window.FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const { headers: h, rows } = parseCSV(text);

        if (h.length === 0 || rows.length === 0) return;

        setRawRows(rows);
        setMappings(autoDetectContactMappings(h));
        setStep("mapping");
      };
      reader.readAsText(file);
    },
    [],
  );

  // ==================== Step 2: Mapping ====================
  const handleMappingChange = useCallback(
    (csvHeader: string, fieldKey: string) => {
      setMappings((prev) =>
        prev.map((m) =>
          m.csvHeader === csvHeader
            ? { ...m, fieldKey: fieldKey === "__none__" ? null : (fieldKey as ContactCSVFieldKey) }
            : m,
        ),
      );
    },
    [],
  );

  const missingRequired = REQUIRED_CONTACT_FIELDS.filter(
    (f) => !mappings.some((m) => m.fieldKey === f),
  );

  const handleValidate = useCallback(() => {
    const mapped: ContactCSVRow[] = [];
    const rowErrors: { row: number; message: string }[] = [];

    rawRows.forEach((raw, i) => {
      const row: Partial<ContactCSVRow> = {};
      for (const m of mappings) {
        if (m.fieldKey && raw[m.csvHeader]) {
          (row as Record<string, string>)[m.fieldKey] = raw[m.csvHeader];
        }
      }

      // Validate required fields
      if (!row.email?.trim()) {
        rowErrors.push({ row: i + 2, message: "Missing email" });
        return;
      }
      if (!row.full_name?.trim()) {
        rowErrors.push({ row: i + 2, message: "Missing full name" });
        return;
      }

      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email.trim())) {
        rowErrors.push({ row: i + 2, message: `Invalid email: ${row.email}` });
        return;
      }

      mapped.push(row as ContactCSVRow);
    });

    setValidRows(mapped);
    setErrors(rowErrors);
    setStep("validation");
  }, [rawRows, mappings]);

  // ==================== Step 3: Validation → Import ====================
  const handleImport = useCallback(() => {
    startTransition(async () => {
      const result = await bulkImportContacts(validRows);
      if (result.success && result.data) {
        setImportResult(result.data);
      } else {
        setImportResult({
          results: [],
          successCount: 0,
          failureCount: validRows.length,
        });
      }
      setStep("complete");
    });
  }, [validRows]);

  // ==================== Close / Done ====================
  const handleDone = useCallback(() => {
    onOpenChange(false);
    onComplete();
    closeTimeoutRef.current = setTimeout(resetWizard, 300);
  }, [onOpenChange, onComplete, resetWizard]);

  // ==================== Render Steps ====================
  const renderUploadStep = () => (
    <div className="flex flex-col items-center justify-center gap-4 py-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-repwell-sage-100/50">
        <UploadSimple weight="duotone" className="h-8 w-8 text-repwell-teal-300" />
      </div>
      <div className="text-center">
        <h3 className="font-sans text-lg font-semibold text-repwell-teal-500">
          Upload CSV File
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a CSV with employee contacts. Required columns: Email, Full Name.
        </p>
      </div>
      <label className="cursor-pointer">
        <input
          type="file"
          accept=".csv"
          onChange={handleFileUpload}
          className="hidden"
        />
        <span className="inline-flex items-center gap-2 rounded-lg bg-repwell-teal-300 px-4 py-2 text-sm font-medium text-white hover:bg-repwell-teal-400 transition-colors">
          <UploadSimple className="h-4 w-4" />
          Choose File
        </span>
      </label>
      <p className="text-xs text-muted-foreground">
        Max {MAX_CONTACT_IMPORT_ROWS} rows per import
      </p>
    </div>
  );

  const renderMappingStep = () => (
    <div className="space-y-4">
      <div>
        <h3 className="font-sans text-lg font-semibold text-repwell-teal-500">
          Map CSV Columns
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          {rawRows.length} rows detected. Map your CSV headers to contact fields.
        </p>
      </div>

      {missingRequired.length > 0 && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          Missing required mappings: {missingRequired.join(", ")}
        </div>
      )}

      <div className="space-y-3">
        {mappings.map((m) => (
          <div key={m.csvHeader} className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-1/3 min-w-0">
              <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <span className="truncate text-sm font-medium text-repwell-teal-500">{m.csvHeader}</span>
            </div>
            <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
            <Select
              value={m.fieldKey || "__none__"}
              onValueChange={(v) => handleMappingChange(m.csvHeader, v)}
            >
              <SelectTrigger className="w-2/3 focus:ring-repwell-teal-300">
                <SelectValue placeholder="Skip this column" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">
                  <span className="text-muted-foreground">Skip</span>
                </SelectItem>
                {CONTACT_CSV_FIELDS.map((f) => (
                  <SelectItem key={f.key} value={f.key}>
                    {f.label} {f.required && "*"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );

  const renderValidationStep = () => (
    <div className="space-y-4">
      <div>
        <h3 className="font-sans text-lg font-semibold text-repwell-teal-500">
          Validation Results
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Review before importing.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-lg border border-border bg-white p-4 text-center">
          <div className="text-2xl font-bold text-repwell-teal-500">{validRows.length}</div>
          <div className="text-sm text-muted-foreground">Valid contacts</div>
        </div>
        <div className="rounded-lg border border-border bg-white p-4 text-center">
          <div className="text-2xl font-bold text-red-600">{errors.length}</div>
          <div className="text-sm text-muted-foreground">Errors</div>
        </div>
      </div>

      {errors.length > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3">
          <ul className="space-y-1 text-sm text-red-800">
            {errors.slice(0, 20).map((e, i) => (
              <li key={i}>Row {e.row}: {e.message}</li>
            ))}
            {errors.length > 20 && (
              <li className="font-medium">...and {errors.length - 20} more errors</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );

  const renderCompleteStep = () => (
    <div className="space-y-4">
      <div className="flex flex-col items-center gap-3 py-4">
        {importResult && importResult.successCount > 0 ? (
          <CheckCircle weight="duotone" className="h-12 w-12 text-repwell-sage-200" />
        ) : (
          <XCircle weight="duotone" className="h-12 w-12 text-red-500" />
        )}
        <h3 className="font-sans text-lg font-semibold text-repwell-teal-500">
          Import Complete
        </h3>
      </div>

      {importResult && (
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-lg border border-border bg-white p-4 text-center">
            <div className="text-2xl font-bold text-repwell-sage-200">{importResult.successCount}</div>
            <div className="text-sm text-muted-foreground">Imported</div>
          </div>
          <div className="rounded-lg border border-border bg-white p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{importResult.failureCount}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </div>
        </div>
      )}

      {importResult && importResult.failureCount > 0 && (
        <div className="max-h-40 overflow-y-auto rounded-lg border border-red-200 bg-red-50 p-3">
          <ul className="space-y-1 text-sm text-red-800">
            {importResult.results
              .filter((r) => !r.success)
              .slice(0, 20)
              .map((r, i) => (
                <li key={i}>
                  {r.email}: {r.error}
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          closeTimeoutRef.current = setTimeout(resetWizard, 300);
        }
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl text-repwell-teal-500">
            Import Contacts
          </DialogTitle>
          <DialogDescription>
            Step {stepIndex + 1} of {STEPS.length}: {STEPS[stepIndex]?.label}
          </DialogDescription>
        </DialogHeader>

        <Progress value={progress} className="h-1.5" />

        <div className="min-h-[200px] py-2">
          {step === "upload" && renderUploadStep()}
          {step === "mapping" && renderMappingStep()}
          {step === "validation" && renderValidationStep()}
          {step === "complete" && renderCompleteStep()}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <div>
            {step !== "upload" && step !== "complete" && (
              <Button
                variant="outline"
                onClick={() => setStep(step === "validation" ? "mapping" : "upload")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            {step !== "complete" && (
              <Button
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                  closeTimeoutRef.current = setTimeout(resetWizard, 300);
                }}
              >
                Cancel
              </Button>
            )}

            {step === "mapping" && (
              <Button
                onClick={handleValidate}
                disabled={missingRequired.length > 0}
                className="bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white"
              >
                Validate
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {step === "validation" && (
              <Button
                onClick={handleImport}
                disabled={isPending || validRows.length === 0}
                className="bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white"
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    Import {validRows.length} Contacts
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}

            {step === "complete" && (
              <Button
                onClick={handleDone}
                className="bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white"
              >
                Done
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
