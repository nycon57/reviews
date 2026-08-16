"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Confetti as PartyPopper,
  PaperPlaneRight as Send,
  Rocket,
  Users,
  Star,
  ArrowRight,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { completeOnboarding } from "@/lib/onboarding/actions";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import { SUPPORT_EMAIL } from "@/lib/brand";
import Confetti from "react-confetti";

interface CompletionClientProps {
  isAlreadyCompleted: boolean;
  accountType: "individual" | "enterprise";
}

export function CompletionClient({ isAlreadyCompleted, accountType }: CompletionClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(!isAlreadyCompleted);
  const [windowSize, setWindowSize] = React.useState({ width: 0, height: 0 });
  const hasCompleted = React.useRef(isAlreadyCompleted);
  const nextSteps = [
    {
      icon: Send,
      title: "Send your first review request",
      description: "Ask a recent customer for feedback and track the request from Reviews.",
      href: "/dashboard/reviews?tab=requests",
      recommended: true,
    },
    {
      icon: Star,
      title: "Create a survey",
      description: "Build your first customer feedback survey",
      href: "/dashboard/surveys",
    },
    {
      icon: Rocket,
      title: "Connect integrations",
      description: "Link Google Business Profile and other platforms",
      href: "/dashboard/organization?tab=integrations",
    },
    ...(accountType === "enterprise"
      ? [
          {
            icon: Users,
            title: "Invite your team",
            description: "Add workspace members and employees for team workflows",
            href: "/dashboard/people",
          },
        ]
      : []),
  ];

  React.useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateWindowSize();
    window.addEventListener("resize", updateWindowSize);
    return () => window.removeEventListener("resize", updateWindowSize);
  }, []);

  React.useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  React.useEffect(() => {
    if (hasCompleted.current) return;
    hasCompleted.current = true;

    async function markComplete() {
      const result = await completeOnboarding();
      if (!result.success) {
        console.error("Failed to mark onboarding complete:", result.error);
      }
    }

    markComplete();
  }, []);

  const handleGoToDashboard = async () => {
    setIsLoading(true);
    router.push("/dashboard");
  };

  // Separate recommended step from secondary steps
  const recommendedStep = nextSteps.find(s => s.recommended);
  const secondarySteps = nextSteps.filter(s => !s.recommended);

  return (
    <>
      {showConfetti && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.2}
        />
      )}

      <motion.div
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="max-w-3xl mx-auto space-y-8 text-center"
      >
        {/* Celebration icon — larger with gradient bg */}
        <motion.div
          variants={scaleIn}
          className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-repwell-sage-100/60 to-repwell-teal-300/10"
        >
          <PartyPopper className="h-14 w-14 text-repwell-teal-300" weight="duotone" />
        </motion.div>

        <motion.div variants={fadeInUp} className="space-y-4">
          <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight text-repwell-teal-500">
            You&apos;re all set!
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Welcome to RepWell. Your account is ready to go. Here are some things
            you can do to get started.
          </p>
        </motion.div>

        {/* Recommended next step — full-width prominent card */}
        {recommendedStep && (
          <motion.div variants={fadeInUp}>
            <Card
              className="relative overflow-hidden cursor-pointer hover:shadow-lg transition-all border-repwell-teal-300/30"
              role="button"
              tabIndex={0}
              aria-label={`${recommendedStep.title} — ${recommendedStep.description}`}
              onClick={() => router.push(recommendedStep.href)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(recommendedStep.href);
                }
              }}
            >
              <div className="h-1.5 bg-gradient-to-r from-repwell-teal-300 to-repwell-sage-200" />
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                  <recommendedStep.icon className="h-6 w-6 text-repwell-teal-300" weight="duotone" />
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-lg">{recommendedStep.title}</h3>
                    <span className="inline-flex items-center rounded-full bg-repwell-teal-300 px-2.5 py-0.5 text-xs font-medium text-white">
                      Recommended
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{recommendedStep.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-repwell-teal-300" />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Secondary steps — 2-column grid */}
        <motion.div variants={fadeInUp} className="grid gap-4 sm:grid-cols-2">
          {secondarySteps.map((step) => (
            <Card
              key={step.title}
              className="cursor-pointer overflow-hidden hover:border-repwell-teal-300/50 hover:shadow-md transition-all"
              role="button"
              tabIndex={0}
              aria-label={`${step.title} — ${step.description}`}
              onClick={() => router.push(step.href)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  router.push(step.href);
                }
              }}
            >
              <div className="h-1 bg-gradient-to-r from-repwell-sage-100 to-transparent" />
              <CardContent className="flex items-center gap-3 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-repwell-teal-300/10">
                  <step.icon className="h-5 w-5 text-repwell-teal-300" weight="duotone" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div variants={fadeInUp} className="pt-4">
          <Button
            size="lg"
            onClick={handleGoToDashboard}
            disabled={isLoading}
            className="min-w-[200px] h-11 bg-repwell-teal-300 hover:bg-repwell-teal-400"
          >
            {isLoading ? "Loading..." : "Go to Dashboard"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>

        {/* Help note */}
        <motion.p variants={fadeInUp} className="text-sm text-muted-foreground">
          Need help getting started?{" "}
          <a href="/docs" className="text-repwell-teal-300 hover:underline">
            Check out our guides
          </a>{" "}
          or{" "}
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-repwell-teal-300 hover:underline">
            contact support
          </a>
          .
        </motion.p>
      </motion.div>
    </>
  );
}
