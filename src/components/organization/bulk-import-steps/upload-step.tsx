"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  FileArrowUp,
  DownloadSimple,
  WarningCircle,
  File,
  X,
} from "@phosphor-icons/react";
import {
  generateCSVTemplate,
} from "@/lib/organization/bulk-import-validation";
import {
  MAX_IMPORT_ROWS,
  type ParsedCSVRow,
} from "@/lib/organization/bulk-import-types";

interface UploadStepProps {
  onUpload: (rows: ParsedCSVRow[], headers: string[]) => void;
}

export function UploadStep({ onUpload }: UploadStepProps) {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  const handleDownloadTemplate = useCallback(() => {
    const csv = generateCSVTemplate();
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "user-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setError(null);
      const file = acceptedFiles[0];
      if (!file) return;

      // Validate file type
      if (!file.name.endsWith(".csv") && file.type !== "text/csv") {
        setError("Please upload a CSV file");
        return;
      }

      // Validate file size (max 1MB)
      if (file.size > 1024 * 1024) {
        setError("File size must be under 1MB");
        return;
      }

      setFileName(file.name);

      Papa.parse<ParsedCSVRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setError(`CSV parse error: ${results.errors[0].message}`);
            return;
          }

          const rows = results.data;
          if (rows.length === 0) {
            setError("CSV file is empty");
            return;
          }

          if (rows.length > MAX_IMPORT_ROWS) {
            setError(
              `Too many rows. Maximum is ${MAX_IMPORT_ROWS}, found ${rows.length}`
            );
            return;
          }

          const headers = results.meta.fields ?? [];
          if (headers.length === 0) {
            setError("No headers found in CSV");
            return;
          }

          onUpload(rows, headers);
        },
        error: (err) => {
          setError(`Failed to parse CSV: ${err.message}`);
        },
      });
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/csv": [".csv"] },
    maxFiles: 1,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
          <DownloadSimple className="mr-2 h-4 w-4" />
          Download Template
        </Button>
      </div>

      <div
        {...getRootProps()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 transition-colors ${
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        }`}
      >
        <input {...getInputProps()} />
        {fileName ? (
          <>
            <File className="mb-3 h-10 w-10 text-primary" weight="duotone" />
            <p className="text-sm font-medium">{fileName}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Drop a new file to replace
            </p>
          </>
        ) : (
          <>
            <FileArrowUp
              className="mb-3 h-10 w-10 text-muted-foreground"
              weight="duotone"
            />
            <p className="text-sm font-medium">
              {isDragActive
                ? "Drop your CSV file here"
                : "Drag & drop a CSV file, or click to browse"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Max {MAX_IMPORT_ROWS} rows, 1MB limit
            </p>
          </>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <WarningCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => {
                setError(null);
                setFileName(null);
              }}
            >
              <X className="h-3 w-3" />
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
