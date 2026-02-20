"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { QuestionRenderer } from "@/components/surveys/question-renderer";
import { CheckCircle } from "@phosphor-icons/react";
import type { SurveyTemplate, SurveyAnswer } from "@/types/survey.types";

interface SurveyPreviewProps {
  survey: SurveyTemplate;
  className?: string;
  embedded?: boolean;
  showPreviewBadge?: boolean;
  showRestart?: boolean;
  submitClassName?: string;
}

export function SurveyPreview({
  survey,
  className,
  embedded = false,
  showPreviewBadge = true,
  showRestart = false,
  submitClassName,
}: SurveyPreviewProps) {
  const [answers, setAnswers] = useState<Record<string, SurveyAnswer["value"]>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const sortedQuestions = [...survey.questions].sort((a, b) => a.order - b.order);
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

  // Thank you screen
  if (isSubmitted) {
    const thankYouConfig = survey.thankYouConfig || {
      title: "Thank you!",
      message: "Your response has been recorded.",
    };

    return (
      <div className={cn("mx-auto max-w-xl", className)}>
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
              <CheckCircle weight="fill" className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-semibold">{thankYouConfig.title}</h2>
            <p className="mt-2 text-muted-foreground">{thankYouConfig.message}</p>
            {thankYouConfig.showReviewRedirect && thankYouConfig.redirectUrl && (
              <Button
                className="mt-6"
                variant="outline"
                onClick={() => window.open(thankYouConfig.redirectUrl, "_blank", "noopener,noreferrer")}
              >
                Leave a Public Review
              </Button>
            )}
            {showRestart && (
              <Button variant="outline" onClick={handleRestart} className="mt-6">
                Restart Preview
              </Button>
            )}
          </CardContent>
        </Card>
        {showPreviewBadge && !embedded && (
          <p className="mt-4 text-center text-xs text-muted-foreground">
            This is a preview. Responses are not saved.
          </p>
        )}
      </div>
    );
  }

  // Empty survey state
  if (totalQuestions === 0) {
    return (
      <div className={cn("mx-auto max-w-xl", className)}>
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <p className="text-muted-foreground">
              No questions added to this survey yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const branding = survey.branding || {};

  return (
    <div
      className={cn("mx-auto max-w-xl", className)}
      style={{
        ...(branding.backgroundColor && { backgroundColor: branding.backgroundColor }),
      }}
    >
      <Card className={cn(!embedded && "shadow-lg")}>
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
            <CardTitle className="text-xl">{survey.name}</CardTitle>
            {survey.description && (
              <CardDescription className="mt-1.5">
                {survey.description}
              </CardDescription>
            )}
          </div>

          {/* Progress Bar */}
          {branding.showProgressBar !== false && totalQuestions > 1 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
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
              className={submitClassName}
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
        <p className="mt-4 text-center text-xs text-muted-foreground">
          This is a preview. Responses are not saved.
        </p>
      )}
    </div>
  );
}
