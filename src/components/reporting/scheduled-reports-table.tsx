"use client";

import {
  Clock,
  EnvelopeSimple,
  PencilSimple,
  Plus,
  SpinnerGap as Loader2,
  Trash,
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ReportTemplate, ScheduledReport } from "@/lib/reporting/types";
import { formatCadence, formatReportDateTime } from "@/lib/reporting/utils";

export function ScheduledReportsTable({
  reports,
  templates,
  isLoading,
  updatingId,
  onToggleActive,
  onEdit,
  onDelete,
  onCreate,
}: {
  reports: ScheduledReport[];
  templates: Map<string, ReportTemplate>;
  isLoading: boolean;
  updatingId: string | null;
  onToggleActive: (report: ScheduledReport, isActive: boolean) => void;
  onEdit: (report: ScheduledReport) => void;
  onDelete: (report: ScheduledReport) => void;
  onCreate: () => void;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/50 bg-repwell-sage-100/10 p-8 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-repwell-sage-100 to-repwell-teal-300/10">
          <Clock weight="duotone" className="h-7 w-7 text-repwell-teal-300" />
        </div>
        <h3 className="mb-2 text-lg font-medium">No Scheduled Reports</h3>
        <p className="mb-4 max-w-sm text-sm text-muted-foreground">
          Set up automated report delivery by email on a daily, weekly, or monthly basis.
        </p>
        <Button variant="outline" onClick={onCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create Schedule
        </Button>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Cadence</TableHead>
          <TableHead>Recipients</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Next / Last Run</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {reports.map((report) => {
          const template = templates.get(report.templateId);
          const isUpdating = updatingId === report.id;

          return (
            <TableRow key={report.id}>
              <TableCell>
                <div className="space-y-1">
                  <div className="font-medium text-heading">{report.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {template?.name || "Unknown template"}
                  </div>
                </div>
              </TableCell>
              <TableCell className="min-w-[180px]">{formatCadence(report)}</TableCell>
              <TableCell>
                <Badge variant="secondary" className="gap-1">
                  <EnvelopeSimple className="h-3 w-3" />
                  {report.recipients.length}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={report.isActive}
                    disabled={isUpdating}
                    onCheckedChange={(checked) => onToggleActive(report, checked)}
                    aria-label={`${report.name} active status`}
                  />
                  <span className="text-sm text-muted-foreground">
                    {report.isActive ? "Active" : "Paused"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-1 text-sm">
                  <div>{formatReportDateTime(report.nextRunAt)}</div>
                  <div className="text-xs text-muted-foreground">
                    Last: {formatReportDateTime(report.lastRunAt)}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(report)}
                    disabled={isUpdating}
                    aria-label={`Edit ${report.name}`}
                  >
                    <PencilSimple className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(report)}
                    disabled={isUpdating}
                    aria-label={`Delete ${report.name}`}
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
