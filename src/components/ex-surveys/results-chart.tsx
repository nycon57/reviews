"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { EXSurveyResponse, EXSurveyAnswer } from "@/types/ex-survey.types";

interface EXResultsChartProps {
  responses: EXSurveyResponse[];
}

type ExtendedAnswer = { [K in keyof EXSurveyAnswer]: EXSurveyAnswer[K] } & { questionText?: string };

export function EXResultsChart({ responses }: EXResultsChartProps) {
  if (responses.length === 0) {
    return null;
  }

  // Aggregate answers by question
  const questionStats: Record<string, {
    text: string;
    type: string;
    values: (number | string)[];
    totalResponses: number;
  }> = {};

  responses.forEach((response) => {
    if (!response.answers) return;

    // SAFETY: EXSurveyResponse types answers as loose JSON records; every writer of the column
    // stores EXSurveyAnswer objects, optionally carrying the rendered questionText.
    const answers = response.answers as ExtendedAnswer[];
    answers.forEach((answer) => {
      if (!questionStats[answer.questionId]) {
        questionStats[answer.questionId] = {
          text: answer.questionText || answer.questionId,
          type: answer.questionType,
          values: [],
          totalResponses: 0,
        };
      }

      if (answer.value !== undefined && answer.value !== null) {
        if (Array.isArray(answer.value)) {
          answer.value.forEach((v) => {
            questionStats[answer.questionId].values.push(v);
          });
        } else {
          questionStats[answer.questionId].values.push(answer.value);
        }
        questionStats[answer.questionId].totalResponses++;
      }
    });
  });

  // Calculate stats for rating and NPS questions
  const ratingQuestions = Object.entries(questionStats)
    .filter(([, q]) => q.type === "rating" || q.type === "nps")
    .map(([id, q]) => {
      const numericValues = q.values
        .map((v) => (typeof v === "number" ? v : parseFloat(v as string)))
        .filter((v) => !isNaN(v));

      const avg = numericValues.length > 0
        ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length
        : 0;

      const max = q.type === "nps" ? 10 : 5;

      return {
        id,
        text: q.text,
        type: q.type,
        average: avg,
        max,
        percentage: (avg / max) * 100,
        responses: numericValues.length,
      };
    });

  // Get text responses for open-ended questions
  const textResponses = Object.entries(questionStats)
    .filter(([, q]) => q.type === "text" || q.type === "textarea")
    .map(([id, q]) => ({
      id,
      text: q.text,
      responses: q.values.filter((v) => typeof v === "string" && v.trim().length > 0) as string[],
    }))
    .filter((q) => q.responses.length > 0);

  return (
    <div className="space-y-6">
      {/* Rating questions breakdown */}
      {ratingQuestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Question Scores</CardTitle>
            <CardDescription>
              Average scores across all responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {ratingQuestions.map((question) => (
                <div key={question.id} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="line-clamp-1 flex-1 font-medium">{question.text}</span>
                    <span className="ml-4 shrink-0 text-muted-foreground">
                      {question.average.toFixed(1)} / {question.max}
                    </span>
                  </div>
                  <Progress
                    value={question.percentage}
                    className={`h-2 ${
                      question.percentage >= 70
                        ? "[&>div]:bg-green-500"
                        : question.percentage >= 50
                        ? "[&>div]:bg-yellow-500"
                        : "[&>div]:bg-red-500"
                    }`}
                  />
                  <p className="text-xs text-muted-foreground">
                    {question.responses} responses
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Open-ended responses preview */}
      {textResponses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Open-Ended Feedback</CardTitle>
            <CardDescription>
              Sample of qualitative responses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {textResponses.slice(0, 3).map((question) => (
                <div key={question.id} className="space-y-3">
                  <p className="font-medium">{question.text}</p>
                  <div className="space-y-2">
                    {question.responses.slice(0, 3).map((response, idx) => (
                      <div
                        key={idx}
                        className="rounded-lg border bg-muted/50 p-3 text-sm"
                      >
                        &ldquo;{response}&rdquo;
                      </div>
                    ))}
                    {question.responses.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{question.responses.length - 3} more responses
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
