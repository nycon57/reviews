"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
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
  CheckCircle,
  Palette,
  Gear,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TemplatePreviewModal } from "./template-preview-modal";
import { DeleteConfirmDialog } from "./delete-confirm-dialog";
import type { SurveyTemplate, Question } from "@/types/survey.types";
import type { TemplateDetailActions, TemplateDetailConfig } from "./types";

// ============================================================================
// Helpers
// ============================================================================

function getQuestionTypeIcon(type: Question["type"]) {
  switch (type) {
    case "rating":
      return <Star className="h-4 w-4" />;
    case "nps":
      return <Hash className="h-4 w-4" />;
    case "text":
      return <MessageSquare className="h-4 w-4" />;
    case "multiple_choice":
      return <List className="h-4 w-4" />;
    default:
      return null;
  }
}

function formatQuestionType(type: Question["type"]) {
  switch (type) {
    case "rating":
      return "Rating";
    case "nps":
      return "NPS";
    case "text":
      return "Text";
    case "multiple_choice":
      return "Multiple Choice";
    default:
      return type;
  }
}

// ============================================================================
// Component
// ============================================================================

interface SharedTemplateDetailProps {
  template: SurveyTemplate;
  config: TemplateDetailConfig;
  actions: TemplateDetailActions;
  /** Extra metadata rendered beside the status badges */
  renderMetadata?: () => ReactNode;
  /** Extra detail cards below the standard ones */
  renderExtraCards?: () => ReactNode;
}

export function SharedTemplateDetail({
  template,
  config,
  actions,
  renderMetadata,
  renderExtraCards,
}: SharedTemplateDetailProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const sortedQuestions = [...template.questions].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={config.backHref}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {config.backLabel}
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold">{template.name}</h1>
          {template.description && (
            <p className="text-muted-foreground">{template.description}</p>
          )}
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant={template.isActive ? "default" : "secondary"}>
              {template.isActive ? "Active" : "Inactive"}
            </Badge>
            {template.isDefault && <Badge variant="outline">Default</Badge>}
            {renderMetadata?.()}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={config.editHref}>
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={actions.onDuplicate}>
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
          <Button variant="outline" size="sm" onClick={actions.onToggleStatus}>
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
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Questions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Questions ({template.questions.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md border-t">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Question</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Required</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedQuestions.map((question, index) => (
                  <TableRow key={question.id}>
                    <TableCell className="text-muted-foreground">
                      {index + 1}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{question.title}</div>
                      {question.description && (
                        <div className="text-sm text-muted-foreground">
                          {question.description}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {getQuestionTypeIcon(question.type)}
                        <span className="text-sm">{formatQuestionType(question.type)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {question.required ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Required
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">Optional</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Branding & Thank You */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4" />
              Branding
            </CardTitle>
          </CardHeader>
          <CardContent>
            {template.branding ? (
              <dl className="space-y-2 text-sm">
                {template.branding.primaryColor && (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Primary Color</dt>
                    <dd className="flex items-center gap-2">
                      <span
                        className="inline-block h-4 w-4 rounded border"
                        style={{ backgroundColor: template.branding.primaryColor }}
                      />
                      {template.branding.primaryColor}
                    </dd>
                  </div>
                )}
                {template.branding.backgroundColor && (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Background</dt>
                    <dd className="flex items-center gap-2">
                      <span
                        className="inline-block h-4 w-4 rounded border"
                        style={{ backgroundColor: template.branding.backgroundColor }}
                      />
                      {template.branding.backgroundColor}
                    </dd>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Progress Bar</dt>
                  <dd>{template.branding.showProgressBar !== false ? "Shown" : "Hidden"}</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-muted-foreground">Question Numbers</dt>
                  <dd>{template.branding.showQuestionNumbers !== false ? "Shown" : "Hidden"}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">Default branding</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Gear className="h-4 w-4" />
              Thank You Page
            </CardTitle>
          </CardHeader>
          <CardContent>
            {template.thankYouConfig ? (
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-muted-foreground">Title</dt>
                  <dd className="font-medium">{template.thankYouConfig.title}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Message</dt>
                  <dd>{template.thankYouConfig.message}</dd>
                </div>
                {template.thankYouConfig.redirectUrl && (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Redirect URL</dt>
                    <dd className="truncate text-xs">{template.thankYouConfig.redirectUrl}</dd>
                  </div>
                )}
                {template.thankYouConfig.showReviewRedirect && (
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Review Redirect</dt>
                    <dd>Rating {template.thankYouConfig.reviewRedirectRating}+</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">Default thank you page</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Extra cards from config */}
      {renderExtraCards?.()}

      {/* Preview Modal */}
      <TemplatePreviewModal
        template={template}
        open={showPreview}
        onOpenChange={setShowPreview}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          actions.onDelete();
        }}
      />
    </div>
  );
}
