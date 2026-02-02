"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  EyeOff,
  Search,
  ChevronRight,
} from "lucide-react";
import type { BulkValidationReport } from "@/lib/widgets/seo-actions";
import type { WidgetValidationStatus } from "@/lib/widgets/seo-validation";

interface BulkValidationProps {
  report: BulkValidationReport | null;
  isLoading: boolean;
  onSelectWidget: (configId: string) => void;
}

const STATUS_CONFIG: Record<
  WidgetValidationStatus,
  {
    icon: typeof CheckCircle2;
    label: string;
    variant: "success" | "highlight" | "destructive";
  }
> = {
  valid: { icon: CheckCircle2, label: "Valid", variant: "success" },
  warnings: { icon: AlertTriangle, label: "Warnings", variant: "highlight" },
  errors: { icon: XCircle, label: "Errors", variant: "destructive" },
};

export function BulkValidation({
  report,
  isLoading,
  onSelectWidget,
}: BulkValidationProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredWidgets = (report?.widgets ?? []).filter((w) => {
    const matchesSearch =
      !search ||
      w.widgetName.toLowerCase().includes(search.toLowerCase()) ||
      w.widgetId.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "disabled" && !w.structuredDataEnabled) ||
      (statusFilter !== "disabled" &&
        w.structuredDataEnabled &&
        w.status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <Card className="border-border bg-white">
        <CardContent className="p-0">
          <div className="p-4 border-b border-border">
            <Skeleton className="h-9 w-full max-w-sm" />
          </div>
          <div className="space-y-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="px-4 py-3 border-b border-border last:border-0"
              >
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border bg-white overflow-hidden">
      <CardContent className="p-0">
        {/* Filters */}
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              placeholder="Search widgets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9"
            />
          </div>
          <div className="flex items-center gap-2">
            {["all", "valid", "warnings", "errors", "disabled"].map((s) => (
              <Button
                key={s}
                variant={statusFilter === s ? "default" : "ghost"}
                size="sm"
                className="h-8 text-xs capitalize"
                onClick={() => setStatusFilter(s)}
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        {/* Table */}
        {filteredWidgets.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No widgets match the current filters.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Widget</TableHead>
                <TableHead>Schema Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Issues</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWidgets.map((widget) => {
                if (!widget.structuredDataEnabled) {
                  return (
                    <TableRow
                      key={widget.widgetId}
                      className="text-muted-foreground"
                    >
                      <TableCell>
                        <div>
                          <p className="text-sm font-medium">
                            {widget.widgetName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {widget.widgetType.replace(/_/g, " ")} &middot;{" "}
                            {widget.entityType}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs">&ndash;</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <EyeOff size={14} />
                          <span className="text-xs">Disabled</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-xs">
                        &ndash;
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  );
                }

                const statusCfg = STATUS_CONFIG[widget.status];
                const StatusIcon = statusCfg.icon;

                return (
                  <TableRow
                    key={widget.widgetId}
                    className="cursor-pointer hover:bg-repwell-sage-100/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-repwell-teal-300 focus-visible:ring-offset-1"
                    onClick={() => onSelectWidget(widget.configId)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectWidget(widget.configId);
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <TableCell>
                      <div>
                        <p className="text-sm font-medium text-repwell-teal-500">
                          {widget.widgetName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {widget.widgetType.replace(/_/g, " ")} &middot;{" "}
                          {widget.entityType}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs text-muted-foreground font-mono">
                        {widget.schemaType}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusCfg.variant} className="gap-1">
                        <StatusIcon size={12} />
                        {statusCfg.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-xs text-muted-foreground">
                        {widget.errorCount > 0 && (
                          <span className="text-red-600">
                            {widget.errorCount}E
                          </span>
                        )}
                        {widget.errorCount > 0 &&
                          widget.warningCount > 0 &&
                          " "}
                        {widget.warningCount > 0 && (
                          <span className="text-amber-600">
                            {widget.warningCount}W
                          </span>
                        )}
                        {widget.errorCount === 0 &&
                          widget.warningCount === 0 && (
                            <span className="text-emerald-600">None</span>
                          )}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ChevronRight
                        size={14}
                        className="text-muted-foreground"
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
