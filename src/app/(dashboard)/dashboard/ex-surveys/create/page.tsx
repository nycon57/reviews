/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck - ex_surveys tables not in generated types yet
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowLeft, SpinnerGap as Loader2 } from "@phosphor-icons/react";
import { format } from "date-fns";
import { createEXSurvey, getEXSurveyTemplates, getDepartments, launchEXSurvey } from "@/lib/ex-surveys/actions";
import { EXSurveyTemplate, Department } from "@/types/ex-survey.types";
import {
  WizardStepIndicator,
  WizardNavigation,
  TemplateStep,
  DetailsAudienceStep,
  ScheduleStep,
  ReviewStep,
  WizardStep,
  WizardFormData,
  INITIAL_FORM_DATA,
  stepVariants,
  AnimationDirection,
  isStepValid,
} from "@/components/ex-surveys/wizard";

export default function CreateEXSurveyPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get("template");
  const { toast } = useToast();

  // Data loading state
  const [templates, setTemplates] = useState<EXSurveyTemplate[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [direction, setDirection] = useState<AnimationDirection>(1);
  const [formData, setFormData] = useState<WizardFormData>(INITIAL_FORM_DATA);
  const [submitting, setSubmitting] = useState(false);

  // Load templates and departments
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
              setFormData((prev) => ({
                ...prev,
                templateId: templateIdParam,
                name: `${template.name} - ${format(new Date(), "MMM yyyy")}`,
                description: template.description || "",
              }));
              // Skip to step 2 if template is pre-selected
              setCurrentStep(2);
            }
          }
        }

        if (depsResult.data) {
          setDepartments(depsResult.data);
        }
      } catch {
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [templateIdParam]);

  // Navigation handlers
  const handleBack = () => {
    if (currentStep > 1) {
      setDirection(-1);
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  const handleNext = () => {
    if (currentStep < 4 && isStepValid(currentStep, formData)) {
      setDirection(1);
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    }
  };

  // Submit handler
  const handleSubmit = async () => {
    if (!isStepValid(currentStep, formData)) return;

    setSubmitting(true);
    setError(null);

    try {
      const selectedTemplate = templates.find((t) => t.id === formData.templateId);

      const result = await createEXSurvey({
        templateId: formData.templateId,
        name: formData.name,
        description: formData.description || undefined,
        surveyType: selectedTemplate?.surveyType || "engagement",
        isAnonymous: formData.isAnonymous,
        targetDepartmentId:
          formData.targetDepartmentId === "__all__" ? undefined : formData.targetDepartmentId,
        endDate: formData.endDate?.toISOString(),
      });

      if (result.success && result.data) {
        // Launch immediately if requested
        if (formData.launchImmediately) {
          const launchResult = await launchEXSurvey(result.data.id);
          if (!launchResult.success) {
            // Survey created but launch failed - notify user and still redirect
            toast({
              title: "Survey Created (Launch Failed)",
              description: launchResult.error || "The survey was created but failed to launch. You can launch it manually from the survey page.",
              variant: "destructive",
            });
          }
        }

        router.push(`/dashboard/ex-surveys/${result.data.id}`);
      } else {
        setError(result.error || "Failed to create survey");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  // Render current step
  const renderStep = () => {
    const stepProps = {
      formData,
      setFormData,
      templates,
      departments,
    };

    switch (currentStep) {
      case 1:
        return <TemplateStep {...stepProps} />;
      case 2:
        return <DetailsAudienceStep {...stepProps} />;
      case 3:
        return <ScheduleStep {...stepProps} />;
      case 4:
        return <ReviewStep {...stepProps} />;
      default:
        return null;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-repwell-teal-300" />
          <p className="mt-2 text-sm text-muted-foreground">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Page header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/ex-surveys/templates">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="font-display text-2xl font-bold text-repwell-teal-500">
            Create Survey
          </h1>
          <p className="text-muted-foreground">
            Set up a new employee experience survey
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <WizardStepIndicator currentStep={currentStep} />

      {/* Error display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Step content with animation */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={stepVariants}
            initial="initial"
            animate="enter"
            exit="exit"
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <WizardNavigation
        currentStep={currentStep}
        formData={formData}
        onBack={handleBack}
        onNext={handleNext}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
      />
    </div>
  );
}
