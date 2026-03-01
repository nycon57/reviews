"use client";

import * as React from "react";
import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Flask as FlaskConical,
  ArrowLeft,
  Plus,
  Trash as Trash2,
  SpinnerGap as Loader2,
  Question as HelpCircle,
  Envelope as Mail,
  TextT as Type,
  FileText,
  Clock,
  Target,
  GearSix as Settings2,
} from "@phosphor-icons/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  createABTest,
  type CreateABTestInput,
  type TestType,
  type WinningMetric,
  type ABTestVariant,
  DEFAULT_TRAFFIC_SPLITS,
  MIN_SAMPLE_SIZE_PER_VARIANT,
  MAX_TEST_DURATION_HOURS,
  MIN_TEST_DURATION_HOURS,
} from "@/lib/email-ab-testing";
import { TrafficSplitSlider } from "@/components/admin/email-ab-tests";

// =============================================================================
// CONSTANTS
// =============================================================================

const EMAIL_TYPES = [
  { value: "survey_invitation", label: "Survey Invitation" },
  { value: "survey_reminder", label: "Survey Reminder" },
  { value: "survey_follow_up", label: "Survey Follow-up" },
  { value: "review_request", label: "Review Request" },
  { value: "welcome_1_access", label: "Welcome - Access Email" },
  { value: "welcome_2_profile", label: "Welcome - Profile Setup" },
  { value: "welcome_3_review", label: "Welcome - Review Request" },
  { value: "nurture_1", label: "Nurture Email 1" },
  { value: "nurture_2", label: "Nurture Email 2" },
  { value: "nurture_3", label: "Nurture Email 3" },
  { value: "reactivation", label: "Reactivation Email" },
  { value: "testimonial_request", label: "Testimonial Request" },
];

const TEST_TYPES: { value: TestType; label: string; description: string; icon: React.ElementType }[] = [
  {
    value: "subject_line",
    label: "Subject Line",
    description: "Test different subject lines to improve open rates",
    icon: Mail,
  },
  {
    value: "preview_text",
    label: "Preview Text",
    description: "Test preview/preheader text variations",
    icon: Type,
  },
  {
    value: "content",
    label: "Email Content",
    description: "Test different email body content",
    icon: FileText,
  },
  {
    value: "send_time",
    label: "Send Time",
    description: "Test optimal send time variations",
    icon: Clock,
  },
];

const WINNING_METRICS: { value: WinningMetric; label: string; description: string }[] = [
  {
    value: "open_rate",
    label: "Open Rate",
    description: "Best for subject line and send time tests",
  },
  {
    value: "click_rate",
    label: "Click Rate",
    description: "Best for content and CTA tests",
  },
];

const VARIANT_IDS = ["A", "B", "C", "D"];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function createDefaultVariant(id: string, isControl: boolean): ABTestVariant {
  return {
    id,
    name: isControl ? "Control" : `Variant ${id}`,
    isControl,
    subjectLine: "",
    previewText: "",
    content: "",
    sendTimeOffsetHours: 0,
  };
}

function calculateTrafficSplit(variantCount: number): Record<string, number> {
  const baseShare = Math.floor(100 / variantCount);
  const remainder = 100 - baseShare * variantCount;
  const split: Record<string, number> = {};

  for (let i = 0; i < variantCount; i++) {
    split[VARIANT_IDS[i]] = baseShare + (i === variantCount - 1 ? remainder : 0);
  }

  return split;
}

function formatSendTimeOffset(hours: number | undefined): string {
  const offset = hours || 0;
  if (offset === 0) return "Same as base time";
  if (offset > 0) return `${offset} hours later`;
  return `${Math.abs(offset)} hours earlier`;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function CreateABTestForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [emailType, setEmailType] = useState("");
  const [testType, setTestType] = useState<TestType>("subject_line");
  const [winningMetric, setWinningMetric] = useState<WinningMetric>("open_rate");
  const [variants, setVariants] = useState<ABTestVariant[]>([
    createDefaultVariant("A", true),
    createDefaultVariant("B", false),
  ]);
  const [trafficSplit, setTrafficSplit] = useState<Record<string, number>>(
    DEFAULT_TRAFFIC_SPLITS.two_way_equal
  );
  const [autoWinnerEnabled, setAutoWinnerEnabled] = useState(true);
  const [minSampleSize, setMinSampleSize] = useState(100);
  const [testDurationHours, setTestDurationHours] = useState(24);
  const [confidenceLevel, setConfidenceLevel] = useState(0.95);

  // Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Add variant
  const addVariant = () => {
    if (variants.length >= 4) {
      toast({ title: "Maximum 4 variants allowed", variant: "destructive" });
      return;
    }

    const nextId = VARIANT_IDS[variants.length];
    const newVariants = [...variants, createDefaultVariant(nextId, false)];
    setVariants(newVariants);
    setTrafficSplit(calculateTrafficSplit(newVariants.length));
  };

  // Remove variant
  const removeVariant = (id: string) => {
    if (variants.length <= 2) {
      toast({ title: "Minimum 2 variants required", variant: "destructive" });
      return;
    }

    // Can't remove control
    const variantToRemove = variants.find((v) => v.id === id);
    if (variantToRemove?.isControl) {
      toast({ title: "Cannot remove control variant", variant: "destructive" });
      return;
    }

    const newVariants = variants.filter((v) => v.id !== id);
    // Re-assign IDs to keep them sequential
    const reindexedVariants = newVariants.map((v, i) => ({
      ...v,
      id: VARIANT_IDS[i],
      name: v.isControl ? "Control" : `Variant ${VARIANT_IDS[i]}`,
    }));
    setVariants(reindexedVariants);
    setTrafficSplit(calculateTrafficSplit(reindexedVariants.length));
  };

  // Update variant field
  const updateVariant = (id: string, field: keyof ABTestVariant, value: string | number | boolean) => {
    setVariants((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  // Handle traffic split change
  const handleTrafficSplitChange = (newSplit: Record<string, number>) => {
    setTrafficSplit(newSplit);
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = "Test name is required";
    }

    if (!emailType) {
      newErrors.emailType = "Email type is required";
    }

    // Validate variants based on test type
    variants.forEach((variant) => {
      if (testType === "subject_line" && !variant.subjectLine?.trim()) {
        newErrors[`variant_${variant.id}_subject`] = "Subject line is required";
      }
      if (testType === "preview_text" && !variant.previewText?.trim()) {
        newErrors[`variant_${variant.id}_preview`] = "Preview text is required";
      }
      if (testType === "content" && !variant.content?.trim()) {
        newErrors[`variant_${variant.id}_content`] = "Content is required";
      }
    });

    if (minSampleSize < MIN_SAMPLE_SIZE_PER_VARIANT) {
      newErrors.minSampleSize = `Minimum sample size is ${MIN_SAMPLE_SIZE_PER_VARIANT}`;
    }

    if (testDurationHours < MIN_TEST_DURATION_HOURS || testDurationHours > MAX_TEST_DURATION_HOURS) {
      newErrors.testDurationHours = `Duration must be between ${MIN_TEST_DURATION_HOURS} and ${MAX_TEST_DURATION_HOURS} hours`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({ title: "Please fix the errors before submitting", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const input: CreateABTestInput = {
        name: name.trim(),
        description: description.trim() || null,
        emailType,
        testType,
        winningMetric,
        variants,
        trafficSplit,
        autoWinnerEnabled,
        minSampleSize,
        testDurationHours,
        confidenceLevel,
      };

      const result = await createABTest(input);

      if (result.success && result.data) {
        toast({ title: "A/B test created successfully" });
        router.push(`/dashboard/admin/email-ab-tests/${result.data.id}`);
      } else {
        toast({ title: result.error || "Failed to create A/B test", variant: "destructive" });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/dashboard/admin/email-ab-tests">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-repwell-teal-300/10">
          <FlaskConical className="h-6 w-6 text-repwell-teal-300" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-display leading-tight text-repwell-teal-500">Create A/B Test</h1>
          <p className="text-sm leading-snug text-repwell-teal-300">
            Set up a new email A/B test to optimize engagement
          </p>
        </div>
      </div>

      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Name and describe your A/B test</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Test Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Survey Subject Line Test - January 2025"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what you're testing and why..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailType">
              Email Type <span className="text-red-500">*</span>
            </Label>
            <Select value={emailType} onValueChange={setEmailType}>
              <SelectTrigger className={errors.emailType ? "border-red-500" : ""}>
                <SelectValue placeholder="Select email type" />
              </SelectTrigger>
              <SelectContent>
                {EMAIL_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.emailType && <p className="text-sm text-red-500">{errors.emailType}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Test Type */}
      <Card>
        <CardHeader>
          <CardTitle>Test Type</CardTitle>
          <CardDescription>What aspect of the email do you want to test?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {TEST_TYPES.map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setTestType(type.value)}
                  className={cn(
                    "flex flex-col items-center p-4 rounded-lg border-2 transition-all text-center",
                    testType === type.value
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg mb-2",
                      testType === type.value ? "bg-primary/10 text-primary" : "bg-gray-100"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium">{type.label}</span>
                  <span className="text-xs text-muted-foreground mt-1">{type.description}</span>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Winning Metric */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Winning Metric
          </CardTitle>
          <CardDescription>How should the winner be determined?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {WINNING_METRICS.map((metric) => (
              <button
                key={metric.value}
                type="button"
                onClick={() => setWinningMetric(metric.value)}
                className={cn(
                  "flex flex-col p-4 rounded-lg border-2 transition-all text-left",
                  winningMetric === metric.value
                    ? "border-primary bg-primary/5"
                    : "border-gray-200 hover:border-gray-300"
                )}
              >
                <span className="font-medium">{metric.label}</span>
                <span className="text-sm text-muted-foreground">{metric.description}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Variants */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Variants</CardTitle>
              <CardDescription>Configure the variations you want to test</CardDescription>
            </div>
            {variants.length < 4 && (
              <Button type="button" variant="outline" size="sm" onClick={addVariant}>
                <Plus className="h-4 w-4 mr-1" />
                Add Variant
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {variants.map((variant) => (
            <div
              key={variant.id}
              className={cn(
                "p-4 rounded-lg border",
                variant.isControl && "bg-blue-50 border-blue-200"
              )}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Badge variant={variant.isControl ? "default" : "outline"}>
                    {variant.id}
                  </Badge>
                  <Input
                    value={variant.name}
                    onChange={(e) => updateVariant(variant.id, "name", e.target.value)}
                    className="w-40 h-8"
                    placeholder="Variant name"
                  />
                  {variant.isControl && (
                    <Badge variant="secondary" className="text-xs">
                      Control
                    </Badge>
                  )}
                </div>
                {!variant.isControl && variants.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariant(variant.id)}
                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Test type specific fields */}
              {testType === "subject_line" && (
                <div className="space-y-2">
                  <Label htmlFor={`subject_${variant.id}`}>
                    Subject Line <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`subject_${variant.id}`}
                    value={variant.subjectLine || ""}
                    onChange={(e) => updateVariant(variant.id, "subjectLine", e.target.value)}
                    placeholder="Enter subject line..."
                    className={errors[`variant_${variant.id}_subject`] ? "border-red-500" : ""}
                  />
                  {errors[`variant_${variant.id}_subject`] && (
                    <p className="text-sm text-red-500">{errors[`variant_${variant.id}_subject`]}</p>
                  )}
                </div>
              )}

              {testType === "preview_text" && (
                <div className="space-y-2">
                  <Label htmlFor={`preview_${variant.id}`}>
                    Preview Text <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id={`preview_${variant.id}`}
                    value={variant.previewText || ""}
                    onChange={(e) => updateVariant(variant.id, "previewText", e.target.value)}
                    placeholder="Enter preview text..."
                    className={errors[`variant_${variant.id}_preview`] ? "border-red-500" : ""}
                  />
                  {errors[`variant_${variant.id}_preview`] && (
                    <p className="text-sm text-red-500">{errors[`variant_${variant.id}_preview`]}</p>
                  )}
                </div>
              )}

              {testType === "content" && (
                <div className="space-y-2">
                  <Label htmlFor={`content_${variant.id}`}>
                    Content <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id={`content_${variant.id}`}
                    value={variant.content || ""}
                    onChange={(e) => updateVariant(variant.id, "content", e.target.value)}
                    placeholder="Enter email content or template variables..."
                    rows={4}
                    className={errors[`variant_${variant.id}_content`] ? "border-red-500" : ""}
                  />
                  {errors[`variant_${variant.id}_content`] && (
                    <p className="text-sm text-red-500">{errors[`variant_${variant.id}_content`]}</p>
                  )}
                </div>
              )}

              {testType === "send_time" && (
                <div className="space-y-2">
                  <Label htmlFor={`sendtime_${variant.id}`}>
                    Send Time Offset (hours from base time)
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id={`sendtime_${variant.id}`}
                      type="number"
                      min="-24"
                      max="24"
                      value={variant.sendTimeOffsetHours || 0}
                      onChange={(e) =>
                        updateVariant(variant.id, "sendTimeOffsetHours", parseInt(e.target.value) || 0)
                      }
                      className="w-24"
                    />
                    <span className="text-sm text-muted-foreground">
                      {formatSendTimeOffset(variant.sendTimeOffsetHours)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Traffic Split */}
      <Card>
        <CardHeader>
          <CardTitle>Traffic Split</CardTitle>
          <CardDescription>
            How should traffic be distributed between variants?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TrafficSplitSlider
            variants={variants.map((v) => ({ id: v.id, name: v.name }))}
            value={trafficSplit}
            onChange={handleTrafficSplitChange}
          />
        </CardContent>
      </Card>

      {/* Test Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings2 className="h-5 w-5" />
            Test Settings
          </CardTitle>
          <CardDescription>Configure when and how the test should complete</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Auto Winner */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center gap-2">
                Auto-declare Winner
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        Automatically declare a winner when statistical significance is
                        reached and minimum sample size is met
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically end the test when a winner is found
              </p>
            </div>
            <Switch checked={autoWinnerEnabled} onCheckedChange={setAutoWinnerEnabled} />
          </div>

          <Separator />

          <div className="grid gap-6 sm:grid-cols-3">
            {/* Min Sample Size */}
            <div className="space-y-2">
              <Label htmlFor="minSampleSize" className="flex items-center gap-2">
                Min Sample Size
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        Minimum number of emails per variant before a winner can be declared.
                        Higher values increase statistical reliability.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="minSampleSize"
                type="number"
                min={MIN_SAMPLE_SIZE_PER_VARIANT}
                value={minSampleSize}
                onChange={(e) => setMinSampleSize(parseInt(e.target.value) || MIN_SAMPLE_SIZE_PER_VARIANT)}
                className={errors.minSampleSize ? "border-red-500" : ""}
              />
              {errors.minSampleSize && (
                <p className="text-sm text-red-500">{errors.minSampleSize}</p>
              )}
            </div>

            {/* Test Duration */}
            <div className="space-y-2">
              <Label htmlFor="testDurationHours" className="flex items-center gap-2">
                Test Duration (hours)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        Maximum duration the test will run. The test may end earlier
                        if auto-winner is enabled and conditions are met.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input
                id="testDurationHours"
                type="number"
                min={MIN_TEST_DURATION_HOURS}
                max={MAX_TEST_DURATION_HOURS}
                value={testDurationHours}
                onChange={(e) => setTestDurationHours(parseInt(e.target.value) || 24)}
                className={errors.testDurationHours ? "border-red-500" : ""}
              />
              {errors.testDurationHours && (
                <p className="text-sm text-red-500">{errors.testDurationHours}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Max: {MAX_TEST_DURATION_HOURS} hours (30 days)
              </p>
            </div>

            {/* Confidence Level */}
            <div className="space-y-2">
              <Label htmlFor="confidenceLevel" className="flex items-center gap-2">
                Confidence Level
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="h-4 w-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>
                        Statistical confidence required to declare a winner.
                        95% is standard, 99% is more conservative.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Select
                value={confidenceLevel.toString()}
                onValueChange={(v) => setConfidenceLevel(parseFloat(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.90">90%</SelectItem>
                  <SelectItem value="0.95">95% (Recommended)</SelectItem>
                  <SelectItem value="0.99">99%</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button type="button" variant="outline" asChild>
          <Link href="/dashboard/admin/email-ab-tests">Cancel</Link>
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <FlaskConical className="mr-2 h-4 w-4" />
              Create Test
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
