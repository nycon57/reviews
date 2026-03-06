"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { EXQuestionEditor } from "./ex-question-editor";
import { EXSurveyPreview } from "./ex-survey-preview";
import {
  Plus,
  Eye,
  EyeSlash,
  FloppyDisk,
  ArrowLeft,
  ListNumbers,
  Gear,
  Palette,
  CheckCircle,
  UsersThree,
  SpinnerGap,
} from "@phosphor-icons/react";
import { createDefaultEXQuestion } from "@/lib/ex-surveys/question-adapter";
import {
  createEXSurveyTemplate,
  updateEXSurveyTemplate,
} from "@/lib/ex-surveys/actions";
import type { EXSurveyTemplate, EXQuestion, EXSurveyType, EXSurveyFrequency } from "@/types/ex-survey.types";

interface EXTemplateBuilderProps {
  template?: EXSurveyTemplate;
  mode: "create" | "edit";
}

const surveyTypes: { value: EXSurveyType; label: string }[] = [
  { value: "engagement", label: "Engagement Survey" },
  { value: "pulse", label: "Pulse Check" },
  { value: "exit", label: "Exit Interview" },
  { value: "onboarding", label: "Onboarding Survey" },
  { value: "custom", label: "Custom Survey" },
];

const frequencies: { value: EXSurveyFrequency; label: string }[] = [
  { value: "once", label: "One-time" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
];

const defaultTemplate: Omit<EXSurveyTemplate, "id" | "organizationId" | "createdAt" | "updatedAt" | "createdBy"> = {
  name: "",
  description: "",
  surveyType: "custom",
  frequency: "once",
  isAnonymous: true,
  isDefault: false,
  isActive: true,
  questions: [],
  branding: {
    showProgressBar: true,
    showQuestionNumbers: true,
  },
  thankYouConfig: {
    title: "Thank you for your feedback!",
    message: "Your responses help us create a better workplace.",
  },
  notificationSettings: {
    sendReminders: true,
    reminderDays: [3, 7],
    notifyManagers: false,
  },
};

export function EXTemplateBuilder({ template, mode }: EXTemplateBuilderProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("questions");

  // Form state
  const [formData, setFormData] = useState<Omit<EXSurveyTemplate, "id" | "organizationId" | "createdAt" | "updatedAt" | "createdBy">>(() => {
    if (template) {
      return {
        name: template.name,
        description: template.description,
        surveyType: template.surveyType,
        frequency: template.frequency,
        isAnonymous: template.isAnonymous,
        isDefault: template.isDefault,
        isActive: template.isActive,
        questions: template.questions,
        branding: template.branding || defaultTemplate.branding,
        thankYouConfig: template.thankYouConfig || defaultTemplate.thankYouConfig,
        targetDepartments: template.targetDepartments,
        targetRoles: template.targetRoles,
        notificationSettings: template.notificationSettings || defaultTemplate.notificationSettings,
        benchmarkCategory: template.benchmarkCategory,
      };
    }
    return defaultTemplate;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAddQuestion = useCallback((type: EXQuestion["type"]) => {
    const newQuestion = createDefaultEXQuestion(type, formData.questions.length);
    setFormData((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  }, [formData.questions.length]);

  const handleQuestionChange = useCallback((index: number, question: EXQuestion) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) => (i === index ? question : q)),
    }));
  }, []);

  const handleQuestionDelete = useCallback((index: number) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions
        .filter((_, i) => i !== index)
        .map((q, i) => ({ ...q, order: i })),
    }));
  }, []);

  // For future drag-and-drop reordering
  const _handleMoveQuestion = useCallback((fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= formData.questions.length) return;
    setFormData((prev) => {
      const questions = [...prev.questions];
      const [moved] = questions.splice(fromIndex, 1);
      questions.splice(toIndex, 0, moved);
      return {
        ...prev,
        questions: questions.map((q, i) => ({ ...q, order: i })),
      };
    });
  }, [formData.questions.length]);

  const validate = (): { isValid: boolean; errors: Record<string, string> } => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Template name is required";
    }

    if (formData.questions.length === 0) {
      newErrors.questions = "At least one question is required";
    }

    const emptyQuestions = formData.questions.filter((q) => !q.text.trim());
    if (emptyQuestions.length > 0) {
      newErrors.questions = "All questions must have text";
    }

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const handleSubmit = async () => {
    const validation = validate();
    if (!validation.isValid) {
      // Switch to relevant tab if there are errors (using fresh validation result)
      if (validation.errors.name) setActiveTab("settings");
      else if (validation.errors.questions) setActiveTab("questions");
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === "create") {
        const result = await createEXSurveyTemplate({
          name: formData.name,
          description: formData.description,
          surveyType: formData.surveyType,
          frequency: formData.frequency,
          isAnonymous: formData.isAnonymous,
          questions: formData.questions,
          branding: formData.branding,
          thankYouConfig: formData.thankYouConfig,
          targetDepartments: formData.targetDepartments,
          targetRoles: formData.targetRoles,
          notificationSettings: formData.notificationSettings,
          benchmarkCategory: formData.benchmarkCategory,
        });

        if (result.success) {
          router.push("/dashboard/ex-surveys/templates");
        } else {
          setErrors({ submit: result.error || "Failed to create template" });
        }
      } else if (template?.id) {
        const result = await updateEXSurveyTemplate({
          id: template.id,
          name: formData.name,
          description: formData.description,
          surveyType: formData.surveyType,
          frequency: formData.frequency,
          isAnonymous: formData.isAnonymous,
          questions: formData.questions,
          branding: formData.branding,
          thankYouConfig: formData.thankYouConfig,
          targetDepartments: formData.targetDepartments,
          targetRoles: formData.targetRoles,
          notificationSettings: formData.notificationSettings,
          benchmarkCategory: formData.benchmarkCategory,
        });

        if (result.success) {
          router.push("/dashboard/ex-surveys/templates");
        } else {
          setErrors({ submit: result.error || "Failed to update template" });
        }
      }
    } catch {
      setErrors({ submit: "An unexpected error occurred" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const previewTemplate: EXSurveyTemplate = {
    id: template?.id || "preview",
    organizationId: template?.organizationId,
    ...formData,
    createdAt: template?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return (
    <div className="flex-1 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDiscardDialog(true)}
          >
            <ArrowLeft weight="bold" size={20} />
          </Button>
          <div>
            <h1 className="font-display text-2xl font-bold text-heading">
              {mode === "create" ? "Create Template" : "Edit Template"}
            </h1>
            <p className="font-sans text-sm text-muted-foreground">
              {mode === "create"
                ? "Build a custom employee experience survey template"
                : `Editing: ${template?.name}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            {showPreview ? (
              <>
                <EyeSlash weight="regular" size={18} className="mr-2" />
                Hide Preview
              </>
            ) : (
              <>
                <Eye weight="regular" size={18} className="mr-2" />
                Preview
              </>
            )}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white"
          >
            {isSubmitting ? (
              <>
                <SpinnerGap weight="bold" size={18} className="mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <FloppyDisk weight="regular" size={18} className="mr-2" />
                Save Template
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Error message */}
      {errors.submit && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-sm text-destructive">
          {errors.submit}
        </div>
      )}

      {/* Main content */}
      <div className={cn("grid gap-6", showPreview && "lg:grid-cols-2")}>
        {/* Builder */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="questions" className="gap-2">
                <ListNumbers weight="regular" size={16} />
                <span className="hidden sm:inline">Questions</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="gap-2">
                <Gear weight="regular" size={16} />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
              <TabsTrigger value="branding" className="gap-2">
                <Palette weight="regular" size={16} />
                <span className="hidden sm:inline">Branding</span>
              </TabsTrigger>
              <TabsTrigger value="thankyou" className="gap-2">
                <CheckCircle weight="regular" size={16} />
                <span className="hidden sm:inline">Thank You</span>
              </TabsTrigger>
              <TabsTrigger value="targeting" className="gap-2">
                <UsersThree weight="regular" size={16} />
                <span className="hidden sm:inline">Targeting</span>
              </TabsTrigger>
            </TabsList>

            {/* Questions Tab */}
            <TabsContent value="questions" className="space-y-4 mt-6">
              {errors.questions && (
                <p className="text-sm text-destructive">{errors.questions}</p>
              )}

              {formData.questions.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <ListNumbers weight="duotone" size={48} className="text-muted-foreground/50 mb-4" />
                    <p className="font-sans text-muted-foreground mb-4">
                      No questions yet. Add your first question to get started.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {["rating", "nps", "text", "single_choice", "multiple_choice"].map((type) => (
                        <Button
                          key={type}
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddQuestion(type as EXQuestion["type"])}
                        >
                          <Plus weight="bold" size={14} className="mr-1" />
                          {type === "single_choice" ? "Single Choice" : type === "multiple_choice" ? "Multiple Choice" : type.charAt(0).toUpperCase() + type.slice(1)}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {formData.questions.map((question, index) => (
                    <EXQuestionEditor
                      key={question.id}
                      question={question}
                      index={index}
                      onChange={(q) => handleQuestionChange(index, q)}
                      onDelete={() => handleQuestionDelete(index)}
                    />
                  ))}

                  {/* Add question buttons */}
                  <Card className="border-dashed">
                    <CardContent className="py-4">
                      <div className="flex flex-wrap gap-2 justify-center">
                        {["rating", "nps", "text", "single_choice", "multiple_choice"].map((type) => (
                          <Button
                            key={type}
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddQuestion(type as EXQuestion["type"])}
                          >
                            <Plus weight="bold" size={14} className="mr-1" />
                            {type === "single_choice" ? "Single Choice" : type === "multiple_choice" ? "Multiple Choice" : type.charAt(0).toUpperCase() + type.slice(1)}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Information</CardTitle>
                  <CardDescription>Configure the template name and survey type</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Template Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Q1 Employee Engagement Survey"
                      className={cn(errors.name && "border-destructive")}
                    />
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={formData.description || ""}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Describe the purpose of this survey..."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Survey Type</Label>
                      <Select
                        value={formData.surveyType}
                        onValueChange={(value) => setFormData({ ...formData, surveyType: value as EXSurveyType })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {surveyTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select
                        value={formData.frequency || "once"}
                        onValueChange={(value) => setFormData({ ...formData, frequency: value as EXSurveyFrequency })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {frequencies.map((freq) => (
                            <SelectItem key={freq.value} value={freq.value}>
                              {freq.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="space-y-0.5">
                      <Label>Anonymous Responses</Label>
                      <p className="text-sm text-muted-foreground">
                        Hide respondent identities in reports
                      </p>
                    </div>
                    <Switch
                      checked={formData.isAnonymous}
                      onCheckedChange={(checked) => setFormData({ ...formData, isAnonymous: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Branding Tab */}
            <TabsContent value="branding" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Survey Appearance</CardTitle>
                  <CardDescription>Customize how the survey looks to respondents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="logo">Logo URL</Label>
                    <Input
                      id="logo"
                      value={formData.branding?.logo || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        branding: { ...formData.branding, logo: e.target.value },
                      })}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="primaryColor">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={formData.branding?.primaryColor || "#52796f"}
                          onChange={(e) => setFormData({
                            ...formData,
                            branding: { ...formData.branding, primaryColor: e.target.value },
                          })}
                          className="w-14 h-10 p-1"
                        />
                        <Input
                          value={formData.branding?.primaryColor || "#52796f"}
                          onChange={(e) => setFormData({
                            ...formData,
                            branding: { ...formData.branding, primaryColor: e.target.value },
                          })}
                          placeholder="#52796f"
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="backgroundColor">Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="backgroundColor"
                          type="color"
                          value={formData.branding?.backgroundColor || "#ffffff"}
                          onChange={(e) => setFormData({
                            ...formData,
                            branding: { ...formData.branding, backgroundColor: e.target.value },
                          })}
                          className="w-14 h-10 p-1"
                        />
                        <Input
                          value={formData.branding?.backgroundColor || "#ffffff"}
                          onChange={(e) => setFormData({
                            ...formData,
                            branding: { ...formData.branding, backgroundColor: e.target.value },
                          })}
                          placeholder="#ffffff"
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="space-y-0.5">
                      <Label>Show Progress Bar</Label>
                      <p className="text-sm text-muted-foreground">
                        Display completion progress to respondents
                      </p>
                    </div>
                    <Switch
                      checked={formData.branding?.showProgressBar !== false}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        branding: { ...formData.branding, showProgressBar: checked },
                      })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Question Numbers</Label>
                      <p className="text-sm text-muted-foreground">
                        Number each question (1, 2, 3...)
                      </p>
                    </div>
                    <Switch
                      checked={formData.branding?.showQuestionNumbers !== false}
                      onCheckedChange={(checked) => setFormData({
                        ...formData,
                        branding: { ...formData.branding, showQuestionNumbers: checked },
                      })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Thank You Tab */}
            <TabsContent value="thankyou" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Completion Screen</CardTitle>
                  <CardDescription>Customize what respondents see after submitting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="thankYouTitle">Title</Label>
                    <Input
                      id="thankYouTitle"
                      value={formData.thankYouConfig?.title || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        thankYouConfig: {
                          title: e.target.value,
                          message: formData.thankYouConfig?.message ?? "",
                          showSocialShare: formData.thankYouConfig?.showSocialShare,
                          redirectUrl: formData.thankYouConfig?.redirectUrl,
                          redirectDelay: formData.thankYouConfig?.redirectDelay,
                        },
                      })}
                      placeholder="Thank you for your feedback!"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thankYouMessage">Message</Label>
                    <Textarea
                      id="thankYouMessage"
                      value={formData.thankYouConfig?.message || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        thankYouConfig: {
                          title: formData.thankYouConfig?.title ?? "",
                          message: e.target.value,
                          showSocialShare: formData.thankYouConfig?.showSocialShare,
                          redirectUrl: formData.thankYouConfig?.redirectUrl,
                          redirectDelay: formData.thankYouConfig?.redirectDelay,
                        },
                      })}
                      placeholder="Your responses help us create a better workplace."
                      className="min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="redirectUrl">Redirect URL (optional)</Label>
                    <Input
                      id="redirectUrl"
                      value={formData.thankYouConfig?.redirectUrl || ""}
                      onChange={(e) => setFormData({
                        ...formData,
                        thankYouConfig: {
                          title: formData.thankYouConfig?.title ?? "",
                          message: formData.thankYouConfig?.message ?? "",
                          showSocialShare: formData.thankYouConfig?.showSocialShare,
                          redirectUrl: e.target.value,
                          redirectDelay: formData.thankYouConfig?.redirectDelay,
                        },
                      })}
                      placeholder="https://example.com/thank-you"
                    />
                    <p className="text-sm text-muted-foreground">
                      Redirect respondents to this URL after completion
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Targeting Tab */}
            <TabsContent value="targeting" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Target Audience</CardTitle>
                  <CardDescription>Define who should receive this survey</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Target Roles</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Leave empty to target all employees
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {["user", "manager", "admin"].map((role) => (
                        <Button
                          key={role}
                          variant={formData.targetRoles?.includes(role) ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            const current = formData.targetRoles || [];
                            setFormData({
                              ...formData,
                              targetRoles: current.includes(role)
                                ? current.filter((r) => r !== role)
                                : [...current, role],
                            });
                          }}
                          className={cn(
                            formData.targetRoles?.includes(role) &&
                            "bg-repwell-teal-300 hover:bg-repwell-teal-400"
                          )}
                        >
                          {role.charAt(0).toUpperCase() + role.slice(1)}s
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <h4 className="font-medium text-heading">Reminder Settings</h4>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Send Reminders</Label>
                        <p className="text-sm text-muted-foreground">
                          Automatically remind non-respondents
                        </p>
                      </div>
                      <Switch
                        checked={formData.notificationSettings?.sendReminders !== false}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          notificationSettings: {
                            ...formData.notificationSettings,
                            sendReminders: checked,
                          },
                        })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Notify Managers</Label>
                        <p className="text-sm text-muted-foreground">
                          Alert managers when their team completes
                        </p>
                      </div>
                      <Switch
                        checked={formData.notificationSettings?.notifyManagers === true}
                        onCheckedChange={(checked) => setFormData({
                          ...formData,
                          notificationSettings: {
                            ...formData.notificationSettings,
                            notifyManagers: checked,
                          },
                        })}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview panel */}
        {showPreview && (
          <div className="lg:sticky lg:top-6 lg:self-start">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye weight="duotone" size={20} className="text-repwell-teal-300" />
                  Live Preview
                </CardTitle>
                <CardDescription>
                  See how your survey will look to respondents
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border bg-background-subtle p-4">
                  <EXSurveyPreview
                    template={previewTemplate}
                    embedded
                    showPreviewBadge={false}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Discard confirmation dialog */}
      <AlertDialog open={showDiscardDialog} onOpenChange={setShowDiscardDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. Are you sure you want to leave? Your changes will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push("/dashboard/ex-surveys/templates")}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
