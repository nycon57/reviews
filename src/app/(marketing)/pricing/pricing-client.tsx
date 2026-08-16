"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, LayoutGroup } from "framer-motion";
import {
  Check,
  Sparkle as Sparkles,
  BuildingOffice as Building2,
  Users,
  ArrowRight,
} from "@phosphor-icons/react";
import Link from "next/link";
import { staggerContainer, fadeInUp, viewportOnce, blobFloat, blobFloatRotate } from "@/lib/motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CTASection } from "@/components/marketing/cta-section";
import { GuaranteeSection } from "@/components/marketing/guarantee-section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { createCheckoutSession, getPricingForCheckout } from "@/lib/stripe";
import { getSession } from "@/lib/auth/auth-client";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  MARKETING_PRICING_TIERS,
  MARKETING_TRIAL_FACTS,
  type BillingCadence,
} from "@/lib/marketing/pricing-facts";
import { PRICING_FAQS } from "@/lib/marketing/pricing-faqs";

const planIcons = {
  basic: Users,
  pro: Sparkles,
  enterprise: Building2,
};

function buildPricingPlans(cadence: BillingCadence) {
  const isAnnual = cadence === "annual";

  return MARKETING_PRICING_TIERS.map((plan) => ({
    tier: plan.name,
    price: isAnnual ? plan.annualMonthlyPrice : plan.monthlyPrice,
    period: "month",
    description: plan.description,
    icon: planIcons[plan.id],
    features: [...plan.features],
    cta: {
      label: plan.cta.label,
      href: isAnnual && plan.cta.annualHref ? plan.cta.annualHref : plan.cta.href,
    },
    highlighted: plan.highlighted ?? false,
    badge: plan.badge,
  }));
}

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
        "relative rounded-3xl p-8 transition-all lg:p-10",
        highlighted
          ? "z-10 scale-[1.02] bg-repwell-teal-500 text-white shadow-2xl shadow-repwell-teal-500/20"
          : "border border-repwell-sage-100 bg-white shadow-sm hover:shadow-md"
      )}
    >
      {/* Badge */}
      {badge && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className="bg-repwell-teal-300 px-4 py-1.5 text-sm font-medium text-white shadow-lg">
            {badge}
          </Badge>
        </div>
      )}

      {/* Header */}
      <div className="mb-8 text-center">
        <div
          className={cn(
            "mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl",
            highlighted ? "bg-white/20" : "bg-repwell-sage-100"
          )}
        >
          <Icon className={cn("h-7 w-7", highlighted ? "text-white" : "text-repwell-teal-400")} />
        </div>
        <h3
          className={cn(
            "mb-2 font-display text-2xl font-bold",
            highlighted ? "text-white" : "text-repwell-teal-500"
          )}
        >
          {tier}
        </h3>
        {description && (
          <p className={cn("text-sm", highlighted ? "text-white/80" : "text-repwell-teal-400")}>
            {description}
          </p>
        )}
      </div>

      {/* Price */}
      <div className="mb-8 text-center">
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
              className={cn("text-lg", highlighted ? "text-white/70" : "text-repwell-teal-400")}
            >
              /{period}
            </span>
          )}
        </div>
        {typeof price === "number" && (
          <p
            className={cn(
              "mt-1 text-sm",
              highlighted ? "text-white/60" : "text-repwell-teal-400/60"
            )}
          >
            billed {period === "month" ? "monthly" : "annually"}
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="mb-8 space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <div
              className={cn(
                "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                highlighted ? "bg-white/20" : "bg-repwell-sage-100"
              )}
            >
              <Check
                className={cn("h-3 w-3", highlighted ? "text-white" : "text-repwell-teal-300")}
                strokeWidth={3}
              />
            </div>
            <span
              className={cn("text-sm", highlighted ? "text-white/90" : "text-repwell-teal-400")}
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
            "h-12 w-full text-base font-medium",
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
              "h-12 w-full text-base font-medium",
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
            "relative rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
            !isYearly ? "text-white" : "text-repwell-teal-400 hover:text-repwell-teal-500"
          )}
        >
          {!isYearly && (
            <motion.div
              layoutId="billingToggle"
              className="absolute inset-0 rounded-full bg-repwell-teal-500"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">Monthly</span>
        </button>
        <button
          onClick={() => onToggle(true)}
          className={cn(
            "relative flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-colors",
            isYearly ? "text-white" : "text-repwell-teal-400 hover:text-repwell-teal-500"
          )}
        >
          {isYearly && (
            <motion.div
              layoutId="billingToggle"
              className="absolute inset-0 rounded-full bg-repwell-teal-500"
              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
          )}
          <span className="relative z-10">
            Yearly
            <Badge className="ml-2 border-0 bg-repwell-teal-300/20 text-xs text-repwell-teal-300">
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

  const plans = buildPricingPlans(isYearly ? "annual" : "monthly");

  // Check auth state and load pricing on mount
  React.useEffect(() => {
    async function checkAuth() {
      const session = await getSession();
      setIsAuthenticated(!!session.data?.user);
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
    if (tier.toLowerCase() === "enterprise") {
      router.push("/contact?plan=enterprise");
      return;
    }

    if (!isAuthenticated) {
      const billingParam = isYearly ? "&billing=yearly" : "";
      router.push(`/signup?plan=${tier.toLowerCase()}${billingParam}`);
      return;
    }

    const tierPricing = stripePricing.find((p) => p.id.toLowerCase() === tier.toLowerCase());
    const priceId = isYearly ? tierPricing?.stripePriceIdYearly : tierPricing?.stripePriceIdMonthly;

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
      <section className="relative overflow-hidden bg-gradient-to-b from-repwell-sage-100/50 to-white py-20 md:py-28 lg:py-32">
        {/* Decorative blobs */}
        <motion.div
          variants={blobFloat}
          initial="initial"
          animate="animate"
          className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-repwell-teal-300/10 blur-3xl"
        />
        <motion.div
          variants={blobFloatRotate}
          initial="initial"
          animate="animate"
          className="absolute -bottom-20 -right-32 h-[500px] w-[500px] rounded-full bg-repwell-sage-200/30 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="mx-auto max-w-3xl text-center"
          >
            <motion.div variants={fadeInUp}>
              <Badge
                variant="outline"
                className="mb-6 border-repwell-teal-300/50 text-repwell-teal-400"
              >
                Pricing
              </Badge>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="mb-6 font-display text-4xl font-bold text-repwell-teal-500 md:text-5xl lg:text-6xl"
            >
              Simple, <span className="text-repwell-teal-300">Transparent</span> Pricing
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="mb-10 text-lg text-repwell-teal-400 md:text-xl"
            >
              Choose the plan that fits your needs. All plans include a{" "}
              {MARKETING_TRIAL_FACTS.shortCopy}.
            </motion.p>

            {/* Billing Toggle */}
            <motion.div
              variants={fadeInUp}
              className="inline-flex rounded-full bg-repwell-sage-100 p-1.5"
            >
              <BillingToggle isYearly={isYearly} onToggle={setIsYearly} />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section id="pricing-cards" className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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

      {/* Compare Section */}
      <section className="bg-white py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="mb-12 text-center">
              <Badge
                variant="outline"
                className="mb-4 border-repwell-teal-300/50 text-repwell-teal-400"
              >
                Compare
              </Badge>
              <h2 className="mb-4 font-display text-3xl font-bold text-repwell-teal-500 md:text-4xl">
                See How We <span className="text-repwell-teal-300">Compare</span>
              </h2>
              <p className="mx-auto max-w-2xl text-lg text-repwell-teal-400">
                Switching from another platform? See how RepWell stacks up against the competition.
              </p>
            </motion.div>

            <motion.div
              variants={fadeInUp}
              className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3"
            >
              {[
                {
                  name: "Experience.com",
                  href: "/compare/experience-com",
                  tagline: "Transparent pricing, no contracts",
                },
                {
                  name: "Birdeye",
                  href: "/compare/birdeye",
                  tagline: "Better value, no setup fees",
                },
                {
                  name: "Trustpilot",
                  href: "/compare/trustpilot",
                  tagline: "Built for sales professionals",
                },
              ].map((competitor) => (
                <Link
                  key={competitor.name}
                  href={competitor.href}
                  className="group flex items-center justify-between rounded-2xl border border-repwell-sage-100 bg-repwell-sage-100/30 p-5 transition-all hover:border-repwell-teal-300/40 hover:bg-white hover:shadow-md"
                >
                  <div className="min-w-0">
                    <p className="font-sans text-sm font-semibold text-repwell-teal-500 group-hover:text-repwell-teal-400">
                      RepWell vs {competitor.name}
                    </p>
                    <p className="mt-0.5 font-sans text-xs text-repwell-teal-400/80">
                      {competitor.tagline}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-repwell-teal-400/50 transition-all group-hover:translate-x-0.5 group-hover:text-repwell-teal-300" />
                </Link>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>

      <CTASection
        variant="enterprise"
        title="Need enterprise controls?"
        description="Talk with sales about team management, SSO/SAML, white-label needs, bulk import, and organization-wide analytics."
        primaryCta={{ label: "Contact Sales", href: "/contact?plan=enterprise" }}
        secondaryCta={{ label: "Book a Demo", href: "/demo" }}
      />

      <GuaranteeSection
        variant="accent"
        badge="Plan Basics"
        heading="What every plan makes clear"
        subheading="Start with a trial, compare the plan limits, and choose the workflow that fits your team."
        trustBadgeText={`${MARKETING_TRIAL_FACTS.shortCopy} · ${MARKETING_TRIAL_FACTS.creditCardCopy}`}
        itemBadgeText="Included"
        guarantees={[
          {
            icon: "Clock",
            title: MARKETING_TRIAL_FACTS.shortCopy,
            description:
              "Every self-serve plan starts with the same trial terms shown on this page.",
          },
          {
            icon: "CreditCard",
            title: "Card required",
            description: MARKETING_TRIAL_FACTS.creditCardCopy,
          },
          {
            icon: "ListChecks",
            title: "Plan details in one place",
            description:
              "The pricing cards list the plan features and limits used across the site.",
          },
        ]}
      />

      {/* FAQ Section */}
      <section className="bg-repwell-sage-100/30 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
          >
            <motion.div variants={fadeInUp} className="mb-12 text-center">
              <Badge
                variant="outline"
                className="mb-4 border-repwell-teal-300/50 text-repwell-teal-400"
              >
                FAQ
              </Badge>
              <h2 className="font-display text-3xl font-bold text-repwell-teal-500 md:text-4xl">
                Frequently Asked <span className="text-repwell-teal-300">Questions</span>
              </h2>
            </motion.div>

            <motion.div variants={fadeInUp} className="mx-auto max-w-3xl">
              <Accordion type="single" collapsible className="space-y-4">
                {PRICING_FAQS.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="rounded-2xl border border-repwell-sage-100 bg-white px-6 data-[state=open]:shadow-sm"
                  >
                    <AccordionTrigger className="py-5 text-left font-medium text-repwell-teal-500 hover:text-repwell-teal-400 hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-repwell-teal-400">
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
      <section className="bg-repwell-teal-500 py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={viewportOnce}
            variants={staggerContainer}
            className="text-center"
          >
            <motion.h2
              variants={fadeInUp}
              className="mb-4 font-display text-3xl font-bold text-white md:text-4xl"
            >
              Still Have Questions?
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="mx-auto mb-8 max-w-xl text-lg text-repwell-sage-100"
            >
              Our team is happy to help you find the right plan for your needs. Schedule a demo or
              reach out to our sales team.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Link href="/demo">
                <Button
                  size="lg"
                  className="h-12 bg-white px-8 text-repwell-teal-500 hover:bg-repwell-sage-100"
                >
                  Schedule Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 border-white/30 px-8 text-white hover:bg-white/10"
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
