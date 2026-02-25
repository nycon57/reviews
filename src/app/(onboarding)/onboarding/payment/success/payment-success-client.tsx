"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  CheckCircle,
  SpinnerGap as Loader2,
  WarningCircle,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { completePaymentStep } from "@/lib/onboarding/actions";
import { fadeInUp, staggerContainer } from "@/lib/motion";

interface PaymentSuccessClientProps {
  sessionId: string;
}

export function PaymentSuccessClient({ sessionId }: PaymentSuccessClientProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const hasProcessed = React.useRef(false);

  React.useEffect(() => {
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    async function processPayment() {
      try {
        const result = await completePaymentStep(sessionId);

        if (result.success) {
          setIsProcessing(false);
          setTimeout(() => {
            router.push(result.redirectTo || "/onboarding/profile");
          }, 2000);
        } else {
          setError(result.error || "Failed to verify payment");
          setIsProcessing(false);
        }
      } catch {
        setError("An unexpected error occurred");
        setIsProcessing(false);
      }
    }

    processPayment();
  }, [sessionId, router]);

  if (isProcessing) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-16">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-repwell-sage-100/50">
          <Loader2 className="h-10 w-10 animate-spin text-repwell-teal-300" />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-bold text-repwell-teal-500">
            Processing your payment...
          </h2>
          <p className="text-muted-foreground">
            Please wait while we set up your account.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto py-12">
        <Card>
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <WarningCircle className="h-9 w-9 text-destructive" weight="duotone" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display text-xl font-bold">Something went wrong</h2>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => router.push("/onboarding/payment")}>
                Try Again
              </Button>
              <Button onClick={() => router.push("/onboarding/profile")}>
                Continue Anyway
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="max-w-lg mx-auto text-center space-y-8 py-16"
    >
      <motion.div
        variants={fadeInUp}
        className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-repwell-sage-100/60 to-repwell-teal-300/10"
      >
        <CheckCircle className="h-14 w-14 text-repwell-teal-300" weight="fill" />
      </motion.div>

      <motion.div variants={fadeInUp} className="space-y-3">
        <h2 className="font-display text-3xl font-bold text-repwell-teal-500">
          Payment Successful!
        </h2>
        <p className="text-muted-foreground">
          Your 14-day free trial has started. You won&apos;t be charged until the trial ends.
        </p>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <Button size="lg" onClick={() => router.push("/onboarding/profile")}>
          Continue Setup
        </Button>
      </motion.div>

      <motion.p variants={fadeInUp} className="text-sm text-muted-foreground">
        Redirecting automatically in a moment...
      </motion.p>
    </motion.div>
  );
}
