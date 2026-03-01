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
import { BranchUploadStep } from "./bulk-branch-import-steps/upload-step";
import { BranchMappingStep } from "./bulk-branch-import-steps/mapping-step";
import { BranchValidationStep } from "./bulk-branch-import-steps/validation-step";
import { BranchCompleteStep } from "./bulk-branch-import-steps/complete-step";
import {
  autoDetectBranchMappings,
  applyBranchMappings,
  getMissingRequiredBranchFields,
} from "@/lib/branches/bulk-import-validation";
import {
  validateBranchImportData,
  bulkImportBranches,
} from "@/lib/branches/bulk-import-actions";
import type {
  BranchCSVFieldKey,
  BranchFieldMapping,
  ParsedCSVRow,
  ValidateBranchImportResponse,
  BulkBranchImportResult,
  BranchWizardStep,
  ParsedBranchData,
} from "@/lib/branches/bulk-import-types";

const STEPS: { key: BranchWizardStep; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "mapping", label: "Map Fields" },
  { key: "validation", label: "Validate" },
  { key: "complete", label: "Results" },
];

interface BulkBranchImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BulkBranchImportWizard({
  open,
  onOpenChange,
  onSuccess,
}: BulkBranchImportWizardProps) {
  const [step, setStep] = useState<BranchWizardStep>("upload");
  const [isPending, startTransition] = useTransition();

  // Upload state
  const [rawRows, setRawRows] = useState<ParsedCSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);

  // Mapping state
  const [mappings, setMappings] = useState<BranchFieldMapping[]>([]);

  // Validation state
  const [validationResult, setValidationResult] =
    useState<ValidateBranchImportResponse | null>(null);

  // Import result state
  const [importResult, setImportResult] = useState<BulkBranchImportResult | null>(
    null
  );

  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setImportResult(null);
  }, []);

  const handleClose = useCallback(() => {
    if (step === "complete") {
      onSuccess();
    }
    onOpenChange(false);
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(resetWizard, 300);
  }, [step, onSuccess, onOpenChange, resetWizard]);

  // Step 1: Upload complete
  const handleUpload = useCallback(
    (rows: ParsedCSVRow[], csvHeaders: string[]) => {
      setRawRows(rows);
      setHeaders(csvHeaders);
      setMappings(autoDetectBranchMappings(csvHeaders));
      setStep("mapping");
    },
    []
  );

  // Step 2: Mapping change
  const handleMappingChange = useCallback(
    (index: number, fieldKey: BranchCSVFieldKey | null) => {
      setMappings((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], fieldKey };
        return next;
      });
    },
    []
  );

  // Step 2 -> 3: Validate
  const handleValidate = useCallback(() => {
    const branches = applyBranchMappings(rawRows, mappings);

    startTransition(async () => {
      const result = await validateBranchImportData(branches);
      setValidationResult(result);
      setStep("validation");
    });
  }, [rawRows, mappings]);

  // Step 3 -> 4: Import
  const handleImport = useCallback(() => {
    if (!validationResult) return;

    // Only import valid rows (no errors)
    const validBranches = validationResult.rows
      .filter((r) => r.status !== "error")
      .map((r) => r.data as ParsedBranchData);

    startTransition(async () => {
      const result = await bulkImportBranches(validBranches);
      setImportResult(result);
      setStep("complete");
    });
  }, [validationResult]);

  const canProceedFromMapping =
    getMissingRequiredBranchFields(mappings).length === 0;

  const canImport =
    validationResult !== null && validationResult.validCount > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Branches from CSV</DialogTitle>
          <DialogDescription>
            {step === "upload" && "Upload a CSV file with branch data"}
            {step === "mapping" && "Map CSV columns to branch fields"}
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
          {step === "upload" && <BranchUploadStep onUpload={handleUpload} />}
          {step === "mapping" && (
            <BranchMappingStep
              headers={headers}
              mappings={mappings}
              previewRows={rawRows.slice(0, 3)}
              onMappingChange={handleMappingChange}
            />
          )}
          {step === "validation" && validationResult && (
            <BranchValidationStep validation={validationResult} />
          )}
          {step === "complete" && importResult && (
            <BranchCompleteStep result={importResult} />
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
                    Import {validationResult?.validCount ?? 0} Branches
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
