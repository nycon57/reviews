"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, SpinnerGap as Loader2 } from "@phosphor-icons/react";
import { WizardStep, isStepValid, WizardFormData } from "./types";

interface WizardNavigationProps {
  currentStep: WizardStep;
  formData: WizardFormData;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export function WizardNavigation({
  currentStep,
  formData,
  onBack,
  onNext,
  onSubmit,
  isSubmitting,
}: WizardNavigationProps) {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === 4;
  const canProceed = isStepValid(currentStep, formData);

  return (
    <div className="flex items-center justify-between border-t border-border pt-6">
      {/* Back button */}
      <div>
        {!isFirstStep && (
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            disabled={isSubmitting}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        )}
      </div>

      {/* Next/Submit button */}
      <div>
        {isLastStep ? (
          <Button
            type="button"
            onClick={onSubmit}
            disabled={!canProceed || isSubmitting}
            className="gap-2 bg-repwell-teal-300 hover:bg-repwell-teal-400"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating Survey...
              </>
            ) : (
              <>
                Create Survey
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onNext}
            disabled={!canProceed}
            className="gap-2 bg-repwell-teal-300 hover:bg-repwell-teal-400"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
