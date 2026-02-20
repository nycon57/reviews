"use client";

import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  FloppyDisk as Save,
  Eye,
  ArrowLeft,
  SpinnerGap as Loader2,
} from "@phosphor-icons/react";
import { QuestionsTab, SettingsTab, BrandingTab, ThankYouTab } from "./builder-tabs";
import { SurveyPreview } from "./survey-preview";
import type {
  Question,
  QuestionType,
  SurveyTemplate,
  SurveyBranding,
  ThankYouConfig,
} from "@/types/survey.types";
import type { BuilderConfig, QuestionEditorConfig } from "./types";

// ============================================================================
// Normalize questions loaded from database
// ============================================================================

function normalizeQuestion(q: Question): Question {
  switch (q.type) {
    case "rating":
      return {
        ...q,
        config: {
          maxRating: q.config?.maxRating ?? 5,
          labels: q.config?.labels ?? { low: "Poor", high: "Excellent" },
        },
      };
    case "nps":
      return {
        ...q,
        config: {
          labels: q.config?.labels ?? {
            detractor: "Not likely",
            passive: "Neutral",
            promoter: "Very likely",
          },
        },
      };
    case "text":
      return {
        ...q,
        config: {
          multiline: q.config?.multiline ?? true,
          placeholder: q.config?.placeholder ?? "Enter your response...",
          minLength: q.config?.minLength,
          maxLength: q.config?.maxLength,
        },
      };
    case "multiple_choice":
      return {
        ...q,
        config: {
          options: q.config?.options ?? [
            { id: `${q.id}-option-1`, label: "Option 1", value: "option_1" },
            { id: `${q.id}-option-2`, label: "Option 2", value: "option_2" },
          ],
          allowMultiple: q.config?.allowMultiple ?? false,
          allowOther: q.config?.allowOther ?? false,
        },
      };
    default:
      return q;
  }
}

// ============================================================================
// Types
// ============================================================================

export interface TemplateBuilderData {
  name: string;
  description: string;
  questions: Question[];
  branding: SurveyBranding;
  thankYouConfig: ThankYouConfig;
  isActive: boolean;
  isDefault: boolean;
}

interface SharedTemplateBuilderProps {
  mode: "create" | "edit";
  config: BuilderConfig;
  questionEditorConfig: QuestionEditorConfig;
  /** Creates a default question for the given type & order */
  createQuestion: (type: QuestionType, order: number) => Question;
  /** Load existing template data for edit mode */
  loadTemplate?: () => Promise<TemplateBuilderData | null>;
  /** Save handler — receives the current form data */
  onSave: (data: TemplateBuilderData) => Promise<{ success: boolean; error?: string }>;
  /** Where to redirect after successful save */
  successRedirect: string;
  /** Title shown in the header */
  title?: string;
  /** Description shown in the header */
  subtitle?: string;
  /** Slot: extra fields in questions tab (e.g. survey type for EX) */
  renderExtraDetails?: () => ReactNode;
  /** Slot: extra settings in settings tab */
  renderExtraSettings?: () => ReactNode;
  /** Slot: extra content in thank-you tab */
  renderThankYouExtras?: (config: ThankYouConfig, onChange: (c: ThankYouConfig) => void) => ReactNode;
  /** Slot: render entirely custom tab content */
  renderExtraTab?: (tabId: string) => ReactNode;
}

// ============================================================================
// Component
// ============================================================================

export function SharedTemplateBuilder({
  mode,
  config,
  questionEditorConfig,
  createQuestion,
  loadTemplate,
  onSave,
  successRedirect,
  title,
  subtitle,
  renderExtraDetails,
  renderExtraSettings,
  renderThankYouExtras,
  renderExtraTab,
}: SharedTemplateBuilderProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [branding, setBranding] = useState<SurveyBranding>({
    showProgressBar: true,
    showQuestionNumbers: true,
  });
  const [thankYouConfig, setThankYouConfig] = useState<ThankYouConfig>({
    title: "Thank you!",
    message: "Your response has been recorded.",
  });
  const [isActive, setIsActive] = useState(true);
  const [isDefault, setIsDefault] = useState(false);

  // Load existing template for edit mode
  const doLoad = useCallback(async () => {
    if (mode !== "edit" || !loadTemplate) return;

    try {
      const data = await loadTemplate();
      if (data) {
        setName(data.name);
        setDescription(data.description);
        setQuestions(data.questions.map(normalizeQuestion));
        setBranding(data.branding || { showProgressBar: true, showQuestionNumbers: true });
        setThankYouConfig(data.thankYouConfig || {
          title: "Thank you!",
          message: "Your response has been recorded.",
        });
        setIsActive(data.isActive);
        setIsDefault(data.isDefault);
      } else {
        toast({
          title: "Error",
          description: "Failed to load template",
          variant: "destructive",
        });
        router.push(config.backHref);
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to load template",
        variant: "destructive",
      });
      router.push(config.backHref);
    } finally {
      setIsLoading(false);
    }
  }, [mode, loadTemplate, toast, router, config.backHref]);

  useEffect(() => {
    doLoad();
  }, [doLoad]);

  // Question management
  const addQuestion = (type: QuestionType) => {
    setQuestions((prev) => [...prev, createQuestion(type, prev.length)]);
  };

  const updateQuestion = (index: number, updated: Question) => {
    setQuestions((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  };

  const deleteQuestion = (index: number) => {
    setQuestions((prev) =>
      prev.filter((_, i) => i !== index).map((q, i) => ({ ...q, order: i })),
    );
  };

  const duplicateQuestion = (index: number) => {
    setQuestions((prev) => {
      const src = prev[index];
      return [
        ...prev,
        {
          ...src,
          id: globalThis.crypto.randomUUID(),
          title: `${src.title} (Copy)`,
          order: prev.length,
        },
      ];
    });
  };

  // Save
  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: "Validation Error", description: "Please enter a template name", variant: "destructive" });
      return;
    }
    if (questions.length === 0) {
      toast({ title: "Validation Error", description: "Please add at least one question", variant: "destructive" });
      return;
    }
    const emptyTitle = questions.find((q) => !q.title.trim());
    if (emptyTitle) {
      toast({ title: "Validation Error", description: "All questions must have a title", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const result = await onSave({
        name,
        description: description || "",
        questions,
        branding,
        thankYouConfig,
        isActive,
        isDefault,
      });

      if (result.success) {
        toast({
          title: mode === "create" ? "Template created" : "Template updated",
          description: mode === "create" ? "Your survey template has been saved." : "Your changes have been saved.",
        });
        router.push(successRedirect);
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save template",
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const getCurrentSurvey = (): SurveyTemplate => ({
    name: name || "Untitled Survey",
    description,
    questions,
    branding,
    thankYouConfig,
    isActive,
    isDefault,
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Full-screen preview
  if (showPreview) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setShowPreview(false)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Editor
          </Button>
        </div>
        <SurveyPreview survey={getCurrentSurvey()} showRestart />
      </div>
    );
  }

  // Determine which standard tab IDs are in the config
  const standardTabs = new Set(["questions", "settings", "branding", "thankyou"]);
  const extraTabs = config.tabs.filter((t) => !standardTabs.has(t.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push(config.backHref)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {title || (mode === "create" ? "Create Survey Template" : "Edit Survey Template")}
            </h1>
            {subtitle && (
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {mode === "create" ? "Create Template" : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="questions" className="space-y-4">
        <TabsList>
          {config.tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id}>
              <span className="flex items-center gap-1.5">
                {tab.icon}
                {tab.label}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Questions Tab */}
        <TabsContent value="questions">
          <QuestionsTab
            name={name}
            onNameChange={setName}
            description={description}
            onDescriptionChange={setDescription}
            questions={questions}
            onQuestionChange={updateQuestion}
            onQuestionDelete={deleteQuestion}
            onQuestionDuplicate={duplicateQuestion}
            onAddQuestion={addQuestion}
            questionEditorConfig={questionEditorConfig}
            renderExtraDetails={renderExtraDetails}
          />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <SettingsTab
            isActive={isActive}
            onIsActiveChange={setIsActive}
            isDefault={isDefault}
            onIsDefaultChange={setIsDefault}
            renderExtraSettings={renderExtraSettings}
          />
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <BrandingTab branding={branding} onChange={setBranding} />
        </TabsContent>

        {/* Thank You Tab */}
        <TabsContent value="thankyou">
          <ThankYouTab
            config={thankYouConfig}
            onChange={setThankYouConfig}
            renderExtras={renderThankYouExtras}
          />
        </TabsContent>

        {/* Extra tabs from config */}
        {extraTabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            {renderExtraTab?.(tab.id)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
