"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DotsSixVertical,
  Trash,
  Plus,
  Star,
  ChartBar,
  TextT,
  ListBullets,
  CheckSquare,
  X,
} from "@phosphor-icons/react";
import type { EXQuestion } from "@/types/ex-survey.types";

interface EXQuestionEditorProps {
  question: EXQuestion;
  onChange: (question: EXQuestion) => void;
  onDelete: () => void;
  index: number;
  isDragging?: boolean;
  dragHandleProps?: Record<string, unknown>;
}

const questionTypeIcons: Record<string, React.ReactNode> = {
  rating: <Star weight="duotone" size={20} className="text-repwell-teal-300" />,
  nps: <ChartBar weight="duotone" size={20} className="text-repwell-teal-300" />,
  text: <TextT weight="duotone" size={20} className="text-repwell-teal-300" />,
  single_choice: <ListBullets weight="duotone" size={20} className="text-repwell-teal-300" />,
  multiple_choice: <CheckSquare weight="duotone" size={20} className="text-repwell-teal-300" />,
};

const questionTypeLabels: Record<string, string> = {
  rating: "Rating Scale",
  nps: "NPS (0-10)",
  text: "Open Text",
  single_choice: "Single Choice",
  multiple_choice: "Multiple Choice",
};

const defaultScaleLabels: Record<string, string[]> = {
  rating: ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"],
  nps: ["Not at all likely", "Neutral", "Extremely likely"],
};

export function EXQuestionEditor({
  question,
  onChange,
  onDelete,
  index,
  isDragging,
  dragHandleProps,
}: EXQuestionEditorProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const handleTypeChange = (newType: EXQuestion["type"]) => {
    const updated: EXQuestion = {
      ...question,
      type: newType,
      options: newType === "single_choice" || newType === "multiple_choice"
        ? question.options || ["Option 1", "Option 2"]
        : undefined,
      scale: newType === "rating" || newType === "nps"
        ? {
            min: newType === "nps" ? 0 : 1,
            max: newType === "nps" ? 10 : 5,
            labels: defaultScaleLabels[newType] || [],
          }
        : undefined,
    };
    onChange(updated);
  };

  const handleAddOption = () => {
    const currentOptions = question.options || [];
    onChange({
      ...question,
      options: [...currentOptions, `Option ${currentOptions.length + 1}`],
    });
  };

  const handleRemoveOption = (optionIndex: number) => {
    const currentOptions = question.options || [];
    if (currentOptions.length <= 2) return; // Minimum 2 options
    onChange({
      ...question,
      options: currentOptions.filter((_, i) => i !== optionIndex),
    });
  };

  const handleOptionChange = (optionIndex: number, value: string) => {
    const currentOptions = question.options || [];
    onChange({
      ...question,
      options: currentOptions.map((opt, i) => (i === optionIndex ? value : opt)),
    });
  };

  const handleScaleLabelChange = (labelIndex: number, value: string) => {
    const currentLabels = question.scale?.labels || [];
    const newLabels = [...currentLabels];
    newLabels[labelIndex] = value;
    onChange({
      ...question,
      scale: {
        ...question.scale,
        labels: newLabels,
      },
    });
  };

  return (
    <Card
      className={cn(
        "border border-border transition-all duration-200",
        isDragging && "shadow-lg ring-2 ring-repwell-teal-300/50",
        !isExpanded && "bg-background-subtle"
      )}
    >
      <CardHeader className="p-4 pb-0">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <div
            {...dragHandleProps}
            className="mt-1 cursor-grab rounded p-1 hover:bg-muted active:cursor-grabbing"
          >
            <DotsSixVertical weight="bold" size={20} className="text-muted-foreground" />
          </div>

          {/* Question number and type icon */}
          <div className="flex items-center gap-2 mt-1">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-repwell-sage-100/50 text-xs font-semibold text-repwell-teal-400">
              {index + 1}
            </span>
            {questionTypeIcons[question.type]}
          </div>

          {/* Question text preview / input */}
          <div className="flex-1 min-w-0">
            {isExpanded ? (
              <Input
                value={question.text}
                onChange={(e) => onChange({ ...question, text: e.target.value })}
                placeholder="Enter question text..."
                className="font-medium"
              />
            ) : (
              <button
                onClick={() => setIsExpanded(true)}
                className="w-full text-left font-medium text-repwell-teal-500 truncate hover:text-repwell-teal-400"
              >
                {question.text || "Untitled question"}
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8"
            >
              <span className="sr-only">{isExpanded ? "Collapse" : "Expand"}</span>
              <svg
                className={cn(
                  "h-4 w-4 transition-transform",
                  isExpanded && "rotate-180"
                )}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash weight="regular" size={16} />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="p-4 pt-4 space-y-4">
          {/* Question Type and Required */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-repwell-teal-500">
                Question Type
              </Label>
              <Select
                value={question.type}
                onValueChange={(value) => handleTypeChange(value as EXQuestion["type"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(questionTypeLabels).map(([type, label]) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        {questionTypeIcons[type]}
                        {label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-3 pt-6">
              <Label htmlFor={`required-${question.id}`} className="text-sm font-medium text-repwell-teal-500">
                Required
              </Label>
              <Switch
                id={`required-${question.id}`}
                checked={question.required}
                onCheckedChange={(checked) => onChange({ ...question, required: checked })}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-repwell-teal-500">
              Description (optional)
            </Label>
            <Textarea
              value={question.description || ""}
              onChange={(e) => onChange({ ...question, description: e.target.value || undefined })}
              placeholder="Add helper text for respondents..."
              className="min-h-[60px] resize-none"
            />
          </div>

          {/* Type-specific configuration */}
          {(question.type === "rating" || question.type === "nps") && (
            <div className="space-y-3 rounded-lg border border-border p-4 bg-background-subtle">
              <Label className="text-sm font-medium text-repwell-teal-500">
                Scale Labels
              </Label>
              <div className="space-y-2">
                {question.type === "rating" && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Low end (1)</Label>
                      <Input
                        value={question.scale?.labels?.[0] || ""}
                        onChange={(e) => handleScaleLabelChange(0, e.target.value)}
                        placeholder="e.g., Strongly disagree"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">High end (5)</Label>
                      <Input
                        value={question.scale?.labels?.[4] || ""}
                        onChange={(e) => {
                          const labels = [...(question.scale?.labels || [])];
                          while (labels.length < 5) labels.push("");
                          labels[4] = e.target.value;
                          onChange({
                            ...question,
                            scale: { ...question.scale, labels },
                          });
                        }}
                        placeholder="e.g., Strongly agree"
                      />
                    </div>
                  </div>
                )}
                {question.type === "nps" && (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Detractors (0-6)</Label>
                      <Input
                        value={question.scale?.labels?.[0] || ""}
                        onChange={(e) => handleScaleLabelChange(0, e.target.value)}
                        placeholder="Not at all likely"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Passives (7-8)</Label>
                      <Input
                        value={question.scale?.labels?.[1] || ""}
                        onChange={(e) => handleScaleLabelChange(1, e.target.value)}
                        placeholder="Neutral"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Promoters (9-10)</Label>
                      <Input
                        value={question.scale?.labels?.[2] || ""}
                        onChange={(e) => handleScaleLabelChange(2, e.target.value)}
                        placeholder="Extremely likely"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {(question.type === "single_choice" || question.type === "multiple_choice") && (
            <div className="space-y-3 rounded-lg border border-border p-4 bg-background-subtle">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-repwell-teal-500">
                  Answer Options
                </Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddOption}
                  className="h-8 text-repwell-teal-300 hover:text-repwell-teal-400"
                >
                  <Plus weight="bold" size={16} className="mr-1" />
                  Add Option
                </Button>
              </div>
              <div className="space-y-2">
                {(question.options || []).map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-2">
                    <Input
                      value={option}
                      onChange={(e) => handleOptionChange(optionIndex, e.target.value)}
                      placeholder={`Option ${optionIndex + 1}`}
                    />
                    {(question.options || []).length > 2 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveOption(optionIndex)}
                        className="h-9 w-9 text-muted-foreground hover:text-destructive"
                      >
                        <X weight="bold" size={16} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
