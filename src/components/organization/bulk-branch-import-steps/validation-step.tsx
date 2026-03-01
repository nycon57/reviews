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
  WarningCircle,
  XCircle,
} from "@phosphor-icons/react";
import type {
  BranchRowValidationResult,
  ValidationStatus,
  ValidateBranchImportResponse,
} from "@/lib/branches/bulk-import-types";

interface ValidationStepProps {
  validation: ValidateBranchImportResponse;
}

const STATUS_CONFIG: Record<
  ValidationStatus,
  {
    icon: typeof CheckCircle;
    variant: "default" | "secondary" | "destructive" | "outline";
    label: string;
  }
> = {
  valid: { icon: CheckCircle, variant: "default", label: "Valid" },
  warning: { icon: WarningCircle, variant: "secondary", label: "Warning" },
  error: { icon: XCircle, variant: "destructive", label: "Error" },
};

export function BranchValidationStep({ validation }: ValidationStepProps) {
  const [filter, setFilter] = useState<ValidationStatus | "all">("all");

  const filteredRows =
    filter === "all"
      ? validation.rows
      : validation.rows.filter((r) => r.status === filter);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4">
        <Badge variant="default" className="gap-1">
          <CheckCircle className="h-3 w-3" />
          {validation.validCount} valid
        </Badge>
        {validation.warningCount > 0 && (
          <Badge variant="secondary" className="gap-1">
            <WarningCircle className="h-3 w-3" />
            {validation.warningCount} warnings
          </Badge>
        )}
        {validation.errorCount > 0 && (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            {validation.errorCount} errors
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(["all", "valid", "warning", "error"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "all"
              ? ` (${validation.rows.length})`
              : f === "valid"
                ? ` (${validation.validCount})`
                : f === "warning"
                  ? ` (${validation.warningCount})`
                  : ` (${validation.errorCount})`}
          </Button>
        ))}
      </div>

      {/* Validation table */}
      <div className="max-h-[400px] overflow-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Branch Name</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Manager Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row) => (
              <BranchValidationRow key={row.rowIndex} row={row} />
            ))}
            {filteredRows.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No rows match the selected filter
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function BranchValidationRow({ row }: { row: BranchRowValidationResult }) {
  const config = STATUS_CONFIG[row.status];
  const Icon = config.icon;

  return (
    <TableRow>
      <TableCell className="text-muted-foreground">{row.rowIndex + 1}</TableCell>
      <TableCell className="font-medium">
        {row.data.name || "—"}
      </TableCell>
      <TableCell>{row.data.region || "—"}</TableCell>
      <TableCell className="font-mono text-sm">
        {row.data.manager_email || "—"}
      </TableCell>
      <TableCell>
        <Badge variant={config.variant} className="gap-1">
          <Icon className="h-3 w-3" />
          {config.label}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[250px]">
        {row.errors.length > 0 && (
          <ul className="text-xs text-destructive">
            {row.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
        {row.warnings.length > 0 && (
          <ul className="text-xs text-yellow-600 dark:text-yellow-500">
            {row.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        )}
      </TableCell>
    </TableRow>
  );
}
