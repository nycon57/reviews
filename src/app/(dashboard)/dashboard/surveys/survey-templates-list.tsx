"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  FileText,
  DotsThree as MoreHorizontal,
  PencilSimple as Edit,
  Copy,
  Trash as Trash2,
  Eye,
  Star,
  Hash,
  Chats as MessageSquare,
  List,
  ToggleLeft,
  ToggleRight,
  MagnifyingGlass,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [previewTemplate, setPreviewTemplate] =
    useState<SurveyTemplate | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

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

  const filteredTemplates = useMemo(() => {
    let result = templates;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q)
      );
    }
    if (statusFilter === "active") {
      result = result.filter((t) => t.isActive);
    } else if (statusFilter === "inactive") {
      result = result.filter((t) => !t.isActive);
    }
    return result;
  }, [templates, searchQuery, statusFilter]);

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

  const handleCreateFromDefault = async (
    key: keyof typeof DEFAULT_TEMPLATES
  ) => {
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
      <Card className="border border-border shadow-soft overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
              <div className="h-5 w-48 rounded bg-muted animate-pulse" />
            </div>
            <div className="h-9 w-36 rounded bg-muted animate-pulse" />
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4 p-4 animate-pulse">
                <div className="h-10 w-10 rounded-full bg-muted shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-1/3 rounded bg-muted" />
                  <div className="h-3 w-2/3 rounded bg-muted" />
                </div>
                <div className="h-6 w-16 rounded bg-muted" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border border-border shadow-soft overflow-hidden">
        {/* Gradient Header */}
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <CardTitle className="text-lg">
                Survey Templates ({templates.length})
              </CardTitle>
            </div>
            <Button asChild size="sm">
              <Link href="/dashboard/surveys/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Template
              </Link>
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                aria-label="Search survey templates"
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as "all" | "active" | "inactive")}
            >
              <SelectTrigger className="h-9 w-[140px]" aria-label="Filter survey templates by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template List */}
          {filteredTemplates.length > 0 ? (
            <div className="divide-y rounded-lg border border-border/50 overflow-hidden">
              {filteredTemplates.map((template) => {
                const typeCounts = getQuestionTypeCounts(template.questions);

                return (
                  <div
                    key={template.id}
                    className="flex gap-4 p-4 transition-colors hover:bg-muted/50"
                  >
                    {/* Icon */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 shrink-0">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">
                              {template.name}
                            </span>
                            <span className="text-xs text-muted-foreground shrink-0">
                              {template.questions.length} question
                              {template.questions.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          {template.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {template.description}
                            </p>
                          )}
                        </div>

                        {/* Right side: badges + actions */}
                        <div className="flex items-center gap-2 shrink-0">
                          {/* Question type chips */}
                          <div className="hidden sm:flex items-center gap-1">
                            {Object.entries(typeCounts).map(([type, count]) => (
                              <div
                                key={type}
                                className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
                              >
                                {getQuestionTypeIcon(
                                  type as Question["type"]
                                )}
                                <span>{count}</span>
                              </div>
                            ))}
                          </div>

                          {/* Status badges */}
                          <Badge
                            variant="outline"
                            className={
                              template.isActive
                                ? "border-green-700 text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30"
                                : "border-border text-muted-foreground"
                            }
                          >
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {template.isDefault && (
                            <Badge variant="outline">Default</Badge>
                          )}

                          {/* Actions dropdown */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                aria-label={`Actions for ${template.name}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setPreviewTemplate(template)}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                Preview
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  router.push(
                                    `/dashboard/surveys/${template.id}/edit`
                                  )
                                }
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() =>
                                  template.id && handleDuplicate(template.id)
                                }
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                Duplicate
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() =>
                                  template.id &&
                                  handleToggleStatus(
                                    template.id,
                                    template.isActive
                                  )
                                }
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
                                onClick={() =>
                                  setDeleteId(template.id || null)
                                }
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : templates.length > 0 ? (
            /* Filtered to empty */
            <div className="relative flex flex-col items-center justify-center py-16 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-repwell-sage-100/40 via-repwell-sage-200/20 to-repwell-teal-300/10" />
              <div className="relative">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-repwell-sage-100 to-repwell-sage-200/50">
                  <MagnifyingGlass className="h-7 w-7 text-repwell-teal-400 dark:text-repwell-sage-100/80" />
                </div>
                <p className="font-medium text-heading-accent">
                  No templates match your filters
                </p>
                <p className="mt-1 text-sm text-repwell-teal-300">
                  Try adjusting your search or status filter
                </p>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Empty state — no templates at all */}
      {templates.length === 0 && (
        <div className="mt-8 space-y-8 text-center">
          <div>
            <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium">
              No survey templates yet
            </h3>
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
                      onClick={() =>
                        handleCreateFromDefault(
                          key as keyof typeof DEFAULT_TEMPLATES
                        )
                      }
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
      <Dialog
        open={!!previewTemplate}
        onOpenChange={() => setPreviewTemplate(null)}
      >
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
              Are you sure you want to delete this survey template? This action
              cannot be undone.
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
