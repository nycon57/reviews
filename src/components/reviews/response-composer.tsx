"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sparkle as Sparkles,
  FileText,
  PaperPlaneRight as Send,
  FloppyDisk as Save,
  CheckCircle,
  SpinnerGap as Loader2,
  ArrowsClockwise as RefreshCw,
  Lock,
} from "@phosphor-icons/react";
import Link from "next/link";
import {
  getResponseTemplates,
  saveDraftResponse,
  postResponse,
  generateAISuggestion,
  trackResponseEdit,
  type ResponseTemplate,
} from "@/lib/reviews/response-actions";
import { applyTemplateVariables } from "@/lib/reviews/utils";
import { AnimatedPresence } from "@/components/motion";
/**
 * Minimal review shape consumed by ResponseComposer.
 * Accepts both AggregatedReview and ReviewDetail without unsafe casts.
 */
interface ResponseComposerReview {
  id: string;
  source: string;
  customerName: string | null;
  responseText: string | null;
  loanOfficer?: { id: string; fullName: string } | null;
}

interface ResponseComposerProps {
  review: ResponseComposerReview;
  onSuccess?: () => void;
  onCancel?: () => void;
  hasAiAccess?: boolean;
}

export function ResponseComposer({
  review,
  onSuccess,
  onCancel,
  hasAiAccess = true,
}: ResponseComposerProps) {
  const [isPending, startTransition] = useTransition();
  const [responseText, setResponseText] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [templates, setTemplates] = useState<ResponseTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiTone, setAiTone] = useState<"professional" | "friendly" | "empathetic">("professional");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Track AI suggestion source for analytics and learning
  const [originalAISuggestion, setOriginalAISuggestion] = useState<string | null>(null);
  const [wasAIGenerated, setWasAIGenerated] = useState(false);

  const loadTemplates = useCallback(async () => {
    setIsLoadingTemplates(true);
    const result = await getResponseTemplates(
      selectedCategory === "all" ? undefined : selectedCategory
    );
    if (result.success && result.data) {
      setTemplates(result.data);
    }
    setIsLoadingTemplates(false);
  }, [selectedCategory]);

  // Load templates on mount
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTemplates();
  }, [loadTemplates]);

  // Pre-fill with existing response if any
  useEffect(() => {
    if (review.responseText) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResponseText(review.responseText);
    }
  }, [review.responseText]);

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      const professionalName = review.loanOfficer?.fullName || "Your Team Member";
      const variables: Record<string, string> = {
        customer_name: review.customerName || "Valued Customer",
        professional_name: professionalName,
        // Keep for backward compatibility with existing templates
        loan_officer_name: professionalName,
      };
      const appliedContent = applyTemplateVariables(template.content, variables);
      setResponseText(appliedContent);
      setSelectedTemplateId(templateId);
      // Clear AI tracking when switching to template
      setWasAIGenerated(false);
      setOriginalAISuggestion(null);
    }
  };

  const handleGenerateAI = async () => {
    setIsGeneratingAI(true);
    setError(null);

    const result = await generateAISuggestion(review.id, aiTone);

    if (result.success && result.data) {
      setResponseText(result.data);
      setSelectedTemplateId(""); // Clear template selection since using AI
      // Track AI suggestion source
      setWasAIGenerated(true);
      setOriginalAISuggestion(result.data);
    } else {
      setError(result.error || "Failed to generate AI suggestion");
    }

    setIsGeneratingAI(false);
  };

  const handleSaveDraft = () => {
    if (!responseText.trim()) return;

    startTransition(async () => {
      setError(null);
      const result = await saveDraftResponse(
        review.id,
        responseText.trim(),
        selectedTemplateId || undefined
      );

      if (result.success) {
        setSuccess("Draft saved successfully");
        setTimeout(() => setSuccess(null), 3000);
        onSuccess?.();
      } else {
        setError(result.error || "Failed to save draft");
      }
    });
  };

  const handlePostResponse = () => {
    if (!responseText.trim()) return;

    startTransition(async () => {
      setError(null);

      // Determine if response was edited from AI suggestion
      const wasEditedFromAI = wasAIGenerated && originalAISuggestion !== responseText.trim();

      // Post response with AI tracking info
      const result = await postResponse(review.id, responseText.trim(), {
        templateId: selectedTemplateId || undefined,
        wasAISuggested: wasAIGenerated,
        wasEditedFromAI,
        originalAISuggestion: originalAISuggestion || undefined,
      });

      if (result.success) {
        // Track response edit for learning if AI suggestion was modified
        if (wasEditedFromAI && originalAISuggestion) {
          trackResponseEdit(review.id, originalAISuggestion, responseText.trim()).catch(
            (err) => console.error("Failed to track response edit:", err)
          );
        }

        setSuccess("Response posted successfully!");
        setTimeout(() => {
          setSuccess(null);
          onSuccess?.();
        }, 2000);
      } else {
        setError(result.error || "Failed to post response");
      }
    });
  };

  const getToneBadge = (tone: string) => {
    const colors: Record<string, string> = {
      professional: "bg-blue-100 text-blue-700",
      friendly: "bg-green-100 text-green-700",
      empathetic: "bg-purple-100 text-purple-700",
      formal: "bg-muted text-foreground",
    };
    return colors[tone] || "bg-muted text-foreground";
  };

  const wordCount = responseText.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="space-y-4">
      {/* Template Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Response Templates
          </label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="thank_you">Thank You</SelectItem>
              <SelectItem value="apologetic">Apologetic</SelectItem>
              <SelectItem value="follow_up">Follow Up</SelectItem>
              <SelectItem value="promotional">Promotional</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoadingTemplates ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading templates...
          </div>
        ) : templates.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {templates.slice(0, 6).map((template) => (
              <TooltipProvider key={template.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={selectedTemplateId === template.id ? "default" : "outline"}
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => handleTemplateSelect(template.id)}
                    >
                      {template.name}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="max-w-xs">
                    <p className="text-xs">{template.description || template.content.slice(0, 100)}...</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${getToneBadge(template.tone)} text-xs`}>
                        {template.tone}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Used {template.usageCount} times
                      </span>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No templates available</p>
        )}
      </div>

      {/* AI Suggestion */}
      {hasAiAccess ? (
        <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-100">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-900">AI Response Suggestion</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Generate a response based on the review content
            </p>
          </div>
          <Select value={aiTone} onValueChange={(v) => setAiTone(v as typeof aiTone)}>
            <SelectTrigger className="w-[120px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Professional</SelectItem>
              <SelectItem value="friendly">Friendly</SelectItem>
              <SelectItem value="empathetic">Empathetic</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateAI}
            disabled={isGeneratingAI}
            className="h-8"
          >
            {isGeneratingAI ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-1.5">Generate</span>
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg border border-border">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">AI Response Suggestion</span>
              <Badge variant="outline" className="text-xs">Pro</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Upgrade to Professional or Enterprise to unlock AI-powered response generation
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="h-8 shrink-0">
            <Link href="/dashboard/settings?tab=billing">
              Upgrade
            </Link>
          </Button>
        </div>
      )}

      {/* Response Editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Response</label>
          <span className="text-xs text-muted-foreground">{wordCount} words</span>
        </div>
        <Textarea
          placeholder="Write your response to this review..."
          value={responseText}
          onChange={(e) => {
            setResponseText(e.target.value);
            setSelectedTemplateId(""); // Clear template selection when editing
          }}
          rows={6}
          className="resize-none"
        />
      </div>

      {/* Status Messages */}
      <AnimatedPresence show={!!error} mode="slide-up">
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      </AnimatedPresence>
      <AnimatedPresence show={!!success} mode="slide-up">
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
          <CheckCircle className="h-4 w-4" />
          {success}
        </div>
      </AnimatedPresence>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button variant="ghost" size="sm" onClick={onCancel}>
          Cancel
        </Button>

        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveDraft}
                  disabled={isPending || !responseText.trim()}
                >
                  <Save className="h-4 w-4 mr-1.5" />
                  Save Draft
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">Save as draft to continue later</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  onClick={handlePostResponse}
                  disabled={isPending || !responseText.trim()}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-1.5" />
                  )}
                  Post Response
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {review.source === "google"
                    ? "Post response to Google"
                    : "Post response to this review"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
