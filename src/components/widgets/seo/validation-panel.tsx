"use client";

import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  RefreshCw,
  Sparkles,
  Lightbulb,
  Loader2,
} from "lucide-react";
import {
  applyQuickFix,
  type WidgetSeoData,
} from "@/lib/widgets/seo-actions";
import type {
  ValidationIssue,
  ValidationSeverity,
} from "@/lib/widgets/seo-validation";
import { recommendSchemaType } from "@/lib/widgets/seo-validation";

interface ValidationPanelProps {
  data: WidgetSeoData;
  configId: string;
  onRevalidate: () => void;
  onDataUpdate?: (data: WidgetSeoData) => void;
}

const SEVERITY_CONFIG: Record<
  ValidationSeverity,
  { icon: typeof XCircle; color: string; bgColor: string; label: string }
> = {
  error: {
    icon: XCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    label: "Error",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    label: "Warning",
  },
  info: {
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    label: "Info",
  },
};

function IssueRow({
  issue,
  onApplyFix,
  isApplying,
}: {
  issue: ValidationIssue;
  onApplyFix?: (field: string, value: unknown) => void;
  isApplying?: boolean;
}) {
  const config = SEVERITY_CONFIG[issue.severity];
  const Icon = config.icon;

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg ${config.bgColor} border border-transparent`}
    >
      <Icon size={16} className={`${config.color} mt-0.5 shrink-0`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <code className="text-xs font-mono text-muted-foreground">
            {issue.field}
          </code>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0 ${config.color} border-current`}
          >
            {config.label}
          </Badge>
        </div>
        <p className="text-sm text-foreground">{issue.message}</p>
        {issue.fix && (
          <div className="mt-2 flex items-center gap-2">
            <Sparkles size={12} className="text-repwell-teal-300" />
            <span className="text-xs text-repwell-teal-400 font-medium">
              {issue.fix.label}
            </span>
            {onApplyFix && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs ml-1"
                disabled={isApplying}
                onClick={() =>
                  onApplyFix(issue.fix!.field, issue.fix!.suggestedValue)
                }
              >
                {isApplying ? (
                  <Loader2 size={12} className="animate-spin mr-1" />
                ) : null}
                Apply
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export function ValidationPanel({
  data,
  configId,
  onRevalidate,
  onDataUpdate,
}: ValidationPanelProps) {
  const { validation } = data;
  const recommendation = recommendSchemaType(data.entityType);
  const [isApplying, startApplyTransition] = useTransition();
  const [applyingField, setApplyingField] = useState<string | null>(null);

  const handleApplyFix = (field: string, value: unknown) => {
    setApplyingField(field);
    startApplyTransition(async () => {
      const result = await applyQuickFix(configId, field, value);
      setApplyingField(null);
      if (result.success && onDataUpdate) {
        onDataUpdate(result.data);
      } else {
        // Revalidate to show updated state
        onRevalidate();
      }
    });
  };

  const statusIcon = validation.valid ? (
    <CheckCircle2 size={20} className="text-emerald-600" />
  ) : (
    <XCircle size={20} className="text-red-600" />
  );

  const statusText = validation.valid
    ? "Structured data is valid"
    : `${validation.errors} error${validation.errors !== 1 ? "s" : ""} found`;

  const errors = validation.issues.filter((i) => i.severity === "error");
  const warnings = validation.issues.filter((i) => i.severity === "warning");
  const infos = validation.issues.filter((i) => i.severity === "info");

  return (
    <div className="space-y-4">
      {/* Status header */}
      <Card className="border-border bg-white">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {statusIcon}
              <div>
                <p className="text-sm font-semibold text-repwell-teal-500">
                  {statusText}
                </p>
                <p className="text-xs text-muted-foreground">
                  {validation.errors} error{validation.errors !== 1 ? "s" : ""},{" "}
                  {validation.warnings} warning
                  {validation.warnings !== 1 ? "s" : ""},{" "}
                  {infos.length} suggestion{infos.length !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={onRevalidate}
            >
              <RefreshCw size={14} />
              Revalidate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Schema recommendation */}
      {data.schemaType !== recommendation.type && (
        <Card className="border-repwell-sage-200/50 bg-repwell-sage-100/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Lightbulb
                size={16}
                className="text-repwell-teal-300 mt-0.5 shrink-0"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-repwell-teal-500">
                  Schema type recommendation
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Consider using{" "}
                  <strong className="text-repwell-teal-400">
                    {recommendation.type}
                  </strong>{" "}
                  instead of{" "}
                  <strong className="text-muted-foreground">
                    {data.schemaType}
                  </strong>
                  . {recommendation.reason}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 h-7 text-xs gap-1.5"
                  disabled={isApplying}
                  onClick={() =>
                    handleApplyFix("structured_data_type", recommendation.type)
                  }
                >
                  {isApplying && applyingField === "structured_data_type" ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Sparkles size={12} />
                  )}
                  Apply recommendation
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Issues list */}
      {validation.issues.length === 0 ? (
        <Card className="border-border bg-white">
          <CardContent className="py-12 flex flex-col items-center text-center">
            <CheckCircle2 size={32} className="text-emerald-600 mb-3" />
            <p className="text-sm font-medium text-repwell-teal-500">
              All checks passed
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Your structured data meets all schema.org validation rules.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {errors.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-red-600">
                Errors ({errors.length})
              </h3>
              {errors.map((issue, i) => (
                <IssueRow
                  key={`err-${i}`}
                  issue={issue}
                  onApplyFix={issue.fix ? handleApplyFix : undefined}
                  isApplying={
                    isApplying && applyingField === issue.fix?.field
                  }
                />
              ))}
            </div>
          )}

          {warnings.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                Warnings ({warnings.length})
              </h3>
              {warnings.map((issue, i) => (
                <IssueRow
                  key={`warn-${i}`}
                  issue={issue}
                  onApplyFix={issue.fix ? handleApplyFix : undefined}
                  isApplying={
                    isApplying && applyingField === issue.fix?.field
                  }
                />
              ))}
            </div>
          )}

          {infos.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                Suggestions ({infos.length})
              </h3>
              {infos.map((issue, i) => (
                <IssueRow key={`info-${i}`} issue={issue} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
