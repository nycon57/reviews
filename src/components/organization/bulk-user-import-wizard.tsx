"use client";

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
  SpinnerGap as Loader2,
  ArrowLeft,
  ArrowRight,
  UploadSimple,
} from "@phosphor-icons/react";
import { UploadStep } from "./bulk-import-steps/upload-step";
import { MappingStep } from "./bulk-import-steps/mapping-step";
import { ValidationStep } from "./bulk-import-steps/validation-step";
import { CompleteStep } from "./bulk-import-steps/complete-step";
import {
  autoDetectMappings,
  applyMappings,
  getMissingRequiredFields,
} from "@/lib/organization/bulk-import-validation";
import {
  validateImportData,
  bulkImportUsers,
} from "@/lib/organization/bulk-import-actions";
import type {
  CSVFieldKey,
  FieldMapping,
  ParsedCSVRow,
  ParsedUserData,
  ValidateImportResponse,
  BulkImportResult,
  WizardStep,
} from "@/lib/organization/bulk-import-types";

const STEPS: { key: WizardStep; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "mapping", label: "Map Fields" },
  { key: "validation", label: "Validate" },
  { key: "complete", label: "Results" },
];

interface BulkUserImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
}

export function BulkUserImportWizard({
  open,
  onOpenChange,
  onComplete,
}: BulkUserImportWizardProps) {
  const [step, setStep] = useState<WizardStep>("upload");
  const [isPending, startTransition] = useTransition();

  // Upload state
  const [rawRows, setRawRows] = useState<ParsedCSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  // Mapping state
  const [mappings, setMappings] = useState<FieldMapping[]>([]);

  // Validation state
  const [validationResult, setValidationResult] =
    useState<ValidateImportResponse | null>(null);
  const [mappedUsers, setMappedUsers] = useState<Partial<ParsedUserData>[]>([]);

  // Import result state
  const [importResult, setImportResult] = useState<BulkImportResult | null>(
    null
  );

  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clear any pending reset timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  const stepIndex = STEPS.findIndex((s) => s.key === step);
  const progress = ((stepIndex + 1) / STEPS.length) * 100;

  const resetWizard = useCallback(() => {
    setStep("upload");
    setRawRows([]);
    setHeaders([]);
    setMappings([]);
    setValidationResult(null);
    setMappedUsers([]);
    setImportResult(null);
  }, []);

  const handleClose = useCallback(() => {
    if (step === "complete") {
      onComplete();
    }
    onOpenChange(false);
    // Clear any existing timeout before setting a new one
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    // Reset after dialog animation
    closeTimeoutRef.current = setTimeout(resetWizard, 300);
  }, [step, onComplete, onOpenChange, resetWizard]);

  // Step 1: Upload complete
  const handleUpload = useCallback(
    (rows: ParsedCSVRow[], csvHeaders: string[]) => {
      setRawRows(rows);
      setHeaders(csvHeaders);
      setMappings(autoDetectMappings(csvHeaders));
      setStep("mapping");
    },
    []
  );

  // Step 2: Mapping change
  const handleMappingChange = useCallback(
    (index: number, fieldKey: CSVFieldKey | null) => {
      setMappings((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], fieldKey };
        return next;
      });
    },
    []
  );

  // Step 2 → 3: Validate
  const handleValidate = useCallback(() => {
    const users = applyMappings(rawRows, mappings);
    setMappedUsers(users);

    startTransition(async () => {
      const result = await validateImportData(users);
      setValidationResult(result);
      setStep("validation");
    });
  }, [rawRows, mappings]);

  // Step 3 → 4: Import
  const handleImport = useCallback(() => {
    if (!validationResult) return;

    // Only import valid rows (no errors) — Zod validation guarantees required fields
    const validUsers = validationResult.rows
      .filter((r) => r.status !== "error")
      .map((r) => r.data as ParsedUserData);

    // If tier limit exceeded, only take remaining seats (clamp to 0 minimum)
    const toImport = validationResult.tierLimitExceeded
      ? validUsers.slice(0, Math.max(0, validationResult.remainingSeats))
      : validUsers;

    startTransition(async () => {
      const result = await bulkImportUsers(toImport);
      setImportResult(result);
      setStep("complete");
    });
  }, [validationResult]);

  const canProceedFromMapping =
    getMissingRequiredFields(mappings).length === 0;

  const canImport =
    validationResult !== null && validationResult.validCount > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Users from CSV</DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload a CSV file with user data"}
            {step === "mapping" && "Map CSV columns to user fields"}
            {step === "validation" && "Review validation results before importing"}
            {step === "complete" && "Import complete"}
          </DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            {STEPS.map((s, i) => (
              <span
                key={s.key}
                className={i <= stepIndex ? "text-primary font-medium" : ""}
              >
                {s.label}
              </span>
            ))}
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Step content */}
        <div className="min-h-[300px]">
          {step === "upload" && <UploadStep onUpload={handleUpload} />}
          {step === "mapping" && (
            <MappingStep
              headers={headers}
              mappings={mappings}
              previewRows={rawRows.slice(0, 3)}
              onMappingChange={handleMappingChange}
            />
          )}
          {step === "validation" && validationResult && (
            <ValidationStep validation={validationResult} />
          )}
          {step === "complete" && importResult && (
            <CompleteStep result={importResult} />
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex-row justify-between sm:justify-between">
          <div>
            {step === "mapping" && (
              <Button
                variant="outline"
                onClick={() => setStep("upload")}
                disabled={isPending}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
            {step === "validation" && (
              <Button
                variant="outline"
                onClick={() => setStep("mapping")}
                disabled={isPending}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {step !== "complete" && (
              <Button variant="outline" onClick={handleClose} disabled={isPending}>
                Cancel
              </Button>
            )}

            {step === "mapping" && (
              <Button
                onClick={handleValidate}
                disabled={!canProceedFromMapping || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    Validate
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            )}

            {step === "validation" && (
              <Button onClick={handleImport} disabled={!canImport || isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <UploadSimple className="mr-2 h-4 w-4" />
                    Import {validationResult?.validCount ?? 0} Users
                  </>
                )}
              </Button>
            )}

            {step === "complete" && (
              <Button onClick={handleClose}>Close</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
