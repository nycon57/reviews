import type { SubscriptionTier } from "@/lib/organization/types";

// ── SMS credit tiers ────────────────────────────────────────────────────
// Maps subscription tier to included credits per billing period and
// overage rate in cents per segment.

export interface SmsCreditTier {
  /** Number of SMS credits included per billing period */
  includedCredits: number;
  /** Cost per overage segment in cents */
  overageRateCents: number;
  /** Whether overage sends are allowed (vs hard-block) */
  overageAllowed: boolean;
}

export const SMS_CREDIT_TIERS: Record<SubscriptionTier, SmsCreditTier> = {
  free: {
    includedCredits: 0,
    overageRateCents: 0,
    overageAllowed: false,
  },
  starter: {
    includedCredits: 0,
    overageRateCents: 0,
    overageAllowed: false,
  },
  professional: {
    includedCredits: 100,
    overageRateCents: 3, // $0.03
    overageAllowed: true,
  },
  enterprise: {
    includedCredits: 2000,
    overageRateCents: 2, // $0.02
    overageAllowed: true,
  },
};

// ── Credit packs ────────────────────────────────────────────────────────

export interface CreditPack {
  id: string;
  credits: number;
  priceCents: number;
  label: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: "pack_100", credits: 100, priceCents: 500, label: "100 credits" },
  { id: "pack_500", credits: 500, priceCents: 2000, label: "500 credits" },
  { id: "pack_1000", credits: 1000, priceCents: 3500, label: "1,000 credits" },
];

// ── Usage alert thresholds ──────────────────────────────────────────────

export type AlertLevel = "none" | "warning" | "critical" | "exceeded";

export const ALERT_THRESHOLDS = {
  warning: 0.75,
  critical: 0.90,
  exceeded: 1.0,
} as const;

