"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Lightbulb,
  Warning as AlertTriangle,
  CheckSquare,
  TrendUp as TrendingUp,
} from "@phosphor-icons/react";
import type { ImprovementRecommendation } from "@/lib/ai";
import { cn } from "@/lib/utils";

interface RecommendationsCardProps {
  data: ImprovementRecommendation[];
}

const priorityConfig = {
  high: {
    badge: "bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400",
    icon: AlertTriangle,
    label: "High Priority",
  },
  medium: {
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400",
    icon: Lightbulb,
    label: "Medium Priority",
  },
  low: {
    badge: "bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400",
    icon: CheckSquare,
    label: "Opportunity",
  },
};

export function RecommendationsCard({ data }: RecommendationsCardProps) {
  if (data.length === 0) {
    return (
      <Card className="border border-border shadow-soft">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
              <Lightbulb className="h-5 w-5 text-repwell-teal-300" />
            </div>
            <div>
              <CardTitle className="text-lg">Improvement Recommendations</CardTitle>
              <CardDescription>AI-powered suggestions based on customer feedback</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <Lightbulb className="h-7 w-7 text-repwell-teal-300" />
              </div>
              <p className="text-sm font-medium text-heading">No recommendations available</p>
              <p className="mt-1 text-xs">Collect more feedback to generate suggestions</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort by priority
  const sortedData = [...data].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <Card className="border border-border shadow-soft">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
            <Lightbulb className="h-5 w-5 text-repwell-teal-300" />
          </div>
          <div>
            <CardTitle className="text-lg">Improvement Recommendations</CardTitle>
            <CardDescription>AI-powered suggestions based on customer feedback</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {sortedData.map((rec, index) => {
            const config = priorityConfig[rec.priority];
            const Icon = config.icon;

            return (
              <AccordionItem
                key={rec.id}
                value={rec.id}
                className={cn(
                  index === 0 && "border-t-0"
                )}
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-1 items-center gap-3 text-left">
                    <Icon className={cn(
                      "h-4 w-4 flex-shrink-0",
                      rec.priority === "high" && "text-red-600",
                      rec.priority === "medium" && "text-amber-600",
                      rec.priority === "low" && "text-green-600"
                    )} />
                    <span className="text-sm font-medium">{rec.title}</span>
                    <Badge variant="secondary" className={cn("ml-auto mr-2 text-xs", config.badge)}>
                      {config.label}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  <p className="text-sm text-muted-foreground">
                    {rec.description}
                  </p>

                  {/* Action items */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action Items</h5>
                    <ul className="space-y-1.5">
                      {rec.actionItems.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2 text-sm text-muted-foreground"
                        >
                          <CheckSquare className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-primary/50" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Meta info */}
                  <div className="flex flex-wrap gap-4 border-t pt-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Based on:</span>
                      <span>{rec.basedOn}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span>{rec.potentialImpact}</span>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
