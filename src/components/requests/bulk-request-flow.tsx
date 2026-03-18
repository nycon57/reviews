"use client";

import { useState, useCallback, useTransition, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import {
  UploadSimple,
  DownloadSimple,
  CheckCircle,
  XCircle,
  Warning,
  SpinnerGap,
  PaperPlaneRight,
  ArrowLeft,
  FileText,
} from "@phosphor-icons/react";
import Papa from "papaparse";
import { useDropzone } from "react-dropzone";
import { cn } from "@/lib/utils";
import {
  autoDetectRequestMappings,
  validateRequestRowsClient,
  generateRequestCSVTemplate,
  applyRequestMappings,
} from "@/lib/requests/bulk-request-validation";
import {
  bulkSendTextReviewsViaEmail,
  bulkSendVideoRequestsViaEmail,
} from "@/lib/requests/bulk-request-actions";
import { EmailTemplatePicker } from "@/components/email-builder/email-template-picker";
import type {
  ParsedCSVRow,
  ParsedRequestRow,
  RequestRowValidationResult,
  RequestType,
  BulkSendResult,
} from "@/lib/requests/bulk-request-types";
import { MAX_REQUEST_IMPORT_ROWS } from "@/lib/requests/bulk-request-types";

type BulkStep = "upload" | "validate" | "complete";

interface BulkRequestFlowProps {
  requestType: RequestType;
  onSuccess: () => void;
  onClose: () => void;
}

export function BulkRequestFlow({
  requestType,
  onSuccess,
  onClose,
}: BulkRequestFlowProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [step, setStep] = useState<BulkStep>("upload");

  // Parsed data
  const [validationResults, setValidationResults] = useState<
    RequestRowValidationResult[]
  >([]);
  const [sendResult, setSendResult] = useState<BulkSendResult | null>(null);

  // Email template selection
  const [emailTemplate, setEmailTemplate] = useState<{ id: string; name: string } | null>(null);

  const isText = requestType === "text";

  const { validCount, errorCount } = useMemo(() => {
    let valid = 0;
    let error = 0;
    for (const r of validationResults) {
      if (r.status === "error") error++;
      else valid++;
    }
    return { validCount: valid, errorCount: error };
  }, [validationResults]);

  // ── Upload Step ──────────────────────────────────────────────────────

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      Papa.parse<ParsedCSVRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data.length === 0) {
            toast({
              title: "Empty file",
              description: "The CSV file contains no data rows.",
              variant: "destructive",
            });
            return;
          }

          if (results.data.length > MAX_REQUEST_IMPORT_ROWS) {
            toast({
              title: "Too many rows",
              description: `Maximum ${MAX_REQUEST_IMPORT_ROWS} rows per batch. Found ${results.data.length}.`,
              variant: "destructive",
            });
            return;
          }

          const headers = Object.keys(results.data[0]);
          const mappings = autoDetectRequestMappings(headers, "email");
          const mapped = applyRequestMappings(results.data, mappings);
          const validated = validateRequestRowsClient(mapped, "email");

          setValidationResults(validated);
          setStep("validate");
        },
        error: () => {
          toast({
            title: "Parse error",
            description: "Failed to parse CSV file.",
            variant: "destructive",
          });
        },
      });
    },
    [toast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/vnd.ms-excel": [".csv"],
    },
    maxFiles: 1,
  });

  function downloadTemplate() {
    const content = generateRequestCSVTemplate("email");
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "review-request-template-email.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // ── Send ─────────────────────────────────────────────────────────────

  function handleSend() {
    const validRows = validationResults
      .filter((r) => r.status !== "error")
      .map((r) => r.data as ParsedRequestRow);

    if (validRows.length === 0) {
      toast({
        title: "No valid rows",
        description: "All rows have validation errors.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      let result: { success: boolean; data?: BulkSendResult; error?: string };

      if (isText) {
        result = await bulkSendTextReviewsViaEmail(validRows, emailTemplate?.id);
      } else {
        result = await bulkSendVideoRequestsViaEmail(validRows);
      }

      if (result.success && result.data) {
        setSendResult(result.data);
        setStep("complete");
        onSuccess();
      } else {
        toast({
          title: "Error",
          description: result.error || "Bulk send failed",
          variant: "destructive",
        });
      }
    });
  }

  // ── Render ───────────────────────────────────────────────────────────

  if (step === "upload") {
    return (
      <div className="space-y-4">
        {/* Download template */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Upload a CSV with Name and Email columns.
          </p>
          <Button variant="outline" size="sm" onClick={downloadTemplate}>
            <DownloadSimple weight="duotone" className="mr-2 h-3.5 w-3.5" />
            Template
          </Button>
        </div>

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors cursor-pointer",
            isDragActive
              ? "border-repwell-teal-300 bg-repwell-teal-300/5"
              : "border-border hover:border-repwell-teal-300/50"
          )}
        >
          <input {...getInputProps()} />
          <UploadSimple weight="duotone" className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground text-center">
            {isDragActive
              ? "Drop CSV file here..."
              : "Drag & drop a CSV file, or click to browse"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Max {MAX_REQUEST_IMPORT_ROWS} rows
          </p>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  if (step === "validate") {
    return (
      <div className="space-y-4">
        {/* Summary */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStep("upload");
              setValidationResults([]);
            }}
          >
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-repwell-sage-200 border-repwell-sage-200/30"
            >
              {validCount} valid
            </Badge>
            {errorCount > 0 && (
              <Badge variant="destructive">{errorCount} errors</Badge>
            )}
          </div>
        </div>

        {/* Email template picker */}
        {isText && (
          <EmailTemplatePicker
            value={emailTemplate}
            onChange={setEmailTemplate}
          />
        )}

        {/* Validation table */}
        <div className="max-h-[300px] overflow-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-[50px] text-xs">#</TableHead>
                <TableHead className="text-xs">Name</TableHead>
                <TableHead className="text-xs">Email</TableHead>
                <TableHead className="w-[90px] text-xs">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validationResults.map((row) => (
                <TableRow key={row.rowIndex}>
                  <TableCell className="text-xs text-muted-foreground">
                    {row.rowIndex + 1}
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.data.name || "-"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {row.data.email || "-"}
                  </TableCell>
                  <TableCell>
                    {row.status === "valid" && (
                      <CheckCircle
                        weight="fill"
                        className="h-4 w-4 text-repwell-sage-200"
                      />
                    )}
                    {row.status === "warning" && (
                      <span title={row.warnings.join(", ")}>
                        <Warning
                          weight="fill"
                          className="h-4 w-4 text-amber-500"
                        />
                      </span>
                    )}
                    {row.status === "error" && (
                      <span title={row.errors.join(", ")}>
                        <XCircle
                          weight="fill"
                          className="h-4 w-4 text-destructive"
                        />
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSend}
            disabled={validCount === 0 || isPending}
          >
            {isPending ? (
              <SpinnerGap weight="duotone" className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <PaperPlaneRight weight="duotone" className="mr-2 h-4 w-4" />
            )}
            Send {validCount} Request{validCount !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    );
  }

  // Complete step
  return (
    <div className="flex flex-col items-center py-6 space-y-4">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-repwell-sage-200/15">
        <CheckCircle
          weight="fill"
          className="h-7 w-7 text-repwell-sage-200"
        />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-lg">Bulk Send Complete</h3>
        {sendResult && (
          <p className="text-sm text-muted-foreground mt-1">
            {sendResult.totalSent} sent, {sendResult.totalFailed} failed
          </p>
        )}
      </div>

      {sendResult && sendResult.errors.length > 0 && (
        <div className="w-full max-h-[150px] overflow-auto rounded-lg border p-3 space-y-1">
          {sendResult.errors.slice(0, 10).map((err) => (
            <div
              key={err.rowIndex}
              className="flex items-center gap-2 text-xs text-destructive"
            >
              <FileText className="h-3 w-3 shrink-0" />
              Row {err.rowIndex + 1}: {err.error}
            </div>
          ))}
        </div>
      )}

      <Button onClick={onClose}>Done</Button>
    </div>
  );
}
