"use client";

import { Check } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { WIZARD_STEPS, WizardStep } from "./types";

interface WizardStepIndicatorProps {
  currentStep: WizardStep;
}

type StepState = "completed" | "current" | "upcoming";

function getStepState(stepNumber: WizardStep, currentStep: WizardStep): StepState {
  if (stepNumber < currentStep) return "completed";
  if (stepNumber === currentStep) return "current";
  return "upcoming";
}

export function WizardStepIndicator({ currentStep }: WizardStepIndicatorProps) {
  return (
    <nav aria-label="Survey creation progress" className="w-full">
      <ol className="flex items-center justify-between">
        {WIZARD_STEPS.map((step, index) => {
          const state = getStepState(step.number, currentStep);
          const isLast = index === WIZARD_STEPS.length - 1;

          return (
            <li key={step.number} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-2">
                {/* Step circle */}
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-all duration-200",
                    state === "completed" && "bg-repwell-teal-300 text-white",
                    state === "current" && "bg-repwell-teal-300 text-white ring-4 ring-repwell-teal-300/20",
                    state === "upcoming" && "bg-muted text-muted-foreground"
                  )}
                >
                  {state === "completed" ? (
                    <Check weight="bold" className="h-5 w-5" />
                  ) : (
                    step.number
                  )}
                </div>

                {/* Step label */}
                <div className="text-center">
                  <p
                    className={cn(
                      "text-sm font-medium transition-colors",
                      state === "completed" && "text-label",
                      state === "current" && "text-heading",
                      state === "upcoming" && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </p>
                  <p className="hidden text-xs text-muted-foreground sm:block">
                    {step.description}
                  </p>
                </div>
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1 transition-colors sm:mx-4",
                    state === "completed" ? "bg-repwell-teal-300" : "bg-muted"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
