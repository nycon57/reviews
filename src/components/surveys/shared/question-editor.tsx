"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  DotsSixVertical as GripVertical,
  Trash as Trash2,
  Copy,
  CaretDown as ChevronDown,
  CaretUp as ChevronUp,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import type { Question, QuestionType } from "@/types/survey.types";
import { QuestionRenderer } from "@/components/surveys/question-renderer";
import { RatingSettings, NPSSettings, TextSettings, MultipleChoiceSettings } from "./question-editor-settings";
import type { QuestionEditorConfig } from "./types";

interface SharedQuestionEditorProps {
  question: Question;
  onChange: (question: Question) => void;
  onDelete: () => void;
  onDuplicate?: () => void;
  config: QuestionEditorConfig;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

export function SharedQuestionEditor({
  question,
  onChange,
  onDelete,
  onDuplicate,
  config,
  isDragging = false,
  dragHandleProps,
}: SharedQuestionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const updateQuestion = (updates: Partial<Question>) => {
    onChange({ ...question, ...updates } as Question);
  };

  const getQuestionIcon = (type: QuestionType) => {
    const option = config.availableTypes.find((o) => o.value === type);
    return option?.icon;
  };

  const renderTypeSpecificSettings = () => {
    switch (question.type) {
      case "rating":
        return <RatingSettings question={question} onChange={onChange} />;
      case "nps":
        return <NPSSettings question={question} onChange={onChange} />;
      case "text":
        return <TextSettings question={question} onChange={onChange} />;
      case "multiple_choice":
        return <MultipleChoiceSettings question={question} onChange={onChange} />;
      default:
        return null;
    }
  };

  return (
    <Card
      className={cn(
        "transition-all",
        isDragging && "opacity-50 ring-2 ring-primary",
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="flex items-center gap-2 border-b p-3">
          {/* Drag Handle */}
          <button
            type="button"
            className="flex h-8 w-8 cursor-grab items-center justify-center rounded text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing"
            {...dragHandleProps}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Question Type Badge */}
          <div className="flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium">
            {getQuestionIcon(question.type)}
            <span className="hidden capitalize sm:inline">
              {question.type.replace("_", " ")}
            </span>
          </div>

          {/* Question Title Preview */}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {question.title || "Untitled question"}
            </p>
          </div>

          {/* Required Badge */}
          {question.required && (
            <span className="rounded bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive">
              Required
            </span>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1">
            {onDuplicate && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onDuplicate}
                title="Duplicate question"
              >
                <Copy className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={onDelete}
              title="Delete question"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>
        </div>

        <CollapsibleContent>
          <CardContent className="space-y-6 pt-4">
            {/* Basic Question Settings */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <Label htmlFor={`${question.id}-title`}>Question Text</Label>
                <Input
                  id={`${question.id}-title`}
                  value={question.title}
                  onChange={(e) => updateQuestion({ title: e.target.value })}
                  placeholder="Enter your question..."
                  className="mt-1.5"
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor={`${question.id}-desc`}>
                  Description{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Textarea
                  id={`${question.id}-desc`}
                  value={question.description || ""}
                  onChange={(e) => updateQuestion({ description: e.target.value })}
                  placeholder="Add help text or instructions..."
                  className="mt-1.5 min-h-[60px] resize-none"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <Label htmlFor={`${question.id}-required`} className="cursor-pointer">
                    Required
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Respondents must answer this question
                  </p>
                </div>
                <Switch
                  id={`${question.id}-required`}
                  checked={question.required}
                  onCheckedChange={(checked) => updateQuestion({ required: checked })}
                />
              </div>

              {config.showPreviewToggle !== false && (
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <Label htmlFor={`${question.id}-preview`} className="cursor-pointer">
                      Preview
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      See how this question will appear
                    </p>
                  </div>
                  <Switch
                    id={`${question.id}-preview`}
                    checked={showPreview}
                    onCheckedChange={setShowPreview}
                  />
                </div>
              )}
            </div>

            {/* Type-specific settings */}
            <div className="space-y-4 border-t pt-4">
              <h4 className="text-sm font-medium">Question Settings</h4>
              {renderTypeSpecificSettings()}
            </div>

            {/* Preview */}
            {showPreview && (
              <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
                <p className="text-xs font-medium text-muted-foreground">Preview</p>
                <QuestionRenderer question={question} readonly />
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
