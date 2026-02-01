"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  getAbTestResults,
  type AbTestSummary,
} from "@/lib/widgets/ab-testing";
import type { ConfidenceLevel } from "@/lib/widgets/ab-statistics";
import { DeclareWinnerDialog } from "./declare-winner-dialog";
import { CancelTestDialog } from "./cancel-test-dialog";

interface AbTestResultsProps {
  parentWidgetId: string;
}

function confidenceBadge(level: ConfidenceLevel) {
  const map: Record<ConfidenceLevel, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    not_enough_data: { label: "Not enough data", variant: "outline" },
    no_significance: { label: "No significance", variant: "secondary" },
    "90_confident": { label: "90% confident", variant: "secondary" },
    "95_confident": { label: "95% confident", variant: "default" },
    "99_confident": { label: "99% confident", variant: "default" },
  };
  const { label, variant } = map[level];
  return <Badge variant={variant}>{label}</Badge>;
}

function MetricCard({
  label,
  variantA,
  variantB,
  format = "number",
}: {
  label: string;
  variantA: number;
  variantB: number;
  format?: "number" | "percent";
}) {
  const diff = variantA === 0 ? 0 : ((variantB - variantA) / variantA) * 100;
  const diffFormatted =
    diff > 0 ? `+${diff.toFixed(1)}%` : diff < 0 ? `${diff.toFixed(1)}%` : "0%";

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Original (A)</p>
          <p className="text-2xl font-semibold tabular-nums">
            {format === "percent" ? variantA.toFixed(2) + "%" : variantA.toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-1">Variant (B)</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-semibold tabular-nums">
              {format === "percent" ? variantB.toFixed(2) + "%" : variantB.toLocaleString()}
            </p>
            {variantA > 0 && (
              <span
                className={`text-sm font-medium ${
                  diff > 0
                    ? "text-emerald-600"
                    : diff < 0
                    ? "text-red-500"
                    : "text-muted-foreground"
                }`}
              >
                {diffFormatted}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AbTestResults({ parentWidgetId }: AbTestResultsProps) {
  const [data, setData] = useState<AbTestSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [, startTransition] = useTransition();

  const loadResults = useCallback(() => {
    startTransition(async () => {
      setLoading(true);
      const result = await getAbTestResults(parentWidgetId);
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error);
      }
      setLoading(false);
    });
  }, [parentWidgetId]);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Loading A/B test results...
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {error || "No A/B test data found."}
        </CardContent>
      </Card>
    );
  }

  const ctrA =
    data.variantA.impressions > 0
      ? (data.variantA.clicks / data.variantA.impressions) * 100
      : 0;
  const ctrB =
    data.variantB.impressions > 0
      ? (data.variantB.clicks / data.variantB.impressions) * 100
      : 0;

  const statusColor =
    data.status === "running"
      ? "bg-emerald-500"
      : data.status === "completed"
      ? "bg-blue-500"
      : "bg-gray-400";

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-lg">A/B Test Results</CardTitle>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className={`inline-block h-2 w-2 rounded-full ${statusColor}`} />
                <span className="capitalize">{data.status}</span>
                <span>&middot;</span>
                <span>{data.daysRunning} day{data.daysRunning !== 1 ? "s" : ""} running</span>
                <span>&middot;</span>
                <span>Split: {100 - data.splitPercent}/{data.splitPercent}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {confidenceBadge(data.significance.confidence)}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Variant Labels */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium">A: {data.parentWidgetName}</p>
              <p className="text-xs text-muted-foreground">Original &middot; {100 - data.splitPercent}% traffic</p>
            </div>
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium">B: {data.variantWidgetName}</p>
              <p className="text-xs text-muted-foreground">Variant &middot; {data.splitPercent}% traffic</p>
            </div>
          </div>

          <Separator />

          {/* Metrics Comparison */}
          <div className="space-y-6">
            <MetricCard
              label="Impressions"
              variantA={data.variantA.impressions}
              variantB={data.variantB.impressions}
            />
            <MetricCard
              label="Clicks"
              variantA={data.variantA.clicks}
              variantB={data.variantB.clicks}
            />
            <MetricCard
              label="Click-through Rate"
              variantA={ctrA}
              variantB={ctrB}
              format="percent"
            />
            <MetricCard
              label="Write Review Clicks"
              variantA={data.variantA.writeReviewClicks}
              variantB={data.variantB.writeReviewClicks}
            />
          </div>

          <Separator />

          {/* Statistical Significance */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Statistical Significance</p>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Chi-squared</p>
                <p className="font-mono">{data.significance.chiSquared}</p>
              </div>
              <div>
                <p className="text-muted-foreground">p-value</p>
                <p className="font-mono">{data.significance.pValue}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Est. days to 95%</p>
                <p className="font-mono">
                  {data.significance.estimatedDaysToSignificance ?? "—"}
                </p>
              </div>
            </div>

            {/* Confidence progress bar */}
            {data.significance.confidence !== "not_enough_data" && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Confidence</span>
                  <span>
                    {data.significance.confidence === "99_confident"
                      ? "99%+"
                      : data.significance.confidence === "95_confident"
                      ? "95-99%"
                      : data.significance.confidence === "90_confident"
                      ? "90-95%"
                      : "<90%"}
                  </span>
                </div>
                <Progress
                  value={
                    data.significance.confidence === "99_confident"
                      ? 100
                      : data.significance.confidence === "95_confident"
                      ? 80
                      : data.significance.confidence === "90_confident"
                      ? 60
                      : 30
                  }
                />
              </div>
            )}
          </div>

          {/* Actions */}
          {data.status === "running" && (
            <>
              <Separator />
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCancelDialog(true)}
                >
                  Cancel test
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowWinnerDialog(true)}
                >
                  Declare winner
                </Button>
              </div>
            </>
          )}

          {/* Completed status */}
          {data.status === "completed" && data.winnerId && (
            <>
              <Separator />
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
                <p className="font-medium text-emerald-800">
                  Winner:{" "}
                  {data.winnerId === data.parentWidgetId
                    ? `A (${data.parentWidgetName})`
                    : `B (${data.variantWidgetName})`}
                </p>
                {data.completedAt && (
                  <p className="text-emerald-600 text-xs mt-1">
                    Completed {new Date(data.completedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </>
          )}

          {data.status === "cancelled" && (
            <>
              <Separator />
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
                Test cancelled{" "}
                {data.completedAt
                  ? `on ${new Date(data.completedAt).toLocaleDateString()}`
                  : ""}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <DeclareWinnerDialog
        open={showWinnerDialog}
        onOpenChange={setShowWinnerDialog}
        testData={data}
        onDeclared={loadResults}
      />

      <CancelTestDialog
        open={showCancelDialog}
        onOpenChange={setShowCancelDialog}
        parentWidgetId={data.parentWidgetId}
        parentWidgetName={data.parentWidgetName}
        onCancelled={loadResults}
      />
    </>
  );
}
