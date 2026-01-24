"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SpinnerGap as Loader2,
  CheckCircle as CheckCircle2,
  WarningCircle as AlertCircle,
  Star,
  BuildingOffice as Building2,
} from "@phosphor-icons/react";
import { getEXSurveyByToken, submitEXSurveyResponse, PublicEXSurvey } from "@/lib/ex-surveys/public-actions";
import { EXSurveyAnswer, TenureRange } from "@/types/ex-survey.types";

// Extended question type that handles both title and text fields
interface EXQuestion {
  id: string;
  type: string;
  title?: string;
  text?: string;
  description?: string;
  required: boolean;
  order: number;
  options?: string[];
  scale?: {
    min?: number;
    max?: number;
    labels?: string[];
  };
  config?: {
    maxRating?: number;
    options?: Array<{ id: string; label: string; value: string }>;
    allowMultiple?: boolean;
    labels?: Record<string, string>;
  };
}

// Helper to get question text (handles both title and text fields)
function getQuestionText(question: EXQuestion): string {
  return question.title || question.text || question.id;
}

const tenureOptions: { value: TenureRange; label: string }[] = [
  { value: "0-6months", label: "Less than 6 months" },
  { value: "6-12months", label: "6-12 months" },
  { value: "1-2years", label: "1-2 years" },
  { value: "2-5years", label: "2-5 years" },
  { value: "5-10years", label: "5-10 years" },
  { value: "10+years", label: "10+ years" },
];

export default function PublicEXSurveyPage() {
  const params = useParams();
  const token = params.token as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [survey, setSurvey] = useState<PublicEXSurvey | null>(null);
  const [completed, setCompleted] = useState(false);

  // Form state
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, EXSurveyAnswer>>({});
  const [tenure, setTenure] = useState<TenureRange | undefined>();

  useEffect(() => {
    async function loadSurvey() {
      setLoading(true);
      try {
        const result = await getEXSurveyByToken(token);
        if (result.success && result.data) {
          setSurvey(result.data);
        } else {
          setError(result.error || "Failed to load survey");
        }
      } catch (err) {
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }
    loadSurvey();
  }, [token]);

  const questions = (survey?.template.questions || []) as EXQuestion[];
  const totalSteps = questions.length + 1; // +1 for demographic step
  const progress = ((currentStep + 1) / totalSteps) * 100;

  function setAnswer(questionId: string, value: string | number | string[], questionType: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        questionId,
        questionType,
        value,
      },
    }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);

    try {
      const result = await submitEXSurveyResponse(
        token,
        Object.values(answers),
        { tenureRange: tenure }
      );

      if (result.success) {
        setCompleted(true);
      } else {
        setError(result.error || "Failed to submit survey");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  function canProceed(): boolean {
    if (currentStep === totalSteps - 1) {
      // On demographic step, can always proceed
      return true;
    }
    const question = questions[currentStep];
    if (!question) return false;
    if (!question.required) return true;
    const answer = answers[question.id];
    return answer !== undefined && answer.value !== "" && answer.value !== null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !survey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-lg font-semibold">Unable to Load Survey</h2>
            <p className="mt-2 text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (completed) {
    const thankYou = survey?.template.thankYouConfig;
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <Card className="max-w-md">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <h2 className="mt-4 text-lg font-semibold">
              {thankYou?.title || "Thank You!"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {thankYou?.message || "Your feedback has been submitted successfully."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        {/* Header */}
        <div className="mb-8 text-center">
          {survey?.organization.logoUrl ? (
            <Image
              src={survey.organization.logoUrl}
              alt={survey.organization.name}
              width={120}
              height={40}
              className="mx-auto mb-4"
            />
          ) : (
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
          )}
          <h1 className="text-xl font-semibold">{survey?.name}</h1>
          {survey?.description && (
            <p className="mt-2 text-muted-foreground">{survey.description}</p>
          )}
          {survey?.isAnonymous && (
            <p className="mt-2 text-sm text-green-600">
              This survey is anonymous. Your responses cannot be traced back to you.
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="mb-2 flex justify-between text-sm text-muted-foreground">
            <span>Question {Math.min(currentStep + 1, questions.length)} of {questions.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question card */}
        <Card>
          <CardContent className="py-8">
            {!isLastStep && currentQuestion ? (
              <QuestionRenderer
                question={currentQuestion}
                answer={answers[currentQuestion.id]}
                onAnswer={(value) => setAnswer(currentQuestion.id, value, currentQuestion.type)}
              />
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium">Almost done!</h3>
                  <p className="text-muted-foreground">
                    Help us understand your responses better with optional demographic information.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>How long have you been with the company?</Label>
                  <Select value={tenure} onValueChange={(v) => setTenure(v as TenureRange)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your tenure" />
                    </SelectTrigger>
                    <SelectContent>
                      {tenureOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
            disabled={currentStep === 0}
          >
            Previous
          </Button>

          {isLastStep ? (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Survey"
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentStep((s) => s + 1)}
              disabled={!canProceed()}
            >
              Next
            </Button>
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

interface QuestionRendererProps {
  question: EXQuestion;
  answer?: EXSurveyAnswer;
  onAnswer: (value: string | number | string[]) => void;
}

function QuestionRenderer({ question, answer, onAnswer }: QuestionRendererProps) {
  const value = answer?.value;

  switch (question.type) {
    case "nps":
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">{getQuestionText(question)}</h3>
            {question.description && (
              <p className="mt-1 text-muted-foreground">{question.description}</p>
            )}
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => onAnswer(score)}
                className={`h-10 w-10 rounded-lg border text-sm font-medium transition-colors ${
                  value === score
                    ? "border-primary bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {score}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Not at all likely</span>
            <span>Extremely likely</span>
          </div>
        </div>
      );

    case "rating": {
      const maxRating = question.scale?.max || 5;
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">{getQuestionText(question)}</h3>
            {question.description && (
              <p className="mt-1 text-muted-foreground">{question.description}</p>
            )}
          </div>
          <div className="flex justify-center gap-2">
            {Array.from({ length: maxRating }, (_, i) => i + 1).map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => onAnswer(rating)}
                className="group p-1"
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    typeof value === "number" && rating <= value
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-300 group-hover:text-yellow-300"
                  }`}
                />
              </button>
            ))}
          </div>
          {question.scale?.labels && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{question.scale.labels[0]}</span>
              <span>{question.scale.labels[question.scale.labels.length - 1]}</span>
            </div>
          )}
        </div>
      );
    }

    case "text":
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">{getQuestionText(question)}</h3>
            {question.description && (
              <p className="mt-1 text-muted-foreground">{question.description}</p>
            )}
          </div>
          <Textarea
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder="Enter your response..."
            rows={4}
          />
        </div>
      );

    case "single_choice":
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">{getQuestionText(question)}</h3>
            {question.description && (
              <p className="mt-1 text-muted-foreground">{question.description}</p>
            )}
          </div>
          <RadioGroup
            value={typeof value === "string" ? value : ""}
            onValueChange={onAnswer}
          >
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={option} />
                <Label htmlFor={option}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      );

    case "multiple_choice": {
      const selectedValues = Array.isArray(value) ? value : [];
      return (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium">{getQuestionText(question)}</h3>
            {question.description && (
              <p className="mt-1 text-muted-foreground">{question.description}</p>
            )}
          </div>
          <div className="space-y-2">
            {question.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={option}
                  checked={selectedValues.includes(option)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onAnswer([...selectedValues, option]);
                    } else {
                      onAnswer(selectedValues.filter((v) => v !== option));
                    }
                  }}
                />
                <Label htmlFor={option}>{option}</Label>
              </div>
            ))}
          </div>
        </div>
      );
    }

    default:
      return (
        <div className="text-muted-foreground">
          Unsupported question type: {question.type}
        </div>
      );
  }
}
