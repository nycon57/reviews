"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SurveyPreview } from "./survey-preview";
import type { SurveyTemplate } from "@/types/survey.types";
import type { ReactNode } from "react";

interface TemplatePreviewModalProps {
  template: SurveyTemplate | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  /** Render extra metadata between header and preview */
  renderHeader?: (template: SurveyTemplate) => ReactNode;
}

export function TemplatePreviewModal({
  template,
  open,
  onOpenChange,
  title = "Survey Preview",
  description = "This is how your survey will appear to respondents",
  renderHeader,
}: TemplatePreviewModalProps) {
  if (!template) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {renderHeader?.(template)}
        <div className="max-h-[70vh] overflow-y-auto">
          <SurveyPreview survey={template} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
