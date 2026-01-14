/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - ex_surveys tables not in generated types yet
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, CalendarIcon, Loader2, Users, Zap, LogOut, UserPlus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { createEXSurvey, getEXSurveyTemplates, getDepartments } from "@/lib/ex-surveys/actions";
import { EXSurveyTemplate, Department } from "@/types/ex-survey.types";

const templateIcons: Record<string, React.ReactNode> = {
  engagement: <Users className="h-5 w-5" />,
  pulse: <Zap className="h-5 w-5" />,
  exit: <LogOut className="h-5 w-5" />,
  onboarding: <UserPlus className="h-5 w-5" />,
};

export default function CreateEXSurveyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get("template");

  const [templates, setTemplates] = useState<EXSurveyTemplate[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templateIdParam || "");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [targetDepartmentId, setTargetDepartmentId] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [templatesResult, depsResult] = await Promise.all([
          getEXSurveyTemplates(),
          getDepartments(),
        ]);

        if (templatesResult.data) {
          setTemplates(templatesResult.data);
          // Auto-select template from URL param
          if (templateIdParam) {
            const template = templatesResult.data.find((t) => t.id === templateIdParam);
            if (template) {
              setName(`${template.name} - ${format(new Date(), "MMM yyyy")}`);
              setDescription(template.description || "");
            }
          }
        }
        if (depsResult.data) {
          setDepartments(depsResult.data);
        }
      } catch (err) {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [templateIdParam]);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const result = await createEXSurvey({
        templateId: selectedTemplateId,
        name,
        description,
        surveyType: selectedTemplate?.surveyType || "engagement",
        isAnonymous,
        targetDepartmentId: targetDepartmentId || undefined,
        endDate: endDate?.toISOString(),
      });

      if (result.success && result.data) {
        router.push(`/dashboard/ex-surveys/${result.data.id}`);
      } else {
        setError(result.error || "Failed to create survey");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/ex-surveys/templates">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create Survey</h1>
          <p className="text-muted-foreground">
            Configure your employee experience survey
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Template selection */}
        <Card>
          <CardHeader>
            <CardTitle>Survey Template</CardTitle>
            <CardDescription>
              Select the type of survey you want to create
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => {
                    setSelectedTemplateId(template.id);
                    if (!name || name.includes(" - ")) {
                      setName(`${template.name} - ${format(new Date(), "MMM yyyy")}`);
                    }
                    if (!description) {
                      setDescription(template.description || "");
                    }
                  }}
                  className={cn(
                    "flex flex-col items-start rounded-lg border p-4 text-left transition-colors hover:bg-muted/50",
                    selectedTemplateId === template.id && "border-primary bg-primary/5"
                  )}
                >
                  <div className="flex w-full items-start justify-between">
                    <div className="rounded-lg bg-muted p-2">
                      {templateIcons[template.surveyType] || <Users className="h-5 w-5" />}
                    </div>
                    {selectedTemplateId === template.id && (
                      <Badge variant="secondary">Selected</Badge>
                    )}
                  </div>
                  <div className="mt-3 font-medium">{template.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {template.questions.length} questions
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Survey details */}
        <Card>
          <CardHeader>
            <CardTitle>Survey Details</CardTitle>
            <CardDescription>
              Configure the basic information for your survey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Survey Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Q1 2024 Engagement Survey"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the survey purpose"
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label htmlFor="anonymous">Anonymous Responses</Label>
                <p className="text-sm text-muted-foreground">
                  Responses will not be linked to individual employees
                </p>
              </div>
              <Switch
                id="anonymous"
                checked={isAnonymous}
                onCheckedChange={setIsAnonymous}
              />
            </div>
          </CardContent>
        </Card>

        {/* Targeting */}
        <Card>
          <CardHeader>
            <CardTitle>Target Audience</CardTitle>
            <CardDescription>
              Choose who should receive this survey
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department (Optional)</Label>
              <Select value={targetDepartmentId} onValueChange={setTargetDepartmentId}>
                <SelectTrigger>
                  <SelectValue placeholder="All departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All departments</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Leave empty to include all employees
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>
              Set start and end dates for the survey (optional)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error display */}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex justify-end gap-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard/ex-surveys/templates">Cancel</Link>
          </Button>
          <Button type="submit" disabled={!selectedTemplateId || !name || submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Survey"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
