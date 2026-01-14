"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Eye,
  Star,
  Hash,
  MessageSquare,
  List,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { SurveyPreview } from "@/components/surveys/survey-preview";
import {
  getSurveyTemplates,
  deleteSurveyTemplate,
  duplicateSurveyTemplate,
  toggleTemplateStatus,
  createFromDefaultTemplate,
} from "@/lib/surveys/actions";
import type { SurveyTemplate, Question } from "@/types/survey.types";
import { DEFAULT_TEMPLATES } from "@/types/survey.types";

export function SurveyTemplatesList() {
  const router = useRouter();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<SurveyTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [previewTemplate, setPreviewTemplate] = useState<SurveyTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    const result = await getSurveyTemplates();
    if (result.success && result.data) {
      setTemplates(result.data);
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to load templates",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Loading data on mount is intentional
    void loadTemplates();
  }, [loadTemplates]);

  const handleDuplicate = async (id: string) => {
    const result = await duplicateSurveyTemplate(id);
    if (result.success) {
      toast({
        title: "Template duplicated",
        description: "A copy of the template has been created.",
      });
      loadTemplates();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to duplicate template",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    const result = await deleteSurveyTemplate(deleteId);
    if (result.success) {
      toast({
        title: "Template deleted",
        description: "The template has been removed.",
      });
      setDeleteId(null);
      loadTemplates();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const result = await toggleTemplateStatus(id, !currentStatus);
    if (result.success) {
      toast({
        title: currentStatus ? "Template deactivated" : "Template activated",
        description: currentStatus
          ? "The template is now inactive."
          : "The template is now active and can be used.",
      });
      loadTemplates();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to update template status",
        variant: "destructive",
      });
    }
  };

  const handleCreateFromDefault = async (key: keyof typeof DEFAULT_TEMPLATES) => {
    const result = await createFromDefaultTemplate(key);
    if (result.success) {
      toast({
        title: "Template created",
        description: `"${DEFAULT_TEMPLATES[key].name}" has been created.`,
      });
      loadTemplates();
    } else {
      toast({
        title: "Error",
        description: result.error || "Failed to create template",
        variant: "destructive",
      });
    }
  };

  const getQuestionTypeIcon = (type: Question["type"]) => {
    switch (type) {
      case "rating":
        return <Star className="h-3 w-3" />;
      case "nps":
        return <Hash className="h-3 w-3" />;
      case "text":
        return <MessageSquare className="h-3 w-3" />;
      case "multiple_choice":
        return <List className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const getQuestionTypeCounts = (questions: Question[]) => {
    const counts: Record<string, number> = {};
    questions.forEach((q) => {
      counts[q.type] = (counts[q.type] || 0) + 1;
    });
    return counts;
  };

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-5 w-2/3 rounded bg-muted" />
              <div className="mt-2 h-4 w-full rounded bg-muted" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="h-4 w-1/4 rounded bg-muted" />
                <div className="flex gap-2">
                  <div className="h-6 w-16 rounded bg-muted" />
                  <div className="h-6 w-16 rounded bg-muted" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Create New Template Card */}
        <Card className="flex cursor-pointer flex-col items-center justify-center border-dashed hover:bg-accent/50">
          <Link href="/dashboard/surveys/new" className="flex h-full w-full flex-col items-center justify-center p-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-medium">Create New Template</h3>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Build a custom survey from scratch
            </p>
          </Link>
        </Card>

        {/* Template Cards */}
        {templates.map((template) => {
          const typeCounts = getQuestionTypeCounts(template.questions);

          return (
            <Card key={template.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      {template.name}
                    </CardTitle>
                    {template.description && (
                      <CardDescription className="mt-1 line-clamp-2">
                        {template.description}
                      </CardDescription>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setPreviewTemplate(template)}>
                        <Eye className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push(`/dashboard/surveys/${template.id}/edit`)}
                      >
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => template.id && handleDuplicate(template.id)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => template.id && handleToggleStatus(template.id, template.isActive)}
                      >
                        {template.isActive ? (
                          <>
                            <ToggleLeft className="mr-2 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <ToggleRight className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteId(template.id || null)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="flex-1 pb-2">
                {/* Status badges */}
                <div className="mb-3 flex flex-wrap gap-2">
                  <Badge variant={template.isActive ? "default" : "secondary"}>
                    {template.isActive ? "Active" : "Inactive"}
                  </Badge>
                  {template.isDefault && (
                    <Badge variant="outline">Default</Badge>
                  )}
                </div>

                {/* Question type breakdown */}
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">
                    {template.questions.length} question{template.questions.length !== 1 ? "s" : ""}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(typeCounts).map(([type, count]) => (
                      <div
                        key={type}
                        className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
                      >
                        {getQuestionTypeIcon(type as Question["type"])}
                        <span className="capitalize">{type.replace("_", " ")}</span>
                        <span className="text-muted-foreground">({count})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>

              <CardFooter className="pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push(`/dashboard/surveys/${template.id}/edit`)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Template
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {templates.length === 0 && (
        <div className="mt-8 space-y-8 text-center">
          <div>
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">No survey templates yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Create your first template to start collecting feedback
            </p>
            <Button asChild className="mt-4">
              <Link href="/dashboard/surveys/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Link>
            </Button>
          </div>

          <div className="mx-auto max-w-2xl">
            <h4 className="mb-4 text-sm font-medium text-muted-foreground">
              Or start with a pre-built template
            </h4>
            <div className="grid gap-4 sm:grid-cols-3">
              {Object.entries(DEFAULT_TEMPLATES).map(([key, template]) => (
                <Card key={key} className="cursor-pointer hover:bg-accent/50">
                  <CardContent className="p-4">
                    <h5 className="font-medium">{template.name}</h5>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {template.questions.length} questions
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full"
                      onClick={() => handleCreateFromDefault(key as keyof typeof DEFAULT_TEMPLATES)}
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Preview Dialog */}
      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Survey Preview</DialogTitle>
            <DialogDescription>
              This is how your survey will appear to respondents
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="max-h-[70vh] overflow-y-auto">
              <SurveyPreview survey={previewTemplate} />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Template</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this survey template? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
