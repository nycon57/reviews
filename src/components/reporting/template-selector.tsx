"use client";

import * as React from "react";
import { FileBarChart, Users, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ReportTemplate } from "@/lib/reporting/types";

interface TemplateSelectorProps {
  templates: ReportTemplate[];
  selectedId?: string;
  onSelect: (template: ReportTemplate) => void;
  className?: string;
}

const templateIcons: Record<string, React.ReactNode> = {
  monthly_performance: <FileBarChart className="h-5 w-5" />,
  team_summary: <Users className="h-5 w-5" />,
  custom: <Plus className="h-5 w-5" />,
};

export function TemplateSelector({
  templates,
  selectedId,
  onSelect,
  className,
}: TemplateSelectorProps) {
  return (
    <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
      {templates.map((template) => {
        const isSelected = template.id === selectedId;
        return (
          <Card
            key={template.id}
            className={cn(
              "cursor-pointer transition-all hover:border-primary/50",
              isSelected && "border-primary ring-2 ring-primary/20"
            )}
            onClick={() => onSelect(template)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "rounded-md p-2",
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {templateIcons[template.templateType] || templateIcons.custom}
                  </div>
                  <div>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    {template.isDefault && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        Default
                      </Badge>
                    )}
                  </div>
                </div>
                {isSelected && (
                  <div className="rounded-full bg-primary p-1 text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="line-clamp-2 text-sm">
                {template.description || "Custom report template"}
              </CardDescription>
              <div className="mt-3 flex flex-wrap gap-1">
                {template.config.sections.slice(0, 3).map((section) => (
                  <Badge key={section} variant="outline" className="text-xs capitalize">
                    {section.replace(/_/g, " ")}
                  </Badge>
                ))}
                {template.config.sections.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{template.config.sections.length - 3} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
