"use client";

import { DownloadSimple as Download } from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ReportExport, ReportTemplate } from "@/lib/reporting/types";
import {
  formatRelativeDate,
  formatReportDateRange,
  formatReportDateTime,
} from "@/lib/reporting/utils";

export function ExportHistoryTable({
  exports,
  templates,
  teamMembers,
  isLoading,
}: {
  exports: ReportExport[];
  templates: Map<string, ReportTemplate>;
  teamMembers: Map<string, string>;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (exports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-repwell-sage-100/10 p-8 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-repwell-sage-100 to-repwell-teal-300/10">
          <Download weight="duotone" className="h-7 w-7 text-repwell-teal-300" />
        </div>
        <h3 className="mb-2 text-lg font-medium">No Export History</h3>
        <p className="max-w-sm text-sm text-muted-foreground">
          Recorded PDF, CSV, and JSON exports will appear here.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>File</TableHead>
          <TableHead>Format</TableHead>
          <TableHead>Date Range</TableHead>
          <TableHead>Rows</TableHead>
          <TableHead>Exported</TableHead>
          <TableHead>By</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {exports.map((item) => {
          const template = templates.get(item.templateId);
          const exportedBy = item.createdBy
            ? teamMembers.get(item.createdBy) || `User ${item.createdBy.slice(0, 8)}`
            : "Unknown";

          return (
            <TableRow key={item.id}>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium text-heading">{item.fileName}</div>
                  <div className="text-xs text-muted-foreground">
                    {template?.name || "Unknown template"}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={item.exportFormat === "pdf" ? "default" : "secondary"}>
                  {item.exportFormat.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>{formatReportDateRange(item.dateRangeStart, item.dateRangeEnd)}</TableCell>
              <TableCell>{item.rowCount && item.rowCount > 0 ? item.rowCount : "-"}</TableCell>
              <TableCell>
                <div className="space-y-1 text-sm">
                  <div>{formatReportDateTime(item.createdAt)}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatRelativeDate(item.createdAt)}
                  </div>
                </div>
              </TableCell>
              <TableCell>{exportedBy}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
