"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Crown,
  TrendUp as TrendingUp,
  TrendDown as TrendingDown,
  Minus,
  Trophy,
} from "@phosphor-icons/react";
import { StatisticalSignificanceBadge } from "./statistical-significance-badge";
import type { ABTestResult, WinningMetric } from "@/lib/email-ab-testing/types";

interface VariantComparisonTableProps {
  results: ABTestResult[];
  winnerVariant: string | null;
  winningMetric: WinningMetric;
  confidenceLevel: number;
  minSampleSize: number;
  onDeclareWinner?: (variantId: string) => void;
}

export function VariantComparisonTable({
  results,
  winnerVariant,
  winningMetric,
  confidenceLevel,
  minSampleSize,
  onDeclareWinner,
}: VariantComparisonTableProps) {
  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No results data available yet
      </div>
    );
  }

  // Find control variant (variant A or first variant)
  const controlResult = results.find((r) => r.variant === "A") || results[0];
  const controlRate =
    winningMetric === "open_rate"
      ? controlResult.openRate
      : controlResult.clickRate;

  // Find the best performing variant
  const bestRate = Math.max(
    ...results.map((r) =>
      winningMetric === "open_rate" ? r.openRate : r.clickRate
    )
  );

  const formatPercentage = (rate: number) => `${(rate * 100).toFixed(2)}%`;

  const getUplift = (rate: number) => {
    if (controlRate === 0) return rate > 0 ? 100 : 0;
    return ((rate - controlRate) / controlRate) * 100;
  };

  const renderUplift = (rate: number, isControl: boolean) => {
    if (isControl) {
      return (
        <span className="text-muted-foreground flex items-center gap-1">
          <Minus className="h-3 w-3" />
          Baseline
        </span>
      );
    }

    const uplift = getUplift(rate);
    if (uplift > 0) {
      return (
        <span className="text-green-600 flex items-center gap-1">
          <TrendingUp className="h-3 w-3" />+{uplift.toFixed(1)}%
        </span>
      );
    } else if (uplift < 0) {
      return (
        <span className="text-red-600 flex items-center gap-1">
          <TrendingDown className="h-3 w-3" />
          {uplift.toFixed(1)}%
        </span>
      );
    }
    return (
      <span className="text-muted-foreground flex items-center gap-1">
        <Minus className="h-3 w-3" />
        0%
      </span>
    );
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Variant</TableHead>
          <TableHead className="text-right">Sent</TableHead>
          <TableHead className="text-right">Delivered</TableHead>
          <TableHead className="text-right">Opens</TableHead>
          <TableHead className="text-right">Clicks</TableHead>
          <TableHead className="text-right">
            {winningMetric === "open_rate" ? "Open Rate" : "Click Rate"}
          </TableHead>
          <TableHead className="text-right">Uplift</TableHead>
          <TableHead>Significance</TableHead>
          {onDeclareWinner && <TableHead>Action</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {results.map((result) => {
          const isWinner = result.variant === winnerVariant;
          const isControl = result.variant === "A" || result === controlResult;
          const rate =
            winningMetric === "open_rate" ? result.openRate : result.clickRate;
          const isBestRate = rate === bestRate && bestRate > 0;

          return (
            <TableRow
              key={result.variant}
              className={isWinner ? "bg-green-50 dark:bg-green-950/20" : ""}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">Variant {result.variant}</span>
                  {isWinner && (
                    <Badge
                      variant="default"
                      className="gap-1 bg-green-600 hover:bg-green-700"
                    >
                      <Crown className="h-3 w-3" />
                      Winner
                    </Badge>
                  )}
                  {isControl && !isWinner && (
                    <Badge variant="secondary">Control</Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {result.emailsSent.toLocaleString()}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {result.emailsDelivered.toLocaleString()}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {result.emailsOpened.toLocaleString()}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                {result.emailsClicked.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                <span
                  className={
                    isBestRate && results.length > 1
                      ? "text-green-600 font-semibold"
                      : ""
                  }
                >
                  {formatPercentage(rate)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                {renderUplift(rate, isControl)}
              </TableCell>
              <TableCell>
                {!isControl ? (
                  <StatisticalSignificanceBadge
                    pValue={result.pValue}
                    isSignificant={result.isStatisticallySignificant}
                    confidenceLevel={confidenceLevel}
                    sampleSize={result.emailsDelivered}
                    minSampleSize={minSampleSize}
                  />
                ) : (
                  <span className="text-muted-foreground text-sm">—</span>
                )}
              </TableCell>
              {onDeclareWinner && (
                <TableCell>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeclareWinner(result.variant)}
                    className="gap-1"
                  >
                    <Trophy className="h-3 w-3" />
                    Declare Winner
                  </Button>
                </TableCell>
              )}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
