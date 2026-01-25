"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { EXSurveyPreview } from "./ex-survey-preview";
import {
  ClipboardText,
  Clock,
  Eye,
  Users,
  UserCircle,
} from "@phosphor-icons/react";
import type { EXSurveyTemplate } from "@/types/ex-survey.types";

interface TemplatePreviewModalProps {
  template: EXSurveyTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const surveyTypeLabels: Record<string, string> = {
  engagement: "Engagement",
  pulse: "Pulse",
  exit: "Exit Interview",
  onboarding: "Onboarding",
  custom: "Custom",
};

const surveyTypeColors: Record<string, string> = {
  engagement: "bg-blue-100 text-blue-700",
  pulse: "bg-green-100 text-green-700",
  exit: "bg-orange-100 text-orange-700",
  onboarding: "bg-purple-100 text-purple-700",
  custom: "bg-gray-100 text-gray-700",
};

export function TemplatePreviewModal({
  template,
  open,
  onOpenChange,
}: TemplatePreviewModalProps) {
  if (!template) return null;

  const estimatedTime = template.estimatedTimeMinutes || Math.ceil(template.questions.length * 0.5 + 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <DialogTitle className="font-display text-xl font-bold text-repwell-teal-500">
                {template.name}
              </DialogTitle>
              {template.description && (
                <DialogDescription className="font-sans text-repwell-teal-400">
                  {template.description}
                </DialogDescription>
              )}
            </div>
            <Badge
              variant="secondary"
              className={surveyTypeColors[template.surveyType] || surveyTypeColors.custom}
            >
              {surveyTypeLabels[template.surveyType] || template.surveyType}
            </Badge>
          </div>

          {/* Template metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm font-sans text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <ClipboardText weight="regular" size={16} />
              <span>{template.questions.length} questions</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock weight="regular" size={16} />
              <span>~{estimatedTime} min</span>
            </div>
            {template.isAnonymous && (
              <div className="flex items-center gap-1.5">
                <UserCircle weight="regular" size={16} />
                <span>Anonymous</span>
              </div>
            )}
            {template.targetRoles && template.targetRoles.length > 0 && (
              <div className="flex items-center gap-1.5">
                <Users weight="regular" size={16} />
                <span>{template.targetRoles.join(", ")}</span>
              </div>
            )}
            {template.isDefault && (
              <Badge variant="outline" className="text-xs">
                Default Template
              </Badge>
            )}
          </div>
        </DialogHeader>

        {/* Preview indicator */}
        <div className="mt-2 mb-4 flex items-center justify-center gap-2 rounded-lg bg-repwell-sage-100/30 px-4 py-2 text-sm font-sans text-repwell-teal-400">
          <Eye weight="regular" size={16} />
          <span>Interactive preview - step through the survey to see how it will look</span>
        </div>

        {/* Survey Preview */}
        <div className="border-t border-border pt-6">
          <EXSurveyPreview
            template={template}
            embedded
            showPreviewBadge={false}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
