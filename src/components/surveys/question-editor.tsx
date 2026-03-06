"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  DotsSixVertical as GripVertical,
  Trash as Trash2,
  Copy,
  CaretDown as ChevronDown,
  CaretUp as ChevronUp,
  Plus,
  X,
  Star,
  Hash,
  Chats as MessageSquare,
  List,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Card, CardContent } from "@/components/ui/card";
import type {
  Question,
  QuestionType,
  RatingQuestion,
  NPSQuestion,
  TextQuestion,
  MultipleChoiceQuestion,
} from "@/types/survey.types";
import { QuestionRenderer } from "./question-renderer";

interface QuestionEditorProps {
  question: Question;
  onChange: (question: Question) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  isDragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}

const questionTypeOptions: Array<{ value: QuestionType; label: string; icon: React.ReactNode }> = [
  { value: "rating", label: "Star Rating", icon: <Star className="h-4 w-4" /> },
  { value: "nps", label: "NPS (0-10)", icon: <Hash className="h-4 w-4" /> },
  { value: "text", label: "Text Response", icon: <MessageSquare className="h-4 w-4" /> },
  { value: "multiple_choice", label: "Multiple Choice", icon: <List className="h-4 w-4" /> },
];

export function QuestionEditor({
  question,
  onChange,
  onDelete,
  onDuplicate,
  isDragging = false,
  dragHandleProps,
}: QuestionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const updateQuestion = (updates: Partial<Question>) => {
    onChange({ ...question, ...updates } as Question);
  };

  const getQuestionIcon = (type: QuestionType) => {
    const option = questionTypeOptions.find((o) => o.value === type);
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
        isDragging && "opacity-50 ring-2 ring-primary"
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
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onDuplicate}
              title="Duplicate question"
            >
              <Copy className="h-4 w-4" />
            </Button>
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

// Rating-specific settings
function RatingSettings({
  question,
  onChange,
}: {
  question: RatingQuestion;
  onChange: (q: Question) => void;
}) {
  const config = question.config ?? { maxRating: 5 };
  const updateConfig = (updates: Partial<RatingQuestion["config"]>) => {
    onChange({
      ...question,
      config: { ...config, ...updates },
    });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <Label htmlFor="max-rating">Rating Scale</Label>
        <Select
          value={String(config.maxRating ?? 5)}
          onValueChange={(v) => updateConfig({ maxRating: Number(v) })}
        >
          <SelectTrigger id="max-rating" className="mt-1.5">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="5">1-5 Stars</SelectItem>
            <SelectItem value="10">1-10 Stars</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="sm:col-span-2 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="low-label">Low Rating Label</Label>
          <Input
            id="low-label"
            value={config.labels?.low || ""}
            onChange={(e) =>
              updateConfig({
                labels: { ...config.labels, low: e.target.value },
              })
            }
            placeholder="e.g., Poor"
            className="mt-1.5"
          />
        </div>
        <div>
          <Label htmlFor="high-label">High Rating Label</Label>
          <Input
            id="high-label"
            value={config.labels?.high || ""}
            onChange={(e) =>
              updateConfig({
                labels: { ...config.labels, high: e.target.value },
              })
            }
            placeholder="e.g., Excellent"
            className="mt-1.5"
          />
        </div>
      </div>
    </div>
  );
}

// NPS-specific settings
function NPSSettings({
  question,
  onChange,
}: {
  question: NPSQuestion;
  onChange: (q: Question) => void;
}) {
  const config = question.config ?? {};
  const updateConfig = (updates: Partial<NPSQuestion["config"]>) => {
    onChange({
      ...question,
      config: { ...config, ...updates },
    });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <Label htmlFor="detractor-label">Detractor Label (0-6)</Label>
        <Input
          id="detractor-label"
          value={config.labels?.detractor || ""}
          onChange={(e) =>
            updateConfig({
              labels: { ...config.labels, detractor: e.target.value },
            })
          }
          placeholder="e.g., Not at all likely"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="passive-label">Passive Label (7-8)</Label>
        <Input
          id="passive-label"
          value={config.labels?.passive || ""}
          onChange={(e) =>
            updateConfig({
              labels: { ...config.labels, passive: e.target.value },
            })
          }
          placeholder="e.g., Neutral"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="promoter-label">Promoter Label (9-10)</Label>
        <Input
          id="promoter-label"
          value={config.labels?.promoter || ""}
          onChange={(e) =>
            updateConfig({
              labels: { ...config.labels, promoter: e.target.value },
            })
          }
          placeholder="e.g., Extremely likely"
          className="mt-1.5"
        />
      </div>
    </div>
  );
}

// Text-specific settings
function TextSettings({
  question,
  onChange,
}: {
  question: TextQuestion;
  onChange: (q: Question) => void;
}) {
  const config = question.config ?? { multiline: false };
  const updateConfig = (updates: Partial<TextQuestion["config"]>) => {
    onChange({
      ...question,
      config: { ...config, ...updates },
    });
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
        <div>
          <Label htmlFor="multiline" className="cursor-pointer">
            Multi-line Response
          </Label>
          <p className="text-xs text-muted-foreground">
            Allow longer responses with a textarea
          </p>
        </div>
        <Switch
          id="multiline"
          checked={config.multiline ?? false}
          onCheckedChange={(checked) => updateConfig({ multiline: checked })}
        />
      </div>

      <div className="sm:col-span-2">
        <Label htmlFor="placeholder">Placeholder Text</Label>
        <Input
          id="placeholder"
          value={config.placeholder || ""}
          onChange={(e) => updateConfig({ placeholder: e.target.value })}
          placeholder="e.g., Enter your response..."
          className="mt-1.5"
        />
      </div>

      <div>
        <Label htmlFor="min-length">Minimum Length</Label>
        <Input
          id="min-length"
          type="number"
          min={0}
          value={config.minLength || ""}
          onChange={(e) =>
            updateConfig({
              minLength: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          placeholder="No minimum"
          className="mt-1.5"
        />
      </div>
      <div>
        <Label htmlFor="max-length">Maximum Length</Label>
        <Input
          id="max-length"
          type="number"
          min={1}
          value={config.maxLength || ""}
          onChange={(e) =>
            updateConfig({
              maxLength: e.target.value ? Number(e.target.value) : undefined,
            })
          }
          placeholder="No maximum"
          className="mt-1.5"
        />
      </div>
    </div>
  );
}

// Multiple Choice-specific settings
function MultipleChoiceSettings({
  question,
  onChange,
}: {
  question: MultipleChoiceQuestion;
  onChange: (q: Question) => void;
}) {
  const defaultOptions = [
    { id: crypto.randomUUID(), label: "Option 1", value: "option_1" },
    { id: crypto.randomUUID(), label: "Option 2", value: "option_2" },
  ];
  const config = question.config ?? { options: defaultOptions, allowMultiple: false, allowOther: false };
  const options = config.options ?? defaultOptions;

  const updateConfig = (updates: Partial<MultipleChoiceQuestion["config"]>) => {
    onChange({
      ...question,
      config: { ...config, ...updates },
    });
  };

  const addOption = () => {
    const newOption = {
      id: globalThis.crypto.randomUUID(),
      label: `Option ${options.length + 1}`,
      value: `option_${options.length + 1}`,
    };
    updateConfig({ options: [...options, newOption] });
  };

  const updateOption = (
    index: number,
    updates: Partial<MultipleChoiceQuestion["config"]["options"][0]>
  ) => {
    const newOptions = [...options];
    newOptions[index] = { ...newOptions[index], ...updates };
    updateConfig({ options: newOptions });
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return; // Keep at least 2 options
    const newOptions = options.filter((_, i) => i !== index);
    updateConfig({ options: newOptions });
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label htmlFor="allow-multiple" className="cursor-pointer">
              Allow Multiple Selections
            </Label>
            <p className="text-xs text-muted-foreground">
              Respondents can select more than one option
            </p>
          </div>
          <Switch
            id="allow-multiple"
            checked={config.allowMultiple ?? false}
            onCheckedChange={(checked) => updateConfig({ allowMultiple: checked })}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label htmlFor="allow-other" className="cursor-pointer">
              Allow &quot;Other&quot; Option
            </Label>
            <p className="text-xs text-muted-foreground">
              Add a text field for custom responses
            </p>
          </div>
          <Switch
            id="allow-other"
            checked={config.allowOther ?? false}
            onCheckedChange={(checked) => updateConfig({ allowOther: checked })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Answer Options</Label>
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center text-sm text-muted-foreground">
                {index + 1}.
              </div>
              <Input
                value={option.label}
                onChange={(e) => updateOption(index, { label: e.target.value })}
                placeholder={`Option ${index + 1}`}
                className="flex-1"
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => removeOption(index)}
                disabled={options.length <= 2}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2"
          onClick={addOption}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Option
        </Button>
      </div>
    </div>
  );
}
