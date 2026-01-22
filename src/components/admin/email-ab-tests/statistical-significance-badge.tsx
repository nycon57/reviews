"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";

interface StatisticalSignificanceBadgeProps {
  pValue: number | null;
  isSignificant: boolean;
  confidenceLevel: number;
  sampleSize: number;
  minSampleSize: number;
}

export function StatisticalSignificanceBadge({
  pValue,
  isSignificant,
  confidenceLevel,
  sampleSize,
  minSampleSize,
}: StatisticalSignificanceBadgeProps) {
  const hasSufficientData = sampleSize >= minSampleSize;

  if (!hasSufficientData) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="secondary" className="gap-1">
              <Clock className="h-3 w-3" />
              Collecting Data
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              Need {minSampleSize - sampleSize} more emails delivered to reach
              minimum sample size of {minSampleSize}.
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Convert decimal to percentage if needed (0.95 -> 95)
  const displayConfidence = confidenceLevel < 1 ? confidenceLevel * 100 : confidenceLevel;

  if (isSignificant) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge
              variant="default"
              className="gap-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-3 w-3" />
              Significant ({displayConfidence.toFixed(0)}% CI)
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              The difference is statistically significant at the{" "}
              {displayConfidence.toFixed(0)}% confidence level.
              {pValue !== null && (
                <>
                  <br />
                  p-value: {pValue.toFixed(4)}
                </>
              )}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Calculate alpha (significance threshold) from confidence level
  const alpha = confidenceLevel < 1 ? (1 - confidenceLevel) : (1 - confidenceLevel / 100);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Not Significant
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">
            The difference is not statistically significant yet. Continue
            collecting more data.
            {pValue !== null && (
              <>
                <br />
                p-value: {pValue.toFixed(4)} (need &lt;{" "}
                {alpha.toFixed(2)})
              </>
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
