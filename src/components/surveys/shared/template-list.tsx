"use client";

import { useState } from "react";
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
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import { TemplatePreviewModal } from "./template-preview-modal";
import type { Question, SurveyTemplate } from "@/types/survey.types";
import type { TemplateListItem, TemplateListConfig, TemplateListActions } from "./types";
import type { ReactNode } from "react";

// ============================================================================
// Helpers
// ============================================================================

function getQuestionTypeIcon(type: Question["type"]) {
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
}

function getQuestionTypeCounts(questions: Question[]) {
  const counts: Record<string, number> = {};
  questions.forEach((q) => {
    counts[q.type] = (counts[q.type] || 0) + 1;
  });
  return counts;
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function TableSkeleton() {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Questions</TableHead>
            <TableHead>Type Breakdown</TableHead>
            <TableHead className="w-[70px]" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3].map((i) => (
            <TableRow key={i}>
              <TableCell>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="mt-1 h-4 w-56" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-8" />
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-14" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ============================================================================
// Shared Template List
// ============================================================================

interface SharedTemplateListProps {
  templates: TemplateListItem[];
  isLoading: boolean;
  config: TemplateListConfig;
  actions: TemplateListActions;
  /** Render extra metadata columns per-row */
  renderMetadata?: (template: TemplateListItem) => ReactNode;
  /** Render extra header for the preview modal */
  renderPreviewHeader?: (template: SurveyTemplate) => ReactNode;
}

export function SharedTemplateList({
  templates,
  isLoading,
  config,
  actions,
  renderMetadata,
  renderPreviewHeader,
}: SharedTemplateListProps) {
  const router = useRouter();
  const [previewTemplate, setPreviewTemplate] = useState<TemplateListItem | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return <TableSkeleton />;
  }

  if (templates.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-12">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">
            {config.emptyStateTitle || "No survey templates yet"}
          </h3>
          <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
            {config.emptyStateDescription || "Create your first template to start collecting feedback"}
          </p>
          <Button asChild className="mt-4">
            <Link href={config.createHref}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Link>
          </Button>
        </div>

        {config.defaultTemplates && config.defaultTemplates.length > 0 && (
          <div className="mx-auto max-w-2xl text-center">
            <h4 className="mb-4 text-sm font-medium text-muted-foreground">
              Or start with a pre-built template
            </h4>
            <div className="grid gap-4 sm:grid-cols-3">
              {config.defaultTemplates.map((dt) => (
                <Card key={dt.key} className="cursor-pointer hover:bg-accent/50">
                  <CardContent className="p-4">
                    <h5 className="font-medium">{dt.name}</h5>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {dt.description}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {dt.questionCount} questions
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 w-full"
                      onClick={dt.onUse}
                    >
                      Use Template
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </>
    );
  }

  const previewSurvey: SurveyTemplate | null = previewTemplate
    ? {
        id: previewTemplate.id,
        name: previewTemplate.name,
        description: previewTemplate.description,
        questions: previewTemplate.questions,
        isActive: previewTemplate.isActive,
        isDefault: previewTemplate.isDefault,
      }
    : null;

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Questions</TableHead>
              <TableHead className="hidden sm:table-cell">Type Breakdown</TableHead>
              {renderMetadata && <TableHead className="hidden md:table-cell">Details</TableHead>}
              <TableHead className="w-[70px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((template) => {
              const typeCounts = getQuestionTypeCounts(template.questions);

              return (
                <TableRow
                  key={template.id}
                  className="cursor-pointer"
                  onClick={() => router.push(config.detailHref(template.id))}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="hidden h-4 w-4 shrink-0 text-muted-foreground sm:block" />
                      <div className="min-w-0">
                        <div className="font-medium">{template.name}</div>
                        {template.description && (
                          <div className="truncate text-sm text-muted-foreground">
                            {template.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      <Badge variant={template.isActive ? "default" : "secondary"}>
                        {template.isActive ? "Active" : "Inactive"}
                      </Badge>
                      {template.isDefault && <Badge variant="outline">Default</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">
                      {template.questions.length}
                    </span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
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
                  </TableCell>
                  {renderMetadata && (
                    <TableCell className="hidden md:table-cell">
                      {renderMetadata(template)}
                    </TableCell>
                  )}
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenuItem onClick={() => setPreviewTemplate(template)}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(config.editHref(template.id))}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => actions.onDuplicate(template.id)}>
                          <Copy className="mr-2 h-4 w-4" />
                          Duplicate
                        </DropdownMenuItem>
                        {config.showToggleStatus !== false && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => actions.onToggleStatus(template.id, template.isActive)}
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
                          </>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteId(template.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Preview Modal */}
      <TemplatePreviewModal
        template={previewSurvey}
        open={!!previewTemplate}
        onOpenChange={() => setPreviewTemplate(null)}
        renderHeader={renderPreviewHeader}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleteId) {
            actions.onDelete(deleteId);
            setDeleteId(null);
          }
        }}
      />
    </>
  );
}
