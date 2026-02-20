"use client";

import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { SharedTemplateDetail } from "@/components/surveys/shared";
import type { TemplateDetailActions, TemplateDetailConfig } from "@/components/surveys/shared";
import {
  deleteSurveyTemplate,
  duplicateSurveyTemplate,
  toggleTemplateStatus,
} from "@/lib/surveys/actions";
import type { SurveyTemplate } from "@/types/survey.types";

interface SurveyTemplateDetailProps {
  template: SurveyTemplate;
}

export function SurveyTemplateDetail({ template }: SurveyTemplateDetailProps) {
  const router = useRouter();
  const { toast } = useToast();

  const config: TemplateDetailConfig = {
    backHref: "/dashboard/surveys",
    backLabel: "Back to templates",
    editHref: `/dashboard/surveys/${template.id}/edit`,
  };

  const actions: TemplateDetailActions = {
    onEdit: () => router.push(`/dashboard/surveys/${template.id}/edit`),
    onDuplicate: async () => {
      if (!template.id) return;
      const result = await duplicateSurveyTemplate(template.id);
      if (result.success) {
        toast({ title: "Template duplicated", description: "A copy of the template has been created." });
        router.push("/dashboard/surveys");
      } else {
        toast({ title: "Error", description: result.error || "Failed to duplicate template", variant: "destructive" });
      }
    },
    onDelete: async () => {
      if (!template.id) return;
      const result = await deleteSurveyTemplate(template.id);
      if (result.success) {
        toast({ title: "Template deleted", description: "The template has been removed." });
        router.push("/dashboard/surveys");
      } else {
        toast({ title: "Error", description: result.error || "Failed to delete template", variant: "destructive" });
      }
    },
    onToggleStatus: async () => {
      if (!template.id) return;
      const result = await toggleTemplateStatus(template.id, !template.isActive);
      if (result.success) {
        toast({
          title: template.isActive ? "Template deactivated" : "Template activated",
          description: template.isActive
            ? "The template is now inactive."
            : "The template is now active and can be used.",
        });
        router.refresh();
      } else {
        toast({ title: "Error", description: result.error || "Failed to update template status", variant: "destructive" });
      }
    },
    onPreview: () => {},
  };

  return (
    <SharedTemplateDetail
      template={template}
      config={config}
      actions={actions}
    />
  );
}
