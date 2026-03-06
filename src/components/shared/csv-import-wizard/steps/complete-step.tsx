"use client";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, XCircle } from "@phosphor-icons/react";
import type { ImportResult } from "../types";

interface CsvCompleteStepProps {
  result: ImportResult;
  entityName?: string;
  entityNamePlural: string;
  message?: string;
  columns?: { key: string; label: string }[];
}

export function CsvCompleteStep({
  result,
  entityName,
  entityNamePlural,
  message,
  columns,
}: CsvCompleteStepProps) {
  const singularName = entityName ?? entityNamePlural;
  const showColumns = columns && columns.length > 0;

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="flex items-center gap-4">
        {result.successCount > 0 && (
          <Badge variant="default" className="gap-1">
            <CheckCircle className="h-3 w-3" />
            {result.successCount} imported
          </Badge>
        )}
        {result.failureCount > 0 && (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            {result.failureCount} failed
          </Badge>
        )}
      </div>

      {result.successCount > 0 && message && (
        <p className="text-sm text-muted-foreground">{message}</p>
      )}

      {/* Results table */}
      <div className="max-h-[400px] overflow-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              {showColumns
                ? columns.map((col) => (
                    <TableHead key={col.key}>{col.label}</TableHead>
                  ))
                : <TableHead>{singularName}</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.results.map((r, i) => (
              <TableRow key={i}>
                {showColumns
                  ? columns.map((col) => (
                      <TableCell key={col.key} className="text-sm">
                        {String(r.data?.[col.key] ?? "—")}
                      </TableCell>
                    ))
                  : <TableCell className="text-sm">{r.label}</TableCell>}
                <TableCell>
                  {r.success ? (
                    <Badge variant="default" className="gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Success
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1">
                      <XCircle className="h-3 w-3" />
                      Failed
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {r.error ?? "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
