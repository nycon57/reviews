"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  CreditCard,
  Shield,
  CaretLeft as ChevronLeft,
  WarningCircle as AlertCircle,
  CheckCircle,
  Clock,
  LockSimple,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { createOnboardingCheckout } from "@/lib/onboarding/actions";
import { fadeInUp, staggerContainer } from "@/lib/motion";
import { PRICING_TIERS } from "@/lib/stripe/types";

interface PaymentClientProps {
  selectedPlan: string;
  billingCycle: string;
}

export function PaymentClient({ selectedPlan, billingCycle }: PaymentClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const wasCanceled = searchParams.get("canceled") === "true";

  const tier = PRICING_TIERS.find((t) => t.id === selectedPlan);
  const price = billingCycle === "year" ? tier?.yearlyPrice : tier?.monthlyPrice;
  const monthlyEquivalent = billingCycle === "year" && tier
    ? Math.round(tier.yearlyPrice / 12)
    : price;

  const handleStartCheckout = async () => {
    setIsLoading(true);

    try {
      const result = await createOnboardingCheckout();

      if (result.success && result.url) {
        window.location.href = result.url;
      } else {
        toast({
          title: "Checkout Error",
          description: result.error || "Failed to start checkout",
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
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="max-w-2xl mx-auto space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="text-center space-y-4">
        <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-repwell-teal-500">
          Start your free trial
        </h1>
        <p className="text-muted-foreground">
          Enter your payment details to start your 14-day free trial.
          You won&apos;t be charged until the trial ends.
        </p>
      </motion.div>

      {/* Canceled alert */}
      {wasCanceled && (
        <motion.div variants={fadeInUp}>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Checkout was canceled. You can try again when you&apos;re ready.
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

      {/* Two-column layout: plan summary + trust signals */}
      <motion.div variants={fadeInUp} className="grid gap-6 lg:grid-cols-5">
        {/* Plan summary card — 3 cols */}
        <Card className="lg:col-span-3 overflow-hidden">
          {/* Accent bar */}
          <div className="h-1.5 bg-gradient-to-r from-repwell-teal-300 to-repwell-sage-200" />

          <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <CreditCard className="h-5 w-5 text-repwell-teal-300" weight="duotone" />
              </div>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  {tier?.name} Plan
                  {billingCycle === "year" && (
                    <span className="inline-flex items-center rounded-full bg-repwell-teal-300 px-2.5 py-0.5 text-xs font-medium text-white">
                      Annual
                    </span>
                  )}
                </CardTitle>
                <CardDescription>14-day free trial included</CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-6">
            {/* Price */}
            <div className="text-center">
              <p className="font-display text-4xl font-bold text-repwell-teal-500">
                ${monthlyEquivalent}
                <span className="text-base font-normal text-muted-foreground">/mo</span>
              </p>
              {billingCycle === "year" && (
                <p className="text-xs text-muted-foreground mt-1">
                  ${price}/year billed annually
                </p>
              )}
            </div>

            {/* Trial timeline */}
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-repwell-sage-100/20">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-repwell-teal-300 text-white">
                  <CheckCircle className="h-4 w-4" weight="fill" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today</p>
                  <p className="text-sm font-medium">Start free trial</p>
                </div>
              </div>
              <div className="h-px bg-border/50" />
              <div className="flex items-center gap-3 px-4 py-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground/30">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">In 14 days</p>
                  <p className="text-sm font-medium">First charge: ${billingCycle === "year" ? price : monthlyEquivalent}</p>
                </div>
              </div>
            </div>

            <Button
              className="w-full h-11 bg-repwell-teal-300 hover:bg-repwell-teal-400"
              size="lg"
              onClick={handleStartCheckout}
              disabled={isLoading}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isLoading ? "Redirecting to checkout..." : "Continue to Payment"}
            </Button>

            {/* Security note */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5 text-repwell-teal-300" weight="duotone" />
              <span>Secure payment powered by Stripe</span>
            </div>
          </CardContent>
        </Card>

        {/* Trust signals card — 2 cols */}
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-repwell-sage-100 to-transparent" />

          <CardHeader className="bg-gradient-to-r from-repwell-sage-100/30 to-transparent border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                <LockSimple className="h-5 w-5 text-repwell-teal-300" weight="duotone" />
              </div>
              <CardTitle className="text-lg">Why RepWell?</CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-0 divide-y divide-border/50">
            {[
              { label: "Cancel anytime", detail: "No questions asked" },
              { label: "No charge today", detail: "Trial is completely free" },
              { label: "Secure checkout", detail: "256-bit encryption" },
              { label: "Data privacy", detail: "SOC 2 compliant" },
              { label: "Expert support", detail: "Real humans, fast replies" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 px-6 py-3.5">
                <CheckCircle className="h-4 w-4 shrink-0 text-repwell-sage-200" weight="fill" />
                <div>
                  <p className="text-sm font-medium">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.div>

      {/* Back button */}
      <motion.div variants={fadeInUp} className="flex justify-center">
        <Button
          variant="ghost"
          onClick={() => router.push("/onboarding/plan")}
          className="text-muted-foreground"
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Change plan
        </Button>
      </motion.div>
    </motion.div>
  );
}
