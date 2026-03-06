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
import { CsvUploadStep } from "./steps/upload-step";
import { CsvMappingStep } from "./steps/mapping-step";
import { CsvValidationStep } from "./steps/validation-step";
import { CsvCompleteStep } from "./steps/complete-step";
import type {
  CsvImportConfig,
  FieldMapping,
  ImportResult,
  ParsedCSVRow,
  ValidationResponse,
  WizardStep,
} from "./types";

const STEPS: { key: WizardStep; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "mapping", label: "Map Fields" },
  { key: "validation", label: "Validate" },
  { key: "complete", label: "Results" },
];

export interface CsvImportWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: () => void;
  config: CsvImportConfig;
  className?: string;
}

export function CsvImportWizard({
  open,
  onOpenChange,
  onComplete,
  config,
}: CsvImportWizardProps) {
  const [step, setStep] = useState<WizardStep>("upload");
  const [isPending, startTransition] = useTransition();

  const [rawRows, setRawRows] = useState<ParsedCSVRow[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [mappedData, setMappedData] = useState<Record<string, unknown>[]>([]);
  const [validationResult, setValidationResult] =
    useState<ValidationResponse | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

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
    setHeaders([]);
    setMappings([]);
    setMappedData([]);
    setValidationResult(null);
    setImportResult(null);
  }, []);

  const handleClose = useCallback(() => {
    if (step === "complete") onComplete();
    onOpenChange(false);
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(resetWizard, 300);
  }, [step, onComplete, onOpenChange, resetWizard]);

  // Step 1 → 2
  const handleUpload = useCallback(
    (rows: ParsedCSVRow[], csvHeaders: string[]) => {
      setRawRows(rows);
      setHeaders(csvHeaders);
      setMappings(config.autoDetect(csvHeaders));
      setStep("mapping");
    },
    [config]
  );

  // Mapping change
  const handleMappingChange = useCallback(
    (index: number, fieldKey: string | null) => {
      setMappings((prev) => {
        const next = [...prev];
        next[index] = { ...next[index], fieldKey };
        return next;
      });
    },
    []
  );

  // Step 2 → 3
  const handleValidate = useCallback(() => {
    const mapped = config.applyMappings(rawRows, mappings);
    setMappedData(mapped);

    startTransition(async () => {
      const result = await config.validate(mapped);
      setValidationResult(result);
      setStep("validation");
    });
  }, [rawRows, mappings, config]);

  // Step 3 → 4
  const handleImport = useCallback(() => {
    if (!validationResult) return;

    startTransition(async () => {
      const result = await config.import(mappedData, validationResult);
      setImportResult(result);
      setStep("complete");
    });
  }, [validationResult, mappedData, config]);

  const canProceedFromMapping =
    config.getMissingRequired(mappings).length === 0;
  const canImport =
    validationResult !== null && validationResult.validCount > 0;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{config.title}</DialogTitle>
          <DialogDescription>
            {step === "upload" &&
              `Upload a CSV file with ${config.entityName.toLowerCase()} data`}
            {step === "mapping" &&
              `Map CSV columns to ${config.entityName.toLowerCase()} fields`}
            {step === "validation" &&
              "Review validation results before importing"}
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
          {step === "upload" && (
            <CsvUploadStep
              onUpload={handleUpload}
              maxRows={config.maxRows}
              templateFilename={config.templateFilename}
              templateContent={config.templateContent}
              entityNamePlural={config.entityNamePlural}
            />
          )}
          {step === "mapping" && (
            <CsvMappingStep
              headers={headers}
              mappings={mappings}
              previewRows={rawRows.slice(0, 3)}
              fieldDefinitions={config.fieldDefinitions}
              missingRequired={config.getMissingRequired(mappings)}
              onMappingChange={handleMappingChange}
            />
          )}
          {step === "validation" && validationResult && (
            <CsvValidationStep
              validation={validationResult}
              columns={config.validationColumns}
              renderExtra={config.renderValidationExtra}
            />
          )}
          {step === "complete" && importResult && (
            <CsvCompleteStep
              result={importResult}
              entityNamePlural={config.entityNamePlural}
              message={config.completeMessage}
              columns={config.resultColumns}
            />
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="flex-row justify-between sm:justify-between">
          <div>
            {(step === "mapping" || step === "validation") && (
              <Button
                variant="outline"
                onClick={() =>
                  setStep(step === "validation" ? "mapping" : "upload")
                }
                disabled={isPending}
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
                onClick={handleClose}
                disabled={isPending}
              >
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
              <Button
                onClick={handleImport}
                disabled={!canImport || isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <UploadSimple className="mr-2 h-4 w-4" />
                    Import {validationResult?.validCount ?? 0}{" "}
                    {config.entityNamePlural}
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
