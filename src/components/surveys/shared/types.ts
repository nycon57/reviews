import type { ReactNode } from "react";
import type { Question, QuestionType, SurveyTemplate, SurveyBranding, ThankYouConfig } from "@/types/survey.types";

// ============================================================================
// Template List
// ============================================================================

export interface TemplateListItem {
  id: string;
  name: string;
  description?: string;
  questions: Question[];
  isActive: boolean;
  isDefault: boolean;
}

export interface TemplateListActions {
  onEdit: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
  onPreview: (template: TemplateListItem) => void;
}

export interface TemplateListConfig {
  createHref: string;
  detailHref: (id: string) => string;
  editHref: (id: string) => string;
  emptyStateTitle?: string;
  emptyStateDescription?: string;
  showToggleStatus?: boolean;
  /** Render extra columns after the standard ones */
  renderMetadata?: (template: TemplateListItem) => ReactNode;
  /** Default templates for empty state */
  defaultTemplates?: {
    key: string;
    name: string;
    description?: string;
    questionCount: number;
    onUse: () => void;
  }[];
}

// ============================================================================
// Template Builder
// ============================================================================

export interface BuilderTab {
  id: string;
  label: string;
  icon: ReactNode;
}

export interface BuilderConfig {
  tabs: BuilderTab[];
  backHref: string;
  availableQuestionTypes: { type: QuestionType; label: string; icon: ReactNode }[];
  /** EX-specific: render extra settings within the Settings tab */
  renderExtraSettings?: () => ReactNode;
  /** EX-specific: render extra tab content */
  renderExtraTab?: (tabId: string) => ReactNode;
  /** CX-specific: render review redirect settings in Thank You tab */
  renderThankYouExtras?: (
    config: ThankYouConfig,
    onChange: (config: ThankYouConfig) => void,
  ) => ReactNode;
}

// ============================================================================
// Question Editor
// ============================================================================

export interface QuestionEditorConfig {
  /** Available question types for the type selector */
  availableTypes: { value: QuestionType; label: string; icon: ReactNode }[];
  /** Whether to show inline preview toggle */
  showPreviewToggle?: boolean;
  /** Whether to show duplicate button */
  showDuplicate?: boolean;
}

// ============================================================================
// Template Detail
// ============================================================================

export interface TemplateDetailActions {
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
  onPreview: () => void;
}

export interface TemplateDetailConfig {
  backHref: string;
  backLabel: string;
  editHref: string;
  /** Render extra metadata in the header area */
  renderMetadata?: () => ReactNode;
  /** Render extra detail cards */
  renderExtraCards?: () => ReactNode;
}

// ============================================================================
// Preview
// ============================================================================

export interface SurveyPreviewConfig {
  /** Whether to show the restart button after submit */
  showRestart?: boolean;
  /** Whether to show the "preview mode" badge */
  showPreviewBadge?: boolean;
  /** Custom submit button styling */
  submitClassName?: string;
}

// ============================================================================
// Re-exports for convenience
// ============================================================================

export type {
  Question,
  QuestionType,
  SurveyTemplate,
  SurveyBranding,
  ThankYouConfig,
};
