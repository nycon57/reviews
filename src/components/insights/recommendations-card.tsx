"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Lightbulb, AlertTriangle, CheckSquare, TrendingUp } from "lucide-react";
import type { ImprovementRecommendation } from "@/lib/ai";
import { cn } from "@/lib/utils";

interface RecommendationsCardProps {
  data: ImprovementRecommendation[];
}

const priorityConfig = {
  high: {
    badge: "bg-red-100 text-red-800",
    icon: AlertTriangle,
    label: "High Priority",
  },
  medium: {
    badge: "bg-amber-100 text-amber-800",
    icon: Lightbulb,
    label: "Medium Priority",
  },
  low: {
    badge: "bg-green-100 text-green-800",
    icon: CheckSquare,
    label: "Opportunity",
  },
};

export function RecommendationsCard({ data }: RecommendationsCardProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-semibold">Improvement Recommendations</CardTitle>
          </div>
          <CardDescription>AI-powered suggestions based on customer feedback</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Lightbulb className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="text-sm">No recommendations available</p>
              <p className="text-xs">Collect more feedback to generate suggestions</p>
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
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">Improvement Recommendations</CardTitle>
        </div>
        <CardDescription>AI-powered suggestions based on customer feedback</CardDescription>
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
                    <span className="font-medium">{rec.title}</span>
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
                    <h5 className="text-sm font-medium">Action Items</h5>
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
