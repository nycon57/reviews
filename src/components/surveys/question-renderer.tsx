"use client";

import { cn } from "@/lib/utils";
import type { Question, SurveyAnswer } from "@/types/survey.types";
import {
  RatingQuestionRenderer,
  NPSQuestionRenderer,
  TextQuestionRenderer,
  MultipleChoiceQuestionRenderer,
} from "./question-types";

interface QuestionRendererProps {
  question: Question;
  value?: SurveyAnswer["value"];
  onChange?: (value: SurveyAnswer["value"]) => void;
  readonly?: boolean;
  showRequired?: boolean;
  showNumbers?: boolean;
  questionNumber?: number;
  className?: string;
}

export function QuestionRenderer({
  question,
  value,
  onChange,
  readonly = false,
  showRequired = true,
  showNumbers = false,
  questionNumber,
  className,
}: QuestionRendererProps) {
  const renderQuestion = () => {
    switch (question.type) {
      case "rating":
        return (
          <RatingQuestionRenderer
            question={question}
            value={value as number | undefined}
            onChange={(v) => onChange?.(v)}
            readonly={readonly}
          />
        );
      case "nps":
        return (
          <NPSQuestionRenderer
            question={question}
            value={value as number | undefined}
            onChange={(v) => onChange?.(v)}
            readonly={readonly}
          />
        );
      case "text":
        return (
          <TextQuestionRenderer
            question={question}
            value={value as string | undefined}
            onChange={(v) => onChange?.(v)}
            readonly={readonly}
          />
        );
      case "multiple_choice":
        return (
          <MultipleChoiceQuestionRenderer
            question={question}
            value={value as string[] | undefined}
            onChange={(v) => onChange?.(v)}
            readonly={readonly}
          />
        );
      default:
        return <div className="text-muted-foreground">Unknown question type</div>;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="space-y-1">
        <h3 className="text-base font-medium leading-tight">
          {showNumbers && questionNumber !== undefined && (
            <span className="mr-2 text-muted-foreground">{questionNumber}.</span>
          )}
          {question.title}
          {showRequired && question.required && (
            <span className="ml-1 text-destructive">*</span>
          )}
        </h3>
        {question.description && (
          <p className="text-sm text-muted-foreground">{question.description}</p>
        )}
      </div>
      <div>{renderQuestion()}</div>
    </div>
  );
}
