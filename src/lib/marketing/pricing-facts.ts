import { PRICING_TIERS } from "@/lib/stripe/types";

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
  get shortCopy() {
    return `${this.lengthDays}-day free trial · ${
      this.cancelAnytime ? "cancel anytime" : "standard cancellation terms apply"
    }`;
  },
  get creditCardCopy() {
    return this.creditCardRequired
      ? "A credit card is required to activate the trial."
      : "No credit card is required to activate the trial.";
  },
} as const;

const MARKETING_TIER_FIELDS: Record<
  MarketingTierId,
  Pick<MarketingPricingTier, "annualMonthlyPrice" | "cta" | "highlighted" | "badge">
> = {
  basic: {
    annualMonthlyPrice: 39,
    cta: {
      label: "Start Free Trial",
      href: "/signup?plan=basic",
      annualHref: "/signup?plan=basic&billing=yearly",
    },
  },
  pro: {
    annualMonthlyPrice: 79,
    cta: {
      label: "Start Free Trial",
      href: "/signup?plan=pro",
      annualHref: "/signup?plan=pro&billing=yearly",
    },
    highlighted: true,
    badge: "Most Popular",
  },
  enterprise: {
    annualMonthlyPrice: "Custom",
    cta: { label: "Contact Sales", href: "/contact?plan=enterprise" },
  },
};

export const MARKETING_PRICING_TIERS: readonly MarketingPricingTier[] =
  PRICING_TIERS.map((tier) => {
    const marketingFields = MARKETING_TIER_FIELDS[tier.id as MarketingTierId];
    return {
      id: tier.id as MarketingTierId,
      name: tier.name as MarketingPricingTier["name"],
      monthlyPrice: tier.monthlyPrice === -1 ? "Custom" : tier.monthlyPrice,
      annualMonthlyPrice: marketingFields.annualMonthlyPrice,
      description: tier.description,
      features: tier.features,
      cta: marketingFields.cta,
      highlighted: marketingFields.highlighted,
      badge: marketingFields.badge,
    };
  });

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
