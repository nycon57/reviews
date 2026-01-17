"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, LayoutGroup } from "framer-motion";
import { Check, Sparkles, Building2, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  staggerContainer,
  fadeInUp,
  viewportOnce,
  blobFloat,
  blobFloatRotate,
} from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { createCheckoutSession, getPricingForCheckout } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const pricingPlans = {
  monthly: [
    {
      tier: "Starter",
      price: 49,
      period: "month",
      description: "Perfect for individual loan officers",
      icon: Users,
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
      icon: Sparkles,
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
      icon: Building2,
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
      icon: Users,
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
      icon: Sparkles,
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
      icon: Building2,
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

// Premium Pricing Card
function PremiumPricingCard({
  tier,
  price,
  period = "month",
  description,
  icon: Icon,
  features,
  cta,
  highlighted = false,
  badge,
  onSelect,
  isLoading = false,
}: {
  tier: string;
  price: string | number;
  period?: string;
  description?: string;
  icon: React.ElementType;
  features: string[];
  cta: { label: string; href: string };
  highlighted?: boolean;
  badge?: string;
  onSelect?: () => void;
  isLoading?: boolean;
}) {
  return (
    <motion.div
      variants={fadeInUp}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "relative rounded-3xl p-8 lg:p-10 transition-all",
        highlighted
          ? "bg-repwell-teal-500 text-white shadow-2xl shadow-repwell-teal-500/20 scale-[1.02] z-10"
          : "bg-white border border-repwell-sage-100 shadow-sm hover:shadow-md"
      )}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className="bg-repwell-teal-300 text-white px-4 py-1.5 text-sm font-medium shadow-lg">
            {badge}
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="text-center mb-8">
        <div
          className={cn(
            "inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4",
            highlighted
              ? "bg-white/20"
              : "bg-repwell-sage-100"
          )}
        >
          <Icon
            className={cn(
              "h-7 w-7",
              highlighted ? "text-white" : "text-repwell-teal-400"
            )}
          />
        </div>
        <h3
          className={cn(
            "font-display text-2xl font-bold mb-2",
            highlighted ? "text-white" : "text-repwell-teal-500"
          )}
        >
          {tier}
        </h3>
        {description && (
          <p
            className={cn(
              "text-sm",
              highlighted ? "text-white/80" : "text-repwell-teal-400"
            )}
          >
            {description}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="text-center mb-8">
        <div className="flex items-baseline justify-center gap-1">
          <span
            className={cn(
              "font-display text-5xl font-bold",
              highlighted ? "text-white" : "text-repwell-teal-500"
            )}
          >
            {typeof price === "number" ? `$${price}` : price}
          </span>
          {typeof price === "number" && (
            <span
              className={cn(
                "text-lg",
                highlighted ? "text-white/70" : "text-repwell-teal-400"
              )}
            >
              /{period}
            </span>
          )}
        </div>
        {typeof price === "number" && (
          <p
            className={cn(
              "text-sm mt-1",
              highlighted ? "text-white/60" : "text-repwell-teal-400/60"
            )}
          >
            billed {period === "month" ? "monthly" : "annually"}
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-4 mb-8">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5",
                highlighted ? "bg-white/20" : "bg-repwell-sage-100"
              )}
            >
              <Check
                className={cn(
                  "h-3 w-3",
                  highlighted ? "text-white" : "text-repwell-teal-300"
                )}
                strokeWidth={3}
              />
            </div>
            <span
              className={cn(
                "text-sm",
                highlighted ? "text-white/90" : "text-repwell-teal-400"
              )}
            >
              {feature}
            </span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      {onSelect ? (
        <Button
          className={cn(
            "w-full h-12 text-base font-medium",
            highlighted
              ? "bg-white text-repwell-teal-500 hover:bg-repwell-sage-100"
              : "bg-repwell-teal-500 text-white hover:bg-repwell-teal-400"
          )}
          onClick={onSelect}
          disabled={isLoading}
        >
          {isLoading ? "Processing..." : cta.label}
        </Button>
      ) : (
        <Link href={cta.href} className="block">
          <Button
            className={cn(
              "w-full h-12 text-base font-medium",
              highlighted
                ? "bg-white text-repwell-teal-500 hover:bg-repwell-sage-100"
                : "bg-repwell-teal-500 text-white hover:bg-repwell-teal-400"
            )}
          >
            {cta.label}
          </Button>
        </Link>
      )}
    </motion.div>
  );
}

// Billing Toggle
function BillingToggle({
  isYearly,
  onToggle,
}: {
  isYearly: boolean;
  onToggle: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <LayoutGroup>
        <button
          onClick={() => onToggle(false)}
          className={cn(
            "relative px-5 py-2.5 text-sm font-medium rounded-full transition-colors",
            !isYearly ? "text-white" : "text-repwell-teal-400 hover:text-repwell-teal-500"
          )}
        >
          {!isYearly && (
            <motion.div
              layoutId="billingToggle"
              className="absolute inset-0 bg-repwell-teal-500 rounded-full"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">Monthly</span>
        </button>
        <button
          onClick={() => onToggle(true)}
          className={cn(
            "relative px-5 py-2.5 text-sm font-medium rounded-full transition-colors flex items-center gap-2",
            isYearly ? "text-white" : "text-repwell-teal-400 hover:text-repwell-teal-500"
          )}
        >
          {isYearly && (
            <motion.div
              layoutId="billingToggle"
              className="absolute inset-0 bg-repwell-teal-500 rounded-full"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">
            Yearly
            <Badge className="ml-2 bg-repwell-teal-300/20 text-repwell-teal-300 border-0 text-xs">
              Save 20%
            </Badge>
          </span>
        </button>
      </LayoutGroup>
    </div>
  );
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
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
      document.getElementById("pricing-cards")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [searchParams]);

  const handleSelectPlan = async (tier: string) => {
    if (tier.toLowerCase() === "starter" && plans[0].price === 0) {
      router.push("/signup");
      return;
    }

    if (tier.toLowerCase() === "enterprise") {
      router.push("/contact?plan=enterprise");
      return;
    }

    if (!isAuthenticated) {
      const billingParam = isYearly ? "&billing=yearly" : "";
      router.push(`/signup?plan=${tier.toLowerCase()}${billingParam}`);
      return;
    }

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
      {/* Hero Section */}
      <section className="relative py-20 md:py-28 lg:py-32 bg-gradient-to-b from-repwell-sage-100/50 to-white overflow-hidden">
        {/* Decorative blobs */}
        <motion.div
          variants={blobFloat}
          initial="initial"
          animate="animate"
          className="absolute top-20 -left-32 w-96 h-96 bg-repwell-teal-300/10 rounded-full blur-3xl"
        />
        <motion.div
          variants={blobFloatRotate}
          initial="initial"
          animate="animate"
          className="absolute -bottom-20 -right-32 w-[500px] h-[500px] bg-repwell-sage-200/30 rounded-full blur-3xl"
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.div variants={fadeInUp}>
              <Badge
                variant="outline"
                className="border-repwell-teal-300/50 text-repwell-teal-400 mb-6"
              >
                Pricing
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-repwell-teal-500 mb-6"
            >
              Simple,{" "}
              <span className="text-repwell-teal-300">Transparent</span> Pricing
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-repwell-teal-400 mb-10"
            >
              Choose the plan that fits your needs. All plans include a 14-day
              free trial with no credit card required.
            </motion.p>

            {/* Billing Toggle */}
            <motion.div
              variants={fadeInUp}
              className="inline-flex p-1.5 bg-repwell-sage-100 rounded-full"
            >
              <BillingToggle isYearly={isYearly} onToggle={setIsYearly} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section id="pricing-cards" className="py-16 md:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="grid gap-8 lg:grid-cols-3 lg:items-start"
          >
            {plans.map((plan) => (
              <PremiumPricingCard
                key={plan.tier}
                tier={plan.tier}
                price={plan.price}
                period={plan.period}
                description={plan.description}
                icon={plan.icon}
                features={plan.features}
                cta={plan.cta}
                highlighted={plan.highlighted}
                badge={plan.badge}
                onSelect={() => handleSelectPlan(plan.tier)}
                isLoading={loadingTier === plan.tier.toLowerCase()}
              />
            ))}
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-repwell-sage-100/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="text-center mb-12">
              <Badge
                variant="outline"
                className="border-repwell-teal-300/50 text-repwell-teal-400 mb-4"
              >
                FAQ
              </Badge>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-repwell-teal-500">
                Frequently Asked <span className="text-repwell-teal-300">Questions</span>
              </h2>
            </motion.div>

            <motion.div variants={fadeInUp} className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="bg-white rounded-2xl border border-repwell-sage-100 px-6 data-[state=open]:shadow-sm"
                  >
                    <AccordionTrigger className="text-left font-medium text-repwell-teal-500 hover:text-repwell-teal-400 hover:no-underline py-5">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-repwell-teal-400 pb-5">
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
      <section className="py-16 md:py-24 bg-repwell-teal-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="text-center"
          >
            <motion.h2
              variants={fadeInUp}
              className="font-display text-3xl md:text-4xl font-bold text-white mb-4"
            >
              Still Have Questions?
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-repwell-sage-100 mb-8 max-w-xl mx-auto"
            >
              Our team is happy to help you find the right plan for your needs.
              Schedule a demo or reach out to our sales team.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/demo">
                <Button
                  size="lg"
                  className="bg-white text-repwell-teal-500 hover:bg-repwell-sage-100 h-12 px-8"
                >
                  Schedule Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 h-12 px-8"
                >
                  Contact Sales
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
