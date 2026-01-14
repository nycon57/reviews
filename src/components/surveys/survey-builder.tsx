"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
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
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Save,
  Eye,
  ArrowLeft,
  Star,
  Hash,
  MessageSquare,
  List,
  Loader2,
} from "lucide-react";
import { QuestionEditor } from "./question-editor";
import { SurveyPreview } from "./survey-preview";
import {
  createSurveyTemplate,
  updateSurveyTemplate,
  getSurveyTemplate,
} from "@/lib/surveys/actions";
import type {
  Question,
  QuestionType,
  SurveyTemplate,
  SurveyBranding,
  ThankYouConfig,
} from "@/types/survey.types";
import { createDefaultQuestion } from "@/types/survey.types";

interface SurveyBuilderProps {
  mode: "create" | "edit";
  templateId?: string;
}

export function SurveyBuilder({ mode, templateId }: SurveyBuilderProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Survey data
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

  // Load existing template if editing
  const loadTemplate = useCallback(async () => {
    if (mode !== "edit" || !templateId) return;

    const result = await getSurveyTemplate(templateId);
    if (result.success && result.data) {
      const template = result.data;
      setName(template.name);
      setDescription(template.description || "");
      setQuestions(template.questions);
      setBranding(template.branding || {
        showProgressBar: true,
        showQuestionNumbers: true,
      });
      setThankYouConfig(template.thankYouConfig || {
        title: "Thank you!",
        message: "Your response has been recorded.",
      });
      setIsActive(template.isActive);
      setIsDefault(template.isDefault);
    } else {
      toast({
        title: "Error",
        description: "Failed to load template",
        variant: "destructive",
      });
      router.push("/dashboard/surveys");
    }
    setIsLoading(false);
  }, [mode, templateId, toast, router]);

  useEffect(() => {
    loadTemplate();
  }, [loadTemplate]);

  const addQuestion = (type: QuestionType) => {
    const newQuestion = createDefaultQuestion(type, questions.length);
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, updatedQuestion: Question) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
  };

  const deleteQuestion = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    // Update order after deletion
    const reorderedQuestions = newQuestions.map((q, i) => ({ ...q, order: i }));
    setQuestions(reorderedQuestions);
  };

  const duplicateQuestion = (index: number) => {
    const questionToDuplicate = questions[index];
    const newQuestion = {
      ...questionToDuplicate,
      id: globalThis.crypto.randomUUID(),
      title: `${questionToDuplicate.title} (Copy)`,
      order: questions.length,
    };
    setQuestions([...questions, newQuestion]);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a template name",
        variant: "destructive",
      });
      return;
    }

    if (questions.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one question",
        variant: "destructive",
      });
      return;
    }

    // Check for empty question titles
    const emptyTitleQuestion = questions.find((q) => !q.title.trim());
    if (emptyTitleQuestion) {
      toast({
        title: "Validation Error",
        description: "All questions must have a title",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      if (mode === "create") {
        const result = await createSurveyTemplate({
          name,
          description: description || undefined,
          questions,
          branding,
          thankYouConfig,
          isActive,
          isDefault,
        });

        if (result.success) {
          toast({
            title: "Template created",
            description: "Your survey template has been saved.",
          });
          router.push("/dashboard/surveys");
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to create template",
            variant: "destructive",
          });
        }
      } else if (templateId) {
        const result = await updateSurveyTemplate({
          id: templateId,
          name,
          description: description || undefined,
          questions,
          branding,
          thankYouConfig,
          isActive,
          isDefault,
        });

        if (result.success) {
          toast({
            title: "Template updated",
            description: "Your changes have been saved.",
          });
          router.push("/dashboard/surveys");
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update template",
            variant: "destructive",
          });
        }
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

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (showPreview) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setShowPreview(false)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Editor
          </Button>
        </div>
        <SurveyPreview survey={getCurrentSurvey()} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/dashboard/surveys")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">
              {mode === "create" ? "Create Survey Template" : "Edit Survey Template"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Design your survey with questions, branding, and thank you messages
            </p>
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

      {/* Main Content */}
      <Tabs defaultValue="questions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="thankyou">Thank You</TabsTrigger>
        </TabsList>

        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-4">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Survey Details</CardTitle>
              <CardDescription>
                Basic information about your survey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Template Name *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Post-Transaction Survey"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the purpose of this survey..."
                  className="min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Question List */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Questions</CardTitle>
                  <CardDescription>
                    Add and arrange your survey questions
                  </CardDescription>
                </div>
                <QuestionTypeSelector onAdd={addQuestion} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-muted-foreground">
                    No questions yet. Click &quot;Add Question&quot; to get started.
                  </p>
                </div>
              ) : (
                questions.map((question, index) => (
                  <QuestionEditor
                    key={question.id}
                    question={question}
                    onChange={(q) => updateQuestion(index, q)}
                    onDelete={() => deleteQuestion(index)}
                    onDuplicate={() => duplicateQuestion(index)}
                  />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Template Settings</CardTitle>
              <CardDescription>
                Configure template behavior and status
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Active Status</Label>
                  <p className="text-sm text-muted-foreground">
                    Active templates can be used to create new surveys
                  </p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Default Template</Label>
                  <p className="text-sm text-muted-foreground">
                    Use this as the default template for new surveys
                  </p>
                </div>
                <Switch checked={isDefault} onCheckedChange={setIsDefault} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Branding Tab */}
        <TabsContent value="branding">
          <Card>
            <CardHeader>
              <CardTitle>Survey Branding</CardTitle>
              <CardDescription>
                Customize the look and feel of your survey
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="logo">Logo URL</Label>
                <Input
                  id="logo"
                  value={branding.logo || ""}
                  onChange={(e) =>
                    setBranding({ ...branding, logo: e.target.value || undefined })
                  }
                  placeholder="https://example.com/logo.png"
                />
                <p className="text-xs text-muted-foreground">
                  Enter a URL to your company logo
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={branding.primaryColor || "#000000"}
                      onChange={(e) =>
                        setBranding({ ...branding, primaryColor: e.target.value })
                      }
                      className="h-10 w-14 cursor-pointer p-1"
                    />
                    <Input
                      value={branding.primaryColor || ""}
                      onChange={(e) =>
                        setBranding({ ...branding, primaryColor: e.target.value })
                      }
                      placeholder="#000000"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="backgroundColor"
                      type="color"
                      value={branding.backgroundColor || "#ffffff"}
                      onChange={(e) =>
                        setBranding({ ...branding, backgroundColor: e.target.value })
                      }
                      className="h-10 w-14 cursor-pointer p-1"
                    />
                    <Input
                      value={branding.backgroundColor || ""}
                      onChange={(e) =>
                        setBranding({ ...branding, backgroundColor: e.target.value })
                      }
                      placeholder="#ffffff"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Show Progress Bar</Label>
                  <p className="text-sm text-muted-foreground">
                    Display a progress indicator during the survey
                  </p>
                </div>
                <Switch
                  checked={branding.showProgressBar ?? true}
                  onCheckedChange={(checked) =>
                    setBranding({ ...branding, showProgressBar: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Show Question Numbers</Label>
                  <p className="text-sm text-muted-foreground">
                    Display question numbers (1, 2, 3...) in the survey
                  </p>
                </div>
                <Switch
                  checked={branding.showQuestionNumbers ?? true}
                  onCheckedChange={(checked) =>
                    setBranding({ ...branding, showQuestionNumbers: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Thank You Tab */}
        <TabsContent value="thankyou">
          <Card>
            <CardHeader>
              <CardTitle>Thank You Page</CardTitle>
              <CardDescription>
                Customize the completion message shown after submission
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="thankYouTitle">Title</Label>
                <Input
                  id="thankYouTitle"
                  value={thankYouConfig.title}
                  onChange={(e) =>
                    setThankYouConfig({ ...thankYouConfig, title: e.target.value })
                  }
                  placeholder="Thank you!"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="thankYouMessage">Message</Label>
                <Textarea
                  id="thankYouMessage"
                  value={thankYouConfig.message}
                  onChange={(e) =>
                    setThankYouConfig({ ...thankYouConfig, message: e.target.value })
                  }
                  placeholder="Your response has been recorded."
                  className="min-h-[100px]"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <Label>Show Review Redirect</Label>
                  <p className="text-sm text-muted-foreground">
                    Prompt happy customers to leave a public review
                  </p>
                </div>
                <Switch
                  checked={thankYouConfig.showReviewRedirect ?? false}
                  onCheckedChange={(checked) =>
                    setThankYouConfig({ ...thankYouConfig, showReviewRedirect: checked })
                  }
                />
              </div>

              {thankYouConfig.showReviewRedirect && (
                <div className="grid gap-2">
                  <Label htmlFor="reviewRedirectRating">
                    Minimum Rating for Review Prompt
                  </Label>
                  <Select
                    value={thankYouConfig.reviewRedirectRating?.toString() || "4"}
                    onValueChange={(value) =>
                      setThankYouConfig({
                        ...thankYouConfig,
                        reviewRedirectRating: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3+ stars / 7+ NPS</SelectItem>
                      <SelectItem value="4">4+ stars / 8+ NPS</SelectItem>
                      <SelectItem value="5">5 stars / 9+ NPS</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Only show review prompt to customers with high ratings
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Question Type Selector Component
function QuestionTypeSelector({ onAdd }: { onAdd: (type: QuestionType) => void }) {
  const questionTypes: { type: QuestionType; label: string; icon: React.ReactNode }[] = [
    { type: "rating", label: "Star Rating", icon: <Star className="h-4 w-4" /> },
    { type: "nps", label: "NPS (0-10)", icon: <Hash className="h-4 w-4" /> },
    { type: "text", label: "Text Response", icon: <MessageSquare className="h-4 w-4" /> },
    { type: "multiple_choice", label: "Multiple Choice", icon: <List className="h-4 w-4" /> },
  ];

  return (
    <Select onValueChange={(value) => onAdd(value as QuestionType)}>
      <SelectTrigger className="w-[180px]">
        <Plus className="mr-2 h-4 w-4" />
        <SelectValue placeholder="Add Question" />
      </SelectTrigger>
      <SelectContent>
        {questionTypes.map(({ type, label, icon }) => (
          <SelectItem key={type} value={type}>
            <div className="flex items-center gap-2">
              {icon}
              {label}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
