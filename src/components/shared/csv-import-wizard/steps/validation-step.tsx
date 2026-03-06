"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle,
  Warning,
  XCircle,
} from "@phosphor-icons/react";
import type { RowValidationResult, ValidationResponse } from "../types";

type FilterStatus = "all" | "valid" | "warning" | "error";

interface CsvValidationStepProps {
  validation: ValidationResponse;
  columns: { key: string; label: string }[];
  renderExtra?: (validation: ValidationResponse) => React.ReactNode;
  className?: string;
}

const STATUS_ICON: Record<
  RowValidationResult["status"],
  React.ReactNode
> = {
  valid: <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" weight="fill" />,
  warning: <Warning className="h-4 w-4 text-amber-500" weight="fill" />,
  error: <XCircle className="h-4 w-4 text-destructive" weight="fill" />,
};

export function CsvValidationStep({
  validation,
  columns,
  renderExtra,
}: CsvValidationStepProps) {
  const [filter, setFilter] = useState<FilterStatus>("all");

  const filtered =
    filter === "all"
      ? validation.rows
      : validation.rows.filter((r) => r.status === filter);

  return (
    <div className="space-y-4">
      {/* Summary badges */}
      <div className="flex flex-wrap gap-3">
        <Badge
          variant="outline"
          className="gap-1.5 border-green-200 text-green-700 dark:border-green-800 dark:text-green-400"
        >
          <CheckCircle className="h-3.5 w-3.5" weight="fill" />
          {validation.validCount} valid
        </Badge>
        {validation.warningCount > 0 && (
          <Badge
            variant="outline"
            className="gap-1.5 border-amber-200 text-amber-700 dark:border-amber-800 dark:text-amber-400"
          >
            <Warning className="h-3.5 w-3.5" weight="fill" />
            {validation.warningCount} warnings
          </Badge>
        )}
        {validation.errorCount > 0 && (
          <Badge
            variant="outline"
            className="gap-1.5 border-red-200 text-red-700 dark:border-red-800 dark:text-red-400"
          >
            <XCircle className="h-3.5 w-3.5" weight="fill" />
            {validation.errorCount} errors
          </Badge>
        )}
      </div>

      {/* Extra content (e.g. tier limit warning) */}
      {renderExtra?.(validation)}

      {/* Filter buttons */}
      <div className="flex gap-2">
        {(["all", "valid", "warning", "error"] as FilterStatus[]).map((s) => (
          <Button
            key={s}
            variant={filter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
      </div>

      {/* Rows table */}
      <div className="max-h-[400px] overflow-y-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              {columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
              <TableHead className="w-12">Status</TableHead>
              <TableHead>Issues</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((row) => (
              <TableRow key={row.row}>
                <TableCell className="font-mono text-xs">{row.row}</TableCell>
                {columns.map((col) => (
                  <TableCell key={col.key} className="text-sm">
                    {String(
                      (row.data as Record<string, unknown>)[col.key] ?? "—"
                    )}
                  </TableCell>
                ))}
                <TableCell>{STATUS_ICON[row.status]}</TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {[...row.errors, ...row.warnings].join("; ") || "—"}
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={columns.length + 3}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No rows match this filter
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
