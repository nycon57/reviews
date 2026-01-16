"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { HeroSection } from "@/components/marketing/hero-section";
import { PricingCard } from "@/components/marketing/pricing-card";
import { staggerContainer, fadeInUp, viewportOnce } from "@/lib/motion";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { createCheckoutSession, getPricingForCheckout } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";

const pricingPlans = {
  monthly: [
    {
      tier: "Starter",
      price: 49,
      period: "month",
      description: "Perfect for individual loan officers",
      features: [
        "Up to 100 survey sends/month",
        "Email & SMS distribution",
        "Basic analytics dashboard",
        "NPS & CSAT tracking",
        "5 survey templates",
        "Email support",
      ],
      cta: { label: "Start Free Trial", href: "/signup?plan=starter" },
      highlighted: false,
    },
    {
      tier: "Professional",
      price: 149,
      period: "month",
      description: "For teams and growing businesses",
      features: [
        "Up to 500 survey sends/month",
        "Everything in Starter, plus:",
        "Google Business integration",
        "AI sentiment analysis",
        "AI response suggestions",
        "Team leaderboards",
        "Custom branding",
        "Priority support",
      ],
      cta: { label: "Start Free Trial", href: "/signup?plan=professional" },
      highlighted: true,
      badge: "Most Popular",
    },
    {
      tier: "Enterprise",
      price: "Custom",
      description: "For large organizations",
      features: [
        "Unlimited survey sends",
        "Everything in Professional, plus:",
        "Multi-branch management",
        "Advanced reporting & exports",
        "API access",
        "Zapier integration",
        "Dedicated account manager",
        "Custom integrations",
        "SSO authentication",
      ],
      cta: { label: "Contact Sales", href: "/contact?plan=enterprise" },
      highlighted: false,
    },
  ],
  yearly: [
    {
      tier: "Starter",
      price: 39,
      period: "month",
      description: "Perfect for individual loan officers",
      features: [
        "Up to 100 survey sends/month",
        "Email & SMS distribution",
        "Basic analytics dashboard",
        "NPS & CSAT tracking",
        "5 survey templates",
        "Email support",
      ],
      cta: { label: "Start Free Trial", href: "/signup?plan=starter&billing=yearly" },
      highlighted: false,
    },
    {
      tier: "Professional",
      price: 119,
      period: "month",
      description: "For teams and growing businesses",
      features: [
        "Up to 500 survey sends/month",
        "Everything in Starter, plus:",
        "Google Business integration",
        "AI sentiment analysis",
        "AI response suggestions",
        "Team leaderboards",
        "Custom branding",
        "Priority support",
      ],
      cta: { label: "Start Free Trial", href: "/signup?plan=professional&billing=yearly" },
      highlighted: true,
      badge: "Most Popular",
    },
    {
      tier: "Enterprise",
      price: "Custom",
      description: "For large organizations",
      features: [
        "Unlimited survey sends",
        "Everything in Professional, plus:",
        "Multi-branch management",
        "Advanced reporting & exports",
        "API access",
        "Zapier integration",
        "Dedicated account manager",
        "Custom integrations",
        "SSO authentication",
      ],
      cta: { label: "Contact Sales", href: "/contact?plan=enterprise" },
      highlighted: false,
    },
  ],
};

const faqs = [
  {
    question: "How does the free trial work?",
    answer:
      "Start your 14-day free trial with no credit card required. You'll get full access to all features in your selected plan. At the end of the trial, you can choose to subscribe or let your account convert to a limited free tier.",
  },
  {
    question: "Can I change plans later?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, the change takes effect at your next billing cycle.",
  },
  {
    question: "What happens if I exceed my survey limit?",
    answer:
      "You'll receive a notification when you're approaching your limit. You can either upgrade to a higher plan or purchase additional survey credits as needed. We won't automatically charge you for overages.",
  },
  {
    question: "Is there a setup fee?",
    answer:
      "No, there are no setup fees. You can get started immediately after signing up. Our onboarding team is available to help you configure your account at no extra cost.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, MasterCard, American Express) and ACH bank transfers for annual plans. Enterprise customers can also pay by invoice.",
  },
  {
    question: "Can I cancel at any time?",
    answer:
      "Yes, you can cancel your subscription at any time. Your account will remain active until the end of your current billing period. We don't offer prorated refunds for partial months.",
  },
  {
    question: "Do you offer discounts for nonprofits?",
    answer:
      "Yes, we offer a 20% discount for registered nonprofit organizations. Contact our sales team with proof of nonprofit status to receive your discount code.",
  },
  {
    question: "What kind of support is included?",
    answer:
      "All plans include email support with response within 24 hours. Professional plans include priority support with faster response times. Enterprise plans include a dedicated account manager and phone support.",
  },
];

interface StripePricing {
  id: string;
  stripePriceIdMonthly: string | null;
  stripePriceIdYearly: string | null;
}

export function PricingPageClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isYearly, setIsYearly] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [loadingTier, setLoadingTier] = React.useState<string | null>(null);
  const [stripePricing, setStripePricing] = React.useState<StripePricing[]>([]);

  const plans = isYearly ? pricingPlans.yearly : pricingPlans.monthly;

  // Check auth state and load pricing on mount
  React.useEffect(() => {
    const supabase = createClient();

    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    }

    async function loadPricing() {
      const result = await getPricingForCheckout();
      if (result.success && result.data) {
        setStripePricing(result.data);
      }
    }

    checkAuth();
    loadPricing();

    // Handle upgrade param from billing page
    const upgradeTier = searchParams.get("upgrade");
    if (upgradeTier) {
      // Scroll to pricing section
      document.getElementById("pricing-cards")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [searchParams]);

  const handleSelectPlan = async (tier: string) => {
    // Free tier - go to signup
    if (tier.toLowerCase() === "starter" && plans[0].price === 0) {
      router.push("/signup");
      return;
    }

    // Enterprise - go to contact
    if (tier.toLowerCase() === "enterprise") {
      router.push("/contact?plan=enterprise");
      return;
    }

    // If not authenticated, redirect to signup with plan
    if (!isAuthenticated) {
      const billingParam = isYearly ? "&billing=yearly" : "";
      router.push(`/signup?plan=${tier.toLowerCase()}${billingParam}`);
      return;
    }

    // Get Stripe price ID
    const tierPricing = stripePricing.find(
      (p) => p.id.toLowerCase() === tier.toLowerCase()
    );
    const priceId = isYearly
      ? tierPricing?.stripePriceIdYearly
      : tierPricing?.stripePriceIdMonthly;

    if (!priceId) {
      toast({
        title: "Configuration Error",
        description: "Pricing not configured. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    // Start checkout
    setLoadingTier(tier.toLowerCase());
    try {
      const result = await createCheckoutSession({
        priceId,
        billingCycle: isYearly ? "year" : "month",
      });

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
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingTier(null);
    }
  };

  return (
    <>
      <HeroSection
        subtitle="Pricing"
        title="Simple, Transparent Pricing"
        description="Choose the plan that fits your needs. All plans include a 14-day free trial with no credit card required."
      />

      {/* Billing Toggle */}
      <section className="pb-8">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeInUp}
          className="container mx-auto flex items-center justify-center gap-4 px-4"
        >
          <Label htmlFor="billing-toggle" className="text-sm">
            Monthly
          </Label>
          <Switch
            id="billing-toggle"
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <Label htmlFor="billing-toggle" className="text-sm">
            Yearly{" "}
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              Save 20%
            </span>
          </Label>
        </motion.div>
      </section>

      {/* Pricing Cards */}
      <section id="pricing-cards" className="pb-16 md:pb-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="container mx-auto px-4"
        >
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {plans.map((plan) => (
              <PricingCard
                key={plan.tier}
                tier={plan.tier}
                price={plan.price}
                period={plan.period}
                description={plan.description}
                features={plan.features}
                cta={plan.cta}
                highlighted={plan.highlighted}
                badge={plan.badge}
                onSelect={() => handleSelectPlan(plan.tier)}
                isLoading={loadingTier === plan.tier.toLowerCase()}
              />
            ))}
          </div>
        </motion.div>
      </section>

      {/* FAQ Section */}
      <section className="border-t bg-muted/50 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-12 text-center text-3xl font-bold"
            >
              Frequently Asked Questions
            </motion.h2>
            <motion.div
              variants={fadeInUp}
              className="mx-auto max-w-3xl"
            >
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`}>
                    <AccordionTrigger className="text-left">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
          className="container mx-auto px-4 text-center"
        >
          <motion.h2 variants={fadeInUp} className="mb-4 text-3xl font-bold">
            Still Have Questions?
          </motion.h2>
          <motion.p
            variants={fadeInUp}
            className="mx-auto mb-8 max-w-xl text-muted-foreground"
          >
            Our team is happy to help you find the right plan for your needs.
            Schedule a demo or reach out to our sales team.
          </motion.p>
          <motion.div variants={fadeInUp} className="flex justify-center gap-4">
            <a href="/demo">
              <button className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
                Schedule Demo
              </button>
            </a>
            <a href="/contact">
              <button className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground">
                Contact Sales
              </button>
            </a>
          </motion.div>
        </motion.div>
      </section>
    </>
  );
}
