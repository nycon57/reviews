"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    // Prevent double processing in development
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    async function processPayment() {
      try {
        const result = await completePaymentStep(sessionId);

        if (result.success) {
          setIsProcessing(false);
          // Auto-redirect after a short delay
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
      <div className="max-w-lg mx-auto text-center space-y-6 py-12">
        <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        <h2 className="text-xl font-semibold">Processing your payment...</h2>
        <p className="text-muted-foreground">Please wait while we set up your account.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-6 py-12">
        <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <span className="text-destructive text-2xl">!</span>
        </div>
        <h2 className="text-xl font-semibold">Something went wrong</h2>
        <p className="text-muted-foreground">{error}</p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => router.push("/onboarding/payment")}>
            Try Again
          </Button>
          <Button onClick={() => router.push("/onboarding/profile")}>
            Continue Anyway
          </Button>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
      className="max-w-lg mx-auto text-center space-y-6 py-12"
    >
      <motion.div
        variants={fadeInUp}
        className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center"
      >
        <CheckCircle className="h-10 w-10 text-green-600" />
      </motion.div>

      <motion.div variants={fadeInUp} className="space-y-2">
        <h2 className="text-2xl font-bold">Payment Successful!</h2>
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
