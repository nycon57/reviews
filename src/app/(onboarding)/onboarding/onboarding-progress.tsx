"use client";

import { Check } from "lucide-react";
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

    // For free plans, map plan_selected directly to profile step
    let stepStatusIndex = -1;
    if (step.id === "plan") {
      stepStatusIndex = 0; // pending
    } else if (step.id === "payment") {
      stepStatusIndex = 1; // plan_selected
    } else if (step.id === "profile") {
      stepStatusIndex = needsPayment ? 2 : 1; // payment_complete or plan_selected for free
    } else if (step.id === "complete") {
      stepStatusIndex = needsPayment ? 3 : 2; // profile_complete
    }

    // Adjust for free plan where plan_selected means we should be on profile
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

  return (
    <nav aria-label="Onboarding progress" className="hidden md:block">
      <ol className="flex items-center gap-2">
        {steps.map((step, index) => {
          const state = getStepState(step);
          const isLast = index === steps.length - 1;

          return (
            <li key={step.id} className="flex items-center">
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                    state === "completed" && "bg-primary text-primary-foreground",
                    state === "current" && "bg-primary text-primary-foreground ring-2 ring-primary/30",
                    state === "upcoming" && "bg-muted text-muted-foreground"
                  )}
                >
                  {state === "completed" ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    "text-sm font-medium",
                    state === "completed" && "text-foreground",
                    state === "current" && "text-foreground",
                    state === "upcoming" && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "mx-3 h-px w-8",
                    state === "completed" ? "bg-primary" : "bg-muted"
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
