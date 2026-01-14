"use client";

import { cn } from "@/lib/utils";
import { Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import type {
  RatingQuestion,
  NPSQuestion,
  TextQuestion,
  MultipleChoiceQuestion,
} from "@/types/survey.types";

// Star Rating Component
interface RatingQuestionRendererProps {
  question: RatingQuestion;
  value?: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
}

export function RatingQuestionRenderer({
  question,
  value,
  onChange,
  readonly = false,
}: RatingQuestionRendererProps) {
  const { maxRating, labels } = question.config;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-1 sm:gap-2">
        {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => (
          <button
            key={rating}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(rating)}
            className={cn(
              "group relative flex h-10 w-10 items-center justify-center rounded-lg transition-all sm:h-12 sm:w-12",
              !readonly && "hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              value && rating <= value
                ? "text-yellow-500"
                : "text-muted-foreground/30 hover:text-yellow-400/70"
            )}
            aria-label={`Rate ${rating} out of ${maxRating}`}
          >
            <Star
              className={cn(
                "h-7 w-7 sm:h-8 sm:w-8 transition-all",
                value && rating <= value && "fill-current"
              )}
            />
          </button>
        ))}
      </div>
      {labels && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{labels.low}</span>
          <span>{labels.high}</span>
        </div>
      )}
    </div>
  );
}

// NPS (Net Promoter Score) Component
interface NPSQuestionRendererProps {
  question: NPSQuestion;
  value?: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
}

export function NPSQuestionRenderer({
  question,
  value,
  onChange,
  readonly = false,
}: NPSQuestionRendererProps) {
  const { labels } = question.config;

  const _getScoreColor = (score: number) => {
    if (score <= 6) return "bg-red-500 hover:bg-red-600";
    if (score <= 8) return "bg-yellow-500 hover:bg-yellow-600";
    return "bg-green-500 hover:bg-green-600";
  };

  const getSelectedColor = (score: number, selected: number | undefined) => {
    if (selected === undefined || selected !== score) return "";
    if (score <= 6) return "bg-red-500 text-white ring-2 ring-red-500 ring-offset-2";
    if (score <= 8) return "bg-yellow-500 text-white ring-2 ring-yellow-500 ring-offset-2";
    return "bg-green-500 text-white ring-2 ring-green-500 ring-offset-2";
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
        {Array.from({ length: 11 }, (_, i) => i).map((score) => (
          <button
            key={score}
            type="button"
            disabled={readonly}
            onClick={() => onChange?.(score)}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg border text-sm font-medium transition-all sm:h-11 sm:w-11",
              !readonly && "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              value === score
                ? getSelectedColor(score, value)
                : "bg-background hover:border-primary/50"
            )}
            aria-label={`Score ${score}`}
          >
            {score}
          </button>
        ))}
      </div>
      {labels && (
        <div className="flex justify-between px-2 text-xs text-muted-foreground">
          <span>{labels.detractor}</span>
          <span className="hidden sm:inline">{labels.passive}</span>
          <span>{labels.promoter}</span>
        </div>
      )}
    </div>
  );
}

// Text Question Component
interface TextQuestionRendererProps {
  question: TextQuestion;
  value?: string;
  onChange?: (value: string) => void;
  readonly?: boolean;
}

export function TextQuestionRenderer({
  question,
  value,
  onChange,
  readonly = false,
}: TextQuestionRendererProps) {
  const { multiline, placeholder, maxLength, minLength } = question.config;

  const charCount = value?.length || 0;
  const showCharCount = maxLength !== undefined;

  if (multiline) {
    return (
      <div className="space-y-2">
        <Textarea
          value={value || ""}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          disabled={readonly}
          maxLength={maxLength}
          minLength={minLength}
          className="min-h-[120px] resize-none"
        />
        {showCharCount && (
          <div className="text-right text-xs text-muted-foreground">
            {charCount}/{maxLength}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Input
        value={value || ""}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={readonly}
        maxLength={maxLength}
        minLength={minLength}
      />
      {showCharCount && (
        <div className="text-right text-xs text-muted-foreground">
          {charCount}/{maxLength}
        </div>
      )}
    </div>
  );
}

// Multiple Choice Component
interface MultipleChoiceQuestionRendererProps {
  question: MultipleChoiceQuestion;
  value?: string[];
  onChange?: (value: string[]) => void;
  readonly?: boolean;
}

export function MultipleChoiceQuestionRenderer({
  question,
  value = [],
  onChange,
  readonly = false,
}: MultipleChoiceQuestionRendererProps) {
  const { options, allowMultiple, allowOther } = question.config;

  const handleOptionChange = (optionValue: string, checked: boolean) => {
    if (readonly) return;

    if (allowMultiple) {
      if (checked) {
        onChange?.([...value, optionValue]);
      } else {
        onChange?.(value.filter((v) => v !== optionValue));
      }
    } else {
      onChange?.(checked ? [optionValue] : []);
    }
  };

  return (
    <div className="space-y-3">
      {options.map((option) => (
        <div key={option.id} className="flex items-center space-x-3">
          <Checkbox
            id={option.id}
            checked={value.includes(option.value)}
            onCheckedChange={(checked) =>
              handleOptionChange(option.value, checked === true)
            }
            disabled={readonly}
            className={cn(
              !allowMultiple && "rounded-full"
            )}
          />
          <Label
            htmlFor={option.id}
            className={cn(
              "text-sm font-normal cursor-pointer",
              readonly && "cursor-default"
            )}
          >
            {option.label}
          </Label>
        </div>
      ))}
      {allowOther && (
        <div className="flex items-center space-x-3">
          <Checkbox
            id="other"
            checked={value.some((v) => v.startsWith("other:"))}
            onCheckedChange={(checked) => {
              if (checked) {
                onChange?.([...value.filter((v) => !v.startsWith("other:")), "other:"]);
              } else {
                onChange?.(value.filter((v) => !v.startsWith("other:")));
              }
            }}
            disabled={readonly}
            className={cn(!allowMultiple && "rounded-full")}
          />
          <div className="flex flex-1 items-center gap-2">
            <Label
              htmlFor="other"
              className={cn(
                "text-sm font-normal cursor-pointer whitespace-nowrap",
                readonly && "cursor-default"
              )}
            >
              Other:
            </Label>
            <Input
              placeholder="Please specify..."
              value={value.find((v) => v.startsWith("other:"))?.replace("other:", "") || ""}
              onChange={(e) => {
                const otherValues = value.filter((v) => !v.startsWith("other:"));
                if (e.target.value) {
                  onChange?.([...otherValues, `other:${e.target.value}`]);
                } else {
                  onChange?.(otherValues);
                }
              }}
              disabled={readonly || !value.some((v) => v.startsWith("other:"))}
              className="h-8 flex-1"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Export all for use in index
export const QuestionTypes = {
  RatingQuestionRenderer,
  NPSQuestionRenderer,
  TextQuestionRenderer,
  MultipleChoiceQuestionRenderer,
};
