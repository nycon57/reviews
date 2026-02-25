"use client";

import {
  Check,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

interface OnboardingProgressProps {
  currentStatus: string;
  selectedPlan?: string | null;
}

interface Step {
  id: string;
  label: string;
  status: string[];
}

export function OnboardingProgress({ currentStatus, selectedPlan }: OnboardingProgressProps) {
  // Define steps based on whether payment is needed
  const needsPayment = selectedPlan && selectedPlan !== "free" && selectedPlan !== "enterprise";

  const allSteps: Step[] = [
    { id: "plan", label: "Select Plan", status: ["pending"] },
    { id: "payment", label: "Payment", status: ["plan_selected"] },
    { id: "profile", label: "Profile", status: ["payment_complete"] },
    { id: "complete", label: "Complete", status: ["profile_complete"] },
  ];

  // Filter out payment step if not needed
  const steps = needsPayment || currentStatus === "pending"
    ? allSteps
    : allSteps.filter(s => s.id !== "payment");

  // Determine current step index
  const getStepState = (step: Step): "completed" | "current" | "upcoming" => {
    const statusOrder = ["pending", "plan_selected", "payment_complete", "profile_complete", "completed"];
    const currentIndex = statusOrder.indexOf(currentStatus);

    let stepStatusIndex = -1;
    if (step.id === "plan") {
      stepStatusIndex = 0;
    } else if (step.id === "payment") {
      stepStatusIndex = 1;
    } else if (step.id === "profile") {
      stepStatusIndex = needsPayment ? 2 : 1;
    } else if (step.id === "complete") {
      stepStatusIndex = needsPayment ? 3 : 2;
    }

    if (!needsPayment && currentStatus === "plan_selected" && step.id === "plan") {
      return "completed";
    }

    if (currentIndex > stepStatusIndex) {
      return "completed";
    } else if (step.status.includes(currentStatus)) {
      return "current";
    }
    return "upcoming";
  };

  // Calculate progress for mobile bar
  const currentStepIndex = steps.findIndex(s => getStepState(s) === "current");
  const progressPercent = currentStepIndex >= 0
    ? Math.round(((currentStepIndex + 1) / steps.length) * 100)
    : 100;

  return (
    <>
      {/* Desktop: pill container with circles */}
      <nav aria-label="Onboarding progress" className="hidden md:block">
        <ol className="flex items-center gap-2 rounded-full bg-repwell-sage-100/30 px-4 py-2">
          {steps.map((step, index) => {
            const state = getStepState(step);
            const isLast = index === steps.length - 1;

            return (
              <li key={step.id} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium transition-all",
                      state === "completed" && "bg-repwell-teal-300 text-white",
                      state === "current" && "bg-repwell-teal-300 text-white ring-4 ring-repwell-teal-300/20",
                      state === "upcoming" && "bg-white text-muted-foreground border border-border"
                    )}
                  >
                    {state === "completed" ? (
                      <Check className="h-4 w-4" weight="bold" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium",
                      state === "completed" && "text-repwell-teal-400",
                      state === "current" && "text-repwell-teal-500",
                      state === "upcoming" && "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "mx-3 h-px w-8 transition-colors",
                      state === "completed" ? "bg-repwell-teal-300" : "bg-border"
                    )}
                  />
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Mobile: compact progress bar with step counter */}
      <div className="flex items-center gap-3 md:hidden">
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
          Step {currentStepIndex >= 0 ? currentStepIndex + 1 : steps.length} of {steps.length}
        </span>
        <div className="h-2 w-20 rounded-full bg-repwell-sage-100/50 overflow-hidden">
          <div
            className="h-full rounded-full bg-repwell-teal-300 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </>
  );
}
