// A/B test configurations for competitor comparison pages (S131)
// Each page can have up to 3 active tests: H1, CTA copy, CTA color

import type { ABTestConfig, PageABTestConfig } from "./types";

/**
 * A/B test configurations per competitor page.
 * Toggle `enabled` to activate/deactivate tests per page.
 */
export const abTestConfigs: Record<string, PageABTestConfig> = {
  "experience-com": {
    slug: "experience-com",
    h1Test: {
      id: "experience-com-h1",
      name: "Experience.com H1 Headline",
      type: "h1",
      variantA: "The #1 Experience.com Alternative for Mortgage Lenders",
      variantB: "Switch from Experience.com — Better Reviews, Lower Cost",
      enabled: true,
    },
    ctaCopyTest: {
      id: "experience-com-cta-copy",
      name: "Experience.com CTA Copy",
      type: "cta_copy",
      variantA: "Start Free Trial",
      variantB: "Get Started Free",
      enabled: true,
    },
    ctaColorTest: {
      id: "experience-com-cta-color",
      name: "Experience.com CTA Color",
      type: "cta_color",
      variantA: "bg-repwell-teal-300 hover:bg-repwell-teal-400",
      variantB: "bg-repwell-sage-300 hover:bg-repwell-sage-400",
      enabled: true,
    },
  },

  "birdeye": {
    slug: "birdeye",
    h1Test: {
      id: "birdeye-h1",
      name: "Birdeye H1 Headline",
      type: "h1",
      variantA: "The Mortgage-First Birdeye Alternative",
      variantB: "Why Mortgage Lenders Are Switching from Birdeye",
      enabled: true,
    },
    ctaCopyTest: {
      id: "birdeye-cta-copy",
      name: "Birdeye CTA Copy",
      type: "cta_copy",
      variantA: "Start Free Trial",
      variantB: "See How It Works",
      enabled: true,
    },
    ctaColorTest: {
      id: "birdeye-cta-color",
      name: "Birdeye CTA Color",
      type: "cta_color",
      variantA: "bg-repwell-teal-300 hover:bg-repwell-teal-400",
      variantB: "bg-emerald-600 hover:bg-emerald-700",
      enabled: true,
    },
  },

  "trustpilot": {
    slug: "trustpilot",
    h1Test: {
      id: "trustpilot-h1",
      name: "Trustpilot H1 Headline",
      type: "h1",
      variantA: "The Mortgage-Native Trustpilot Alternative",
      variantB: "Trustpilot Is Generic — RepWell Is Built for Mortgage",
      enabled: true,
    },
    ctaCopyTest: {
      id: "trustpilot-cta-copy",
      name: "Trustpilot CTA Copy",
      type: "cta_copy",
      variantA: "Start Free Trial",
      variantB: "Switch to RepWell",
      enabled: true,
    },
    ctaColorTest: {
      id: "trustpilot-cta-color",
      name: "Trustpilot CTA Color",
      type: "cta_color",
      variantA: "bg-repwell-teal-300 hover:bg-repwell-teal-400",
      variantB: "bg-teal-500 hover:bg-teal-600",
      enabled: false,
    },
  },
};

/** Get A/B test config for a given page slug. Returns undefined if no tests configured. */
export function getPageABTestConfig(
  slug: string,
): PageABTestConfig | undefined {
  return abTestConfigs[slug];
}

/** Extract all defined tests from a page config (regardless of enabled state). */
export function getPageTests(config: PageABTestConfig): ABTestConfig[] {
  return [config.h1Test, config.ctaCopyTest, config.ctaColorTest].filter(
    (t): t is ABTestConfig => t != null,
  );
}

/** Get all active test IDs across all pages */
export function getAllActiveTestIds(): string[] {
  return Object.values(abTestConfigs)
    .flatMap(getPageTests)
    .filter((t) => t.enabled)
    .map((t) => t.id);
}
