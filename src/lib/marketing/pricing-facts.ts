export type MarketingTierId = "basic" | "pro" | "enterprise";
export type BillingCadence = "monthly" | "annual";

export interface MarketingPricingTier {
  id: MarketingTierId;
  name: "Basic" | "Pro" | "Enterprise";
  monthlyPrice: number | "Custom";
  annualMonthlyPrice: number | "Custom";
  description: string;
  features: readonly string[];
  cta: {
    label: string;
    href: string;
    annualHref?: string;
  };
  highlighted?: boolean;
  badge?: string;
}

export const MARKETING_TRIAL_FACTS = {
  lengthDays: 14,
  creditCardRequired: true,
  cancelAnytime: true,
  shortCopy: "14-day free trial · cancel anytime",
} as const;

export const MARKETING_PRICING_TIERS: readonly MarketingPricingTier[] = [
  {
    id: "basic",
    name: "Basic",
    monthlyPrice: 49,
    annualMonthlyPrice: 39,
    description: "Build Your Reputation",
    features: [
      "1 user profile",
      "200 surveys/month",
      "Email distribution",
      "Review monitoring & management",
      "Basic analytics (rating trends, NPS)",
      "Testimonial collection (text + video)",
      "Google Business integration",
      "Email support",
    ],
    cta: {
      label: "Start Free Trial",
      href: "/signup?plan=basic",
      annualHref: "/signup?plan=basic&billing=yearly",
    },
  },
  {
    id: "pro",
    name: "Pro",
    monthlyPrice: 99,
    annualMonthlyPrice: 79,
    description: "AI-Powered Reputation Intelligence",
    features: [
      "Everything in Basic, plus:",
      "AI sentiment analysis",
      "AI response suggestions",
      "AI visibility / GEO reports",
      "AI performance scorecards",
      "1,000 surveys/month",
      "Advanced analytics & reporting",
      "API access (1,000 calls/day)",
      "Custom branding",
      "Priority support",
    ],
    cta: {
      label: "Start Free Trial",
      href: "/signup?plan=pro",
      annualHref: "/signup?plan=pro&billing=yearly",
    },
    highlighted: true,
    badge: "Most Popular",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: "Custom",
    annualMonthlyPrice: "Custom",
    description: "Reputation at Scale",
    features: [
      "Everything in Pro, plus:",
      "Unlimited team members & surveys",
      "Team management & leaderboards",
      "Manager dashboard with org-wide analytics",
      "Employee experience surveys",
      "SSO/SAML & white-label",
      "Webhooks & CSV bulk import",
      "Dedicated success manager",
    ],
    cta: { label: "Contact Sales", href: "/contact?plan=enterprise" },
  },
];

export function getMarketingTier(
  tierId: MarketingTierId,
): MarketingPricingTier {
  const tier = MARKETING_PRICING_TIERS.find((item) => item.id === tierId);

  if (!tier) {
    throw new Error(`Unknown marketing pricing tier: ${tierId}`);
  }

  return tier;
}

export function getMarketingTierPriceLabel(
  tierId: MarketingTierId,
  cadence: BillingCadence = "monthly",
): string {
  const tier = getMarketingTier(tierId);
  const price =
    cadence === "annual" ? tier.annualMonthlyPrice : tier.monthlyPrice;

  return typeof price === "number" ? `$${price}/mo` : price;
}
