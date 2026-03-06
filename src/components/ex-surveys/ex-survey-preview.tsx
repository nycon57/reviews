"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuestionRenderer } from "@/components/surveys/question-renderer";
import { adaptEXTemplateToSurveyTemplate } from "@/lib/ex-surveys/question-adapter";
import { CheckCircle, Eye } from "@phosphor-icons/react";
import type { EXSurveyTemplate } from "@/types/ex-survey.types";
import type { SurveyAnswer } from "@/types/survey.types";

interface EXSurveyPreviewProps {
  template: EXSurveyTemplate;
  className?: string;
  embedded?: boolean;
  showPreviewBadge?: boolean;
}

export function EXSurveyPreview({
  template,
  className,
  embedded = false,
  showPreviewBadge = true,
}: EXSurveyPreviewProps) {
  const [answers, setAnswers] = useState<Record<string, SurveyAnswer["value"]>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Convert EX template to standard format for rendering
  const adaptedTemplate = adaptEXTemplateToSurveyTemplate(template);
  const sortedQuestions = [...adaptedTemplate.questions].sort((a, b) => a.order - b.order);
  const totalQuestions = sortedQuestions.length;
  const progress = totalQuestions > 0 ? ((currentStep + 1) / totalQuestions) * 100 : 0;

  const currentQuestion = sortedQuestions[currentStep];
  const isLastQuestion = currentStep === totalQuestions - 1;
  const isFirstQuestion = currentStep === 0;

  const handleAnswerChange = (questionId: string, value: SurveyAnswer["value"]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleNext = () => {
    if (isLastQuestion) {
      setIsSubmitted(true);
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, totalQuestions - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleRestart = () => {
    setAnswers({});
    setCurrentStep(0);
    setIsSubmitted(false);
  };

  const canProceed = () => {
    if (!currentQuestion) return false;
    if (!currentQuestion.required) return true;
    const answer = answers[currentQuestion.id];
    if (answer === undefined || answer === null) return false;
    if (Array.isArray(answer)) return answer.length > 0;
    if (typeof answer === "string") return answer.trim().length > 0;
    return true;
  };

  const branding = template.branding || {};
  const thankYouConfig = template.thankYouConfig || {
    title: "Thank you!",
    message: "Your response has been recorded.",
  };

  // Thank you screen
  if (isSubmitted) {
    return (
      <div className={cn("mx-auto max-w-xl", className)}>
        <Card className="border border-border shadow-sm">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-repwell-sage-200/20 text-repwell-sage-200">
              <CheckCircle weight="fill" size={32} />
            </div>
            <h2 className="font-display text-2xl font-bold text-heading">
              {thankYouConfig.title}
            </h2>
            <p className="mt-3 font-sans text-label leading-relaxed">
              {thankYouConfig.message}
            </p>
            {showPreviewBadge && (
              <Button
                variant="outline"
                onClick={handleRestart}
                className="mt-6"
              >
                Restart Preview
              </Button>
            )}
          </CardContent>
        </Card>
        {showPreviewBadge && (
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Eye weight="regular" size={14} />
            <span>Preview mode - Responses are not saved</span>
          </div>
        )}
      </div>
    );
  }

  // Empty survey state
  if (totalQuestions === 0) {
    return (
      <div className={cn("mx-auto max-w-xl", className)}>
        <Card className="border border-border shadow-sm">
          <CardContent className="pt-8 pb-8 text-center">
            <p className="text-muted-foreground">
              No questions added to this survey yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div
      className={cn("mx-auto max-w-xl", className)}
      style={{
        ...(branding.backgroundColor && { backgroundColor: branding.backgroundColor }),
      }}
    >
      {/* Preview mode badge */}
      {showPreviewBadge && (
        <div className="mb-4 flex items-center justify-center gap-2">
          <Badge variant="secondary" className="bg-repwell-sage-100/50 dark:bg-repwell-teal-300/15 text-label">
            <Eye weight="regular" size={14} className="mr-1.5" />
            Preview Mode
          </Badge>
        </div>
      )}

      <Card className={cn("border border-border", !embedded && "shadow-sm")}>
        <CardHeader className="space-y-4 pb-4">
          {/* Logo */}
          {branding.logo && (
            <div className="flex justify-center">
              <img
                src={branding.logo}
                alt="Survey logo"
                className="h-12 max-w-[200px] object-contain"
              />
            </div>
          )}

          {/* Survey Title */}
          <div className="text-center">
            <CardTitle className="font-display text-xl font-bold text-heading">
              {template.name}
            </CardTitle>
            {template.description && (
              <CardDescription className="mt-1.5 font-sans text-label">
                {template.description}
              </CardDescription>
            )}
          </div>

          {/* Progress Bar */}
          {branding.showProgressBar !== false && totalQuestions > 1 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-sans text-muted-foreground">
                <span>Question {currentStep + 1} of {totalQuestions}</span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Question */}
          {currentQuestion && (
            <QuestionRenderer
              question={currentQuestion}
              value={answers[currentQuestion.id]}
              onChange={(value) => handleAnswerChange(currentQuestion.id, value)}
              showRequired
              showNumbers={branding.showQuestionNumbers}
              questionNumber={currentStep + 1}
            />
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isFirstQuestion}
              className={cn(isFirstQuestion && "invisible")}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="bg-repwell-teal-300 hover:bg-repwell-teal-400 text-white"
              style={{
                ...(branding.primaryColor && {
                  backgroundColor: branding.primaryColor,
                  borderColor: branding.primaryColor,
                }),
              }}
            >
              {isLastQuestion ? "Submit" : "Next"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview mode indicator */}
      {showPreviewBadge && !embedded && (
        <p className="mt-4 text-center text-xs font-sans text-muted-foreground">
          This is a preview. Responses are not saved.
        </p>
      )}
    </div>
  );
}
