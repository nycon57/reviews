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
              Significant ({confidenceLevel}% CI)
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p className="max-w-xs">
              The difference is statistically significant at the{" "}
              {confidenceLevel}% confidence level.
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
                {(1 - confidenceLevel / 100).toFixed(2)})
              </>
            )}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
