"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { PartyPopper, Rocket, Users, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { completeOnboarding } from "@/lib/onboarding/actions";
import { fadeInUp, staggerContainer, scaleIn } from "@/lib/motion";
import Confetti from "react-confetti";

interface CompletionClientProps {
  isAlreadyCompleted: boolean;
}

const nextSteps = [
  {
    icon: Users,
    title: "Add your team",
    description: "Invite loan officers and team members to your organization",
    href: "/dashboard/team",
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
    href: "/dashboard/settings/integrations",
  },
];

export function CompletionClient({ isAlreadyCompleted }: CompletionClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [showConfetti, setShowConfetti] = React.useState(!isAlreadyCompleted);
  const [windowSize, setWindowSize] = React.useState({ width: 0, height: 0 });
  const hasCompleted = React.useRef(isAlreadyCompleted);

  // Get window size for confetti
  React.useEffect(() => {
    const updateWindowSize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    updateWindowSize();
    window.addEventListener("resize", updateWindowSize);
    return () => window.removeEventListener("resize", updateWindowSize);
  }, []);

  // Stop confetti after a few seconds
  React.useEffect(() => {
    if (showConfetti) {
      const timer = setTimeout(() => setShowConfetti(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showConfetti]);

  // Auto-complete onboarding if not already done
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
        className="max-w-2xl mx-auto space-y-8 text-center"
      >
        {/* Celebration */}
        <motion.div
          variants={scaleIn}
          className="mx-auto w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <PartyPopper className="h-12 w-12 text-primary" />
        </motion.div>

        <motion.div variants={fadeInUp} className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            You&apos;re all set!
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Welcome to RepWell. Your account is ready to go. Here are some things
            you can do to get started.
          </p>
        </motion.div>

        {/* Next steps */}
        <motion.div variants={fadeInUp} className="grid gap-4">
          {nextSteps.map((step) => (
            <Card
              key={step.title}
              className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
              onClick={() => router.push(step.href)}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
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
            className="min-w-[200px]"
          >
            {isLoading ? "Loading..." : "Go to Dashboard"}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </motion.div>

        {/* Help note */}
        <motion.p variants={fadeInUp} className="text-sm text-muted-foreground">
          Need help getting started?{" "}
          <a href="/docs" className="text-primary hover:underline">
            Check out our guides
          </a>{" "}
          or{" "}
          <a href="mailto:support@repwell.io" className="text-primary hover:underline">
            contact support
          </a>
          .
        </motion.p>
      </motion.div>
    </>
  );
}
