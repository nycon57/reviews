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
import type { BulkBranchImportResult } from "@/lib/branches/bulk-import-types";

interface CompleteStepProps {
  result: BulkBranchImportResult;
}

export function BranchCompleteStep({ result }: CompleteStepProps) {
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

      {result.successCount > 0 && (
        <p className="text-sm text-muted-foreground">
          Imported branches are active by default.
        </p>
      )}

      {/* Results table */}
      <div className="max-h-[400px] overflow-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Branch Name</TableHead>
              <TableHead>Region</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.results.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell>{r.region || "—"}</TableCell>
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
