"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle,
  Sparkle as Sparkles,
  User,
  Buildings,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { selectPlan, createOnboardingCheckout } from "@/lib/onboarding/actions";
import type { SelectPlanInput } from "@/lib/onboarding/schemas";
import { staggerContainer, fadeInUp } from "@/lib/motion";

interface PlanOption {
  id: "basic" | "pro" | "enterprise";
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  description: string;
  features: string[];
  highlighted?: boolean;
  badge?: string;
  icon: React.ElementType;
}

const plans: PlanOption[] = [
  {
    id: "basic",
    name: "Basic",
    monthlyPrice: 49,
    yearlyPrice: 39,
    description: "Perfect for individuals",
    icon: User,
    features: [
      "1 user account",
      "Unlimited surveys",
      "Review monitoring",
      "Basic analytics",
      "Google Business integration",
      "Email support",
      "7-day free trial",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 149,
    yearlyPrice: 119,
    description: "For individuals who need AI insights",
    icon: Sparkles,
    features: [
      "Everything in Basic",
      "AI-powered insights",
      "AI visibility reports",
      "Advanced analytics",
      "API access",
      "Priority support",
      "7-day free trial",
    ],
    highlighted: true,
    badge: "Most Popular",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: -1,
    yearlyPrice: -1,
    description: "For teams and organizations",
    icon: Buildings,
    features: [
      "Everything in Pro",
      "Unlimited team members",
      "Team management",
      "Manager dashboard",
      "Leaderboards & gamification",
      "Employee surveys",
      "Dedicated success manager",
      "SSO/SAML support",
    ],
  },
];

export function PlanSelectionClient() {
  const router = useRouter();
  const [isYearly, setIsYearly] = React.useState(false);
  const [loadingPlan, setLoadingPlan] = React.useState<string | null>(null);

  const handleSelectPlan = async (planId: PlanOption["id"]) => {
    if (planId === "enterprise") {
      router.push("/contact?plan=enterprise");
      return;
    }

    setLoadingPlan(planId);

    try {
      const input: SelectPlanInput = {
        plan: planId,
        billingCycle: isYearly ? "year" : "month",
      };

      const selectResult = await selectPlan(input);

      if (!selectResult.success) {
        toast({
          title: "Error",
          description: selectResult.error || "Failed to select plan",
          variant: "destructive",
        });
        return;
      }

      const checkoutResult = await createOnboardingCheckout();

      if (checkoutResult.success && checkoutResult.url) {
        window.location.href = checkoutResult.url;
      } else {
        toast({
          title: "Error",
          description: checkoutResult.error || "Failed to create checkout session",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="text-center space-y-4">
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-repwell-teal-500">
          Choose your plan
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Start with a 7-day free trial on Basic or Pro. Enterprise accounts are
          billed via invoice. Cancel anytime.
        </p>
      </motion.div>

      {/* Billing toggle in pill container */}
      <motion.div variants={fadeInUp} className="flex items-center justify-center">
        <div className="flex items-center gap-4 rounded-full bg-repwell-sage-100/30 px-6 py-2.5">
          <Label htmlFor="billing-toggle" className={cn("text-sm", !isYearly && "font-medium text-repwell-teal-500")}>
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <Label htmlFor="billing-toggle" className={cn("text-sm flex items-center gap-2", isYearly && "font-medium text-repwell-teal-500")}>
            Yearly
            <span className="inline-flex items-center rounded-full bg-repwell-teal-300 px-2.5 py-0.5 text-xs font-medium text-white">
              Save 20%
            </span>
          </Label>
        </div>
      </motion.div>

      {/* Plan cards */}
      <motion.div
        variants={fadeInUp}
        className="grid md:grid-cols-3 gap-4 lg:gap-6 max-w-5xl mx-auto"
      >
        {plans.map((plan) => {
          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
          const isLoading = loadingPlan === plan.id;
          const IconComponent = plan.icon;

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col overflow-hidden transition-all duration-200",
                plan.highlighted
                  ? "border-repwell-teal-300 shadow-lg ring-1 ring-repwell-teal-300/20 lg:scale-105"
                  : "hover:border-repwell-teal-300/50 hover:shadow-md"
              )}
            >
              {/* Accent bar at top */}
              <div className={cn(
                "h-1.5",
                plan.highlighted
                  ? "bg-gradient-to-r from-repwell-teal-300 to-repwell-sage-200"
                  : "bg-gradient-to-r from-repwell-sage-100 to-transparent"
              )} />

              {plan.badge && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="inline-flex items-center gap-1 rounded-full bg-repwell-teal-300 px-3 py-1 text-xs font-medium text-white shadow-md">
                    <Sparkles className="h-3 w-3" weight="fill" />
                    {plan.badge}
                  </span>
                </div>
              )}

              {/* Gradient header */}
              <CardHeader variant="plain" className="text-center pb-4">
                <div className="flex justify-center mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                    <IconComponent className="h-5 w-5 text-repwell-teal-300" weight="duotone" />
                  </div>
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="font-display text-3xl font-bold text-repwell-teal-500">
                    {price === -1 ? "Custom" : price === 0 ? "Free" : `$${price}`}
                  </span>
                  {price > 0 && (
                    <span className="text-sm text-muted-foreground">/month</span>
                  )}
                </div>
                {isYearly && price > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Billed annually (${plan.yearlyPrice * 12}/year)
                  </p>
                )}
              </CardHeader>

              <CardContent className="flex-1 pt-5">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-repwell-sage-200" weight="fill" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-4">
                <Button
                  className={cn(
                    "w-full h-11",
                    plan.highlighted && "bg-repwell-teal-300 hover:bg-repwell-teal-400"
                  )}
                  variant={plan.highlighted ? "default" : "outline"}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isLoading || loadingPlan !== null}
                >
                  {isLoading ? (
                    "Processing..."
                  ) : plan.id === "enterprise" ? (
                    "Contact Sales"
                  ) : (
                    "Start 7-Day Trial"
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </motion.div>

      {/* Trial note */}
      <motion.p variants={fadeInUp} className="text-center text-sm text-muted-foreground">
        Basic and Pro plans include a 7-day free trial. Credit card required for trial activation.
        Cancel anytime before the trial ends and you won&apos;t be charged.
      </motion.p>
    </motion.div>
  );
}
