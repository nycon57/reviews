"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CreditCard, Shield, ChevronLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
      className="max-w-lg mx-auto space-y-8"
    >
      {/* Header */}
      <motion.div variants={fadeInUp} className="text-center space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">
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

      {/* Plan summary */}
      <motion.div variants={fadeInUp}>
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {tier?.name} Plan
                  {billingCycle === "year" && (
                    <Badge variant="secondary" className="text-xs">
                      Annual
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>14-day free trial included</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  ${monthlyEquivalent}
                  <span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
                {billingCycle === "year" && (
                  <p className="text-xs text-muted-foreground">
                    ${price}/year billed annually
                  </p>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Trial timeline */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Today</span>
                <span className="font-medium">Start free trial</span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">In 14 days</span>
                <span className="font-medium">First charge: ${billingCycle === "year" ? price : monthlyEquivalent}</span>
              </div>
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={handleStartCheckout}
              disabled={isLoading}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isLoading ? "Redirecting to checkout..." : "Continue to Payment"}
            </Button>

            {/* Security note */}
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Shield className="h-3 w-3" />
              <span>Secure payment powered by Stripe</span>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Trust signals */}
      <motion.div variants={fadeInUp} className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <p className="font-medium">Cancel anytime</p>
            <p className="text-xs text-muted-foreground">No questions asked</p>
          </div>
          <div>
            <p className="font-medium">No charge today</p>
            <p className="text-xs text-muted-foreground">Trial is free</p>
          </div>
          <div>
            <p className="font-medium">Secure checkout</p>
            <p className="text-xs text-muted-foreground">256-bit encryption</p>
          </div>
        </div>
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
