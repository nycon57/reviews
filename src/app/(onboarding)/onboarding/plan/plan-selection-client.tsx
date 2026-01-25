"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Check,
  Sparkle as Sparkles,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
}

const plans: PlanOption[] = [
  {
    id: "basic",
    name: "Basic",
    monthlyPrice: 49,
    yearlyPrice: 39,
    description: "Perfect for individuals",
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
    features: [
      "Everything in Basic",
      "AI-powered insights",
      "AI visibility reports",
      "Website analytics & SEO audit",
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
    // Enterprise goes to contact
    if (planId === "enterprise") {
      router.push("/contact?plan=enterprise");
      return;
    }

    setLoadingPlan(planId);

    try {
      // Step 1: Save plan selection
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

      // Step 2: Create Stripe checkout session and redirect directly
      const checkoutResult = await createOnboardingCheckout();

      if (checkoutResult.success && checkoutResult.url) {
        // Redirect directly to Stripe checkout
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
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
          Choose your plan
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Start with a 7-day free trial on Basic or Pro. Enterprise accounts are
          billed via invoice. Cancel anytime.
        </p>
      </motion.div>

      {/* Billing toggle */}
      <motion.div variants={fadeInUp} className="flex items-center justify-center gap-4">
        <Label htmlFor="billing-toggle" className={cn("text-sm", !isYearly && "font-medium")}>
          Monthly
        </Label>
        <Switch
          id="billing-toggle"
          checked={isYearly}
          onCheckedChange={setIsYearly}
        />
        <Label htmlFor="billing-toggle" className={cn("text-sm flex items-center gap-2", isYearly && "font-medium")}>
          Yearly
          <Badge variant="secondary" className="text-xs">
            Save 20%
          </Badge>
        </Label>
      </motion.div>

      {/* Plan cards */}
      <motion.div
        variants={fadeInUp}
        className="grid md:grid-cols-3 gap-4 lg:gap-6 max-w-5xl mx-auto"
      >
        {plans.map((plan) => {
          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
          const isLoading = loadingPlan === plan.id;

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative flex flex-col transition-all duration-200",
                plan.highlighted
                  ? "border-primary shadow-lg ring-2 ring-primary/20 lg:scale-105"
                  : "hover:border-primary/50 hover:shadow-md"
              )}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                  <Badge className="px-3 py-1 shadow-md">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {plan.badge}
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription className="text-sm">{plan.description}</CardDescription>
                <div className="mt-4 flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-bold">
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

              <CardContent className="flex-1 pt-4">
                <ul className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                      </div>
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter className="pt-4">
                <Button
                  className="w-full"
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
