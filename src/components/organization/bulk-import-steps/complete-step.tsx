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
import type { BulkImportResult } from "@/lib/organization/bulk-import-types";

interface CompleteStepProps {
  result: BulkImportResult;
}

export function CompleteStep({ result }: CompleteStepProps) {
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
          Imported users are inactive by default. Activate them from the team
          members list when ready.
        </p>
      )}

      {/* Results table */}
      <div className="max-h-[400px] overflow-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {result.results.map((r, i) => (
              <TableRow key={i}>
                <TableCell className="font-mono text-sm">{r.email}</TableCell>
                <TableCell>{r.full_name}</TableCell>
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
