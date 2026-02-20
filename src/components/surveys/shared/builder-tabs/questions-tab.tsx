"use client";

import { ReactNode } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "@phosphor-icons/react";
import { SharedQuestionEditor } from "../question-editor";
import type { Question, QuestionType } from "@/types/survey.types";
import type { QuestionEditorConfig } from "../types";

interface QuestionsTabProps {
  name: string;
  onNameChange: (name: string) => void;
  description: string;
  onDescriptionChange: (description: string) => void;
  questions: Question[];
  onQuestionChange: (index: number, question: Question) => void;
  onQuestionDelete: (index: number) => void;
  onQuestionDuplicate?: (index: number) => void;
  onAddQuestion: (type: QuestionType) => void;
  questionEditorConfig: QuestionEditorConfig;
  /** Render extra fields in the survey details card */
  renderExtraDetails?: () => ReactNode;
  /** Error message to show */
  error?: string;
}

export function QuestionsTab({
  name,
  onNameChange,
  description,
  onDescriptionChange,
  questions,
  onQuestionChange,
  onQuestionDelete,
  onQuestionDuplicate,
  onAddQuestion,
  questionEditorConfig,
  renderExtraDetails,
  error,
}: QuestionsTabProps) {
  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Survey Details</CardTitle>
          <CardDescription>
            Basic information about your survey
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Template Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="e.g., Post-Transaction Survey"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder="Describe the purpose of this survey..."
              className="min-h-[80px]"
            />
          </div>
          {renderExtraDetails?.()}
        </CardContent>
      </Card>

      {/* Question List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Questions</CardTitle>
              <CardDescription>
                Add and arrange your survey questions
              </CardDescription>
            </div>
            <Select onValueChange={(value) => onAddQuestion(value as QuestionType)}>
              <SelectTrigger className="w-[180px]">
                <Plus className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Add Question" />
              </SelectTrigger>
              <SelectContent>
                {questionEditorConfig.availableTypes.map(({ value, label, icon }) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex items-center gap-2">
                      {icon}
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {questions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-muted-foreground">
                No questions yet. Click &quot;Add Question&quot; to get started.
              </p>
            </div>
          ) : (
            questions.map((question, index) => (
              <SharedQuestionEditor
                key={question.id}
                question={question}
                onChange={(q) => onQuestionChange(index, q)}
                onDelete={() => onQuestionDelete(index)}
                onDuplicate={onQuestionDuplicate ? () => onQuestionDuplicate(index) : undefined}
                config={questionEditorConfig}
              />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
