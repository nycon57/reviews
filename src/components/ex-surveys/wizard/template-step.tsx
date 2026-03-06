"use client";

import { Badge } from "@/components/ui/badge";
import {
  Users,
  Lightning as Zap,
  SignOut as LogOut,
  UserPlus,
  ClipboardText,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { StepProps } from "./types";
import { EXSurveyType } from "@/types/ex-survey.types";

// Icon mapping for survey types
const templateIcons: Record<EXSurveyType | string, React.ReactNode> = {
  engagement: <Users className="h-6 w-6" />,
  pulse: <Zap className="h-6 w-6" />,
  exit: <LogOut className="h-6 w-6" />,
  onboarding: <UserPlus className="h-6 w-6" />,
  custom: <ClipboardText className="h-6 w-6" />,
};

export function TemplateStep({ formData, setFormData, templates }: StepProps) {
  const handleSelectTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);

    setFormData((prev) => ({
      ...prev,
      templateId,
      // Auto-fill name and description from template
      name: template ? `${template.name} - ${format(new Date(), "MMM yyyy")}` : prev.name,
      description: template?.description || prev.description,
    }));
  };

  return (
    <div className="space-y-6">
      {/* Section header */}
      <div>
        <h2 className="font-display text-2xl font-bold text-heading">
          Choose a Template
        </h2>
        <p className="mt-1 text-label">
          Select the type of employee survey you want to create
        </p>
      </div>

      {/* Template grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const isSelected = formData.templateId === template.id;
          const Icon = templateIcons[template.surveyType] || templateIcons.custom;

          return (
            <button
              key={template.id}
              type="button"
              onClick={() => handleSelectTemplate(template.id)}
              className={cn(
                "group relative flex flex-col items-start rounded-xl border bg-card p-6 text-left transition-all duration-200",
                "hover:shadow-md hover:border-repwell-teal-300/50",
                isSelected
                  ? "border-repwell-teal-300 ring-2 ring-repwell-teal-300/20 shadow-md"
                  : "border-border"
              )}
            >
              {/* Icon and badge */}
              <div className="flex w-full items-start justify-between">
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl transition-colors",
                    isSelected
                      ? "bg-repwell-teal-300 text-white"
                      : "bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 text-label group-hover:bg-repwell-sage-100 dark:hover:bg-repwell-teal-300/10 dark:group-hover:bg-repwell-teal-300/10"
                  )}
                >
                  {Icon}
                </div>
                {isSelected && (
                  <Badge className="bg-repwell-teal-300 text-white">Selected</Badge>
                )}
              </div>

              {/* Template info */}
              <div className="mt-4">
                <h3 className="font-sans text-lg font-semibold text-heading">
                  {template.name}
                </h3>
                <p className="mt-1 text-sm text-label line-clamp-2">
                  {template.description}
                </p>
              </div>

              {/* Metadata */}
              <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{template.questions.length} questions</span>
                {template.estimatedTimeMinutes && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                    <span>~{template.estimatedTimeMinutes} min</span>
                  </>
                )}
              </div>

              {/* Survey type badge */}
              <div className="mt-3">
                <Badge variant="outline" className="capitalize text-xs">
                  {template.surveyType}
                </Badge>
              </div>
            </button>
          );
        })}
      </div>

      {templates.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center">
          <ClipboardText className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 font-semibold text-heading">No templates found</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a template first to get started with surveys.
          </p>
        </div>
      )}
    </div>
  );
}
