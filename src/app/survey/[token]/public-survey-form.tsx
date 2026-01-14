"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { QuestionRenderer } from "@/components/surveys/question-renderer";
import { submitSurveyResponse } from "@/lib/surveys/public-actions";
import type { PublicSurvey } from "@/lib/surveys/public-types";
import type { SurveyAnswer } from "@/types/survey.types";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Star, ExternalLink } from "lucide-react";

interface PublicSurveyFormProps {
  survey: PublicSurvey;
}

type SurveyState = "form" | "submitting" | "success" | "error";

export function PublicSurveyForm({ survey }: PublicSurveyFormProps) {
  const [answers, setAnswers] = useState<Record<string, SurveyAnswer["value"]>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [surveyState, setSurveyState] = useState<SurveyState>("form");
  const [showReviewRedirect, setShowReviewRedirect] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const { template, loanOfficer, organization } = survey;
  const sortedQuestions = [...template.questions].sort((a, b) => a.order - b.order);
  const totalQuestions = sortedQuestions.length;
  const progress = totalQuestions > 0 ? ((currentStep + 1) / totalQuestions) * 100 : 0;

  const currentQuestion = sortedQuestions[currentStep];
  const isLastQuestion = currentStep === totalQuestions - 1;
  const isFirstQuestion = currentStep === 0;

  const branding = template.branding || {};
  const thankYouConfig = template.thankYouConfig || {
    title: "Thank you for your feedback!",
    message: "We appreciate you taking the time to share your experience.",
  };

  // Apply custom branding colors
  const primaryColor = branding.primaryColor || organization.primaryColor || undefined;
  const backgroundColor = branding.backgroundColor || undefined;
  const logoUrl = branding.logo || organization.logoUrl;

  const handleAnswerChange = (questionId: string, value: SurveyAnswer["value"]) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
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

  const handleNext = () => {
    if (isLastQuestion) {
      handleSubmit();
    } else {
      setCurrentStep((prev) => Math.min(prev + 1, totalQuestions - 1));
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    setSurveyState("submitting");
    setSubmitError(null);

    startTransition(async () => {
      // Format answers for submission
      const formattedAnswers: SurveyAnswer[] = sortedQuestions
        .filter((q) => answers[q.id] !== undefined)
        .map((q) => ({
          questionId: q.id,
          questionType: q.type,
          value: answers[q.id],
        }));

      const result = await submitSurveyResponse({
        token: survey.token,
        answers: formattedAnswers,
      });

      if (result.success && result.data) {
        setShowReviewRedirect(result.data.showReviewRedirect);
        setSurveyState("success");
      } else {
        setSubmitError(result.error || "Failed to submit your response");
        setSurveyState("error");
      }
    });
  };

  // Submitting state
  if (surveyState === "submitting") {
    return (
      <SurveyContainer backgroundColor={backgroundColor}>
        <Card className="mx-auto max-w-xl shadow-lg">
          <CardContent className="flex min-h-[300px] flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-lg font-medium">Submitting your feedback...</p>
            <p className="mt-2 text-sm text-muted-foreground">Please wait a moment</p>
          </CardContent>
        </Card>
      </SurveyContainer>
    );
  }

  // Error state
  if (surveyState === "error") {
    return (
      <SurveyContainer backgroundColor={backgroundColor}>
        <Card className="mx-auto max-w-xl shadow-lg">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <svg
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold">Something went wrong</h2>
            <p className="mt-2 text-muted-foreground">{submitError}</p>
            <Button
              className="mt-6"
              onClick={() => {
                setSurveyState("form");
                setSubmitError(null);
              }}
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      </SurveyContainer>
    );
  }

  // Success / Thank you state
  if (surveyState === "success") {
    return (
      <SurveyContainer backgroundColor={backgroundColor}>
        <Card className="mx-auto max-w-xl shadow-lg">
          <CardContent className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <h2 className="text-2xl font-semibold">{thankYouConfig.title}</h2>
            <p className="mt-2 text-muted-foreground">{thankYouConfig.message}</p>

            {showReviewRedirect && (
              <div className="mt-8 rounded-lg border bg-muted/50 p-6">
                <div className="mb-3 flex justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className="h-6 w-6 fill-yellow-500 text-yellow-500"
                    />
                  ))}
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  Would you mind sharing your experience on Google? It helps others find great service.
                </p>
                <Button
                  className="gap-2"
                  style={primaryColor ? { backgroundColor: primaryColor, borderColor: primaryColor } : undefined}
                >
                  <ExternalLink className="h-4 w-4" />
                  Leave a Google Review
                </Button>
              </div>
            )}

            {logoUrl && (
              <div className="mt-8 flex justify-center opacity-60">
                <img
                  src={logoUrl}
                  alt={organization.name}
                  className="h-8 max-w-[150px] object-contain"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </SurveyContainer>
    );
  }

  // Empty survey state
  if (totalQuestions === 0) {
    return (
      <SurveyContainer backgroundColor={backgroundColor}>
        <Card className="mx-auto max-w-xl shadow-lg">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              This survey has no questions configured.
            </p>
          </CardContent>
        </Card>
      </SurveyContainer>
    );
  }

  // Survey form
  return (
    <SurveyContainer backgroundColor={backgroundColor}>
      <Card className="mx-auto max-w-xl shadow-lg">
        <CardHeader className="space-y-4 pb-4">
          {/* Logo */}
          {logoUrl && (
            <div className="flex justify-center">
              <img
                src={logoUrl}
                alt={organization.name}
                className="h-12 max-w-[200px] object-contain"
              />
            </div>
          )}

          {/* Survey Header */}
          <div className="text-center">
            <CardTitle className="text-xl">{template.name}</CardTitle>
            {template.description && (
              <CardDescription className="mt-1.5">
                {template.description}
              </CardDescription>
            )}
          </div>

          {/* Loan Officer Info */}
          <div className="flex items-center justify-center gap-3 rounded-lg bg-muted/50 p-3">
            {loanOfficer.photoUrl ? (
              <img
                src={loanOfficer.photoUrl}
                alt={loanOfficer.fullName}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-background"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary">
                {loanOfficer.fullName.charAt(0)}
              </div>
            )}
            <div className="text-left">
              <p className="font-medium">{loanOfficer.fullName}</p>
              {loanOfficer.title && (
                <p className="text-sm text-muted-foreground">{loanOfficer.title}</p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {branding.showProgressBar !== false && totalQuestions > 1 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Question {currentStep + 1} of {totalQuestions}
                </span>
                <span>{Math.round(progress)}% complete</span>
              </div>
              <Progress
                value={progress}
                className="h-2"
                style={
                  primaryColor
                    ? { ["--progress-color" as string]: primaryColor }
                    : undefined
                }
              />
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
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={isFirstQuestion || isPending}
              className={cn(
                "gap-1",
                isFirstQuestion && "invisible"
              )}
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              type="button"
              onClick={handleNext}
              disabled={!canProceed() || isPending}
              className="gap-1"
              style={
                primaryColor
                  ? { backgroundColor: primaryColor, borderColor: primaryColor }
                  : undefined
              }
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : isLastQuestion ? (
                "Submit"
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer with privacy note */}
      <p className="mt-4 text-center text-xs text-muted-foreground">
        Your feedback is confidential and helps us improve our service.
      </p>
    </SurveyContainer>
  );
}

// Container component with background color support
function SurveyContainer({
  children,
  backgroundColor,
}: {
  children: React.ReactNode;
  backgroundColor?: string;
}) {
  return (
    <div
      className="min-h-screen px-4 py-8 sm:py-12"
      style={backgroundColor ? { backgroundColor } : undefined}
    >
      {children}
    </div>
  );
}
