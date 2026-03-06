"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ClipboardText as ClipboardList,
  Users,
  Lightning as Zap,
  SignOut as LogOut,
  UserPlus,
  Plus,
  Eye,
  PencilSimple,
  Copy,
  Trash,
  Clock,
  DotsThreeVertical,
} from "@phosphor-icons/react";
import { TemplatePreviewModal } from "@/components/ex-surveys";
import { deleteEXSurveyTemplate, duplicateEXSurveyTemplate } from "@/lib/ex-surveys/actions";
import type { EXSurveyTemplate } from "@/types/ex-survey.types";

interface TemplatesListClientProps {
  templates: EXSurveyTemplate[];
}

const templateIcons: Record<string, React.ReactNode> = {
  engagement: <Users weight="duotone" className="h-6 w-6" />,
  pulse: <Zap weight="duotone" className="h-6 w-6" />,
  exit: <LogOut weight="duotone" className="h-6 w-6" />,
  onboarding: <UserPlus weight="duotone" className="h-6 w-6" />,
};

const templateColors: Record<string, string> = {
  engagement: "bg-blue-100 text-blue-600",
  pulse: "bg-green-100 text-green-600",
  exit: "bg-orange-100 text-orange-600",
  onboarding: "bg-purple-100 text-purple-600",
};

export function TemplatesListClient({ templates }: TemplatesListClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [previewTemplate, setPreviewTemplate] = useState<EXSurveyTemplate | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<EXSurveyTemplate | null>(null);

  const handleDuplicate = async (template: EXSurveyTemplate) => {
    startTransition(async () => {
      try {
        const result = await duplicateEXSurveyTemplate(template.id);
        if (result.data) {
          router.refresh();
          toast({
            title: "Template Duplicated",
            description: `"${template.name}" has been duplicated successfully.`,
          });
        } else {
          toast({
            title: "Duplication Failed",
            description: result.error || "Failed to duplicate template. Please try again.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Failed to duplicate template:", error);
        toast({
          title: "Duplication Failed",
          description: error instanceof Error ? error.message : "An unexpected error occurred.",
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = async () => {
    if (!deleteTemplate) return;

    startTransition(async () => {
      try {
        const result = await deleteEXSurveyTemplate(deleteTemplate.id);
        if (result.success) {
          setDeleteTemplate(null);
          router.refresh();
          toast({
            title: "Template Deleted",
            description: `"${deleteTemplate.name}" has been deleted.`,
          });
        } else {
          console.error("Failed to delete template:", result.error);
          toast({
            title: "Deletion Failed",
            description: result.error || "Failed to delete template. Please try again.",
            variant: "destructive",
          });
          // Keep dialog open so user can retry or cancel
        }
      } catch (error) {
        console.error("Failed to delete template:", error);
        toast({
          title: "Deletion Failed",
          description: error instanceof Error ? error.message : "An unexpected error occurred.",
          variant: "destructive",
        });
        // Keep dialog open so user can retry or cancel
      }
    });
  };

  const getEstimatedTime = (template: EXSurveyTemplate) => {
    return template.estimatedTimeMinutes || Math.ceil(template.questions.length * 0.5 + 1);
  };

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.id} className="overflow-hidden border border-border transition-all hover:shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className={`rounded-lg p-2 ${templateColors[template.surveyType] || "bg-muted text-muted-foreground"}`}>
                  {templateIcons[template.surveyType] || <ClipboardList weight="duotone" className="h-6 w-6" />}
                </div>
                <div className="flex items-center gap-2">
                  {template.isDefault && (
                    <Badge variant="secondary" className="bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 text-label">
                      Default
                    </Badge>
                  )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`Actions for ${template.name}`}
                        >
                          <DotsThreeVertical weight="bold" className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPreviewTemplate(template)}>
                        <Eye weight="regular" className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(template)} disabled={isPending}>
                        <Copy weight="regular" className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      {!template.isDefault && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/ex-surveys/templates/${template.id}/edit`}>
                              <PencilSimple weight="regular" className="mr-2 h-4 w-4" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setDeleteTemplate(template)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash weight="regular" className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <CardTitle className="mt-3 font-display text-lg text-heading">
                {template.name}
              </CardTitle>
              <CardDescription className="font-sans text-label">
                {template.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex flex-wrap items-center gap-3 text-sm font-sans text-muted-foreground">
                <Badge variant="outline" className="capitalize">
                  {template.surveyType}
                </Badge>
                <span className="flex items-center gap-1">
                  <ClipboardList weight="regular" className="h-3.5 w-3.5" />
                  {template.questions.length} questions
                </span>
                <span className="flex items-center gap-1">
                  <Clock weight="regular" className="h-3.5 w-3.5" />
                  ~{getEstimatedTime(template)} min
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2 pt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPreviewTemplate(template)}
                className="flex-1"
              >
                <Eye weight="regular" className="mr-1.5 h-4 w-4" />
                Preview
              </Button>
              <Button asChild size="sm" className="flex-1 bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white">
                <Link href={`/dashboard/ex-surveys/create?template=${template.id}`}>
                  <Plus weight="bold" className="mr-1.5 h-4 w-4" />
                  Use Template
                </Link>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Preview Modal */}
      <TemplatePreviewModal
        template={previewTemplate}
        open={!!previewTemplate}
        onOpenChange={(open) => !open && setPreviewTemplate(null)}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTemplate} onOpenChange={(open) => !open && setDeleteTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-heading">
              Delete Template
            </AlertDialogTitle>
            <AlertDialogDescription className="font-sans text-label">
              Are you sure you want to delete &quot;{deleteTemplate?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
