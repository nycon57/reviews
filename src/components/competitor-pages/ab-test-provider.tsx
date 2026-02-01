"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import type { ABTestConfig, ABTestEvent, ABVariant, PageABTestConfig } from "@/lib/ab-testing";
import {
  getVariantAssignment,
  trackABEvent,
} from "@/lib/ab-testing";
import { useSwitchingFromContext } from "./switching-from-provider";

interface ABTestContextValue {
  /** H1 headline variant value (resolved text), or null if no test active */
  h1: string | null;
  /** Primary CTA copy variant value, or null if no test active */
  ctaCopy: string | null;
  /** Primary CTA color classes, or null if no test active */
  ctaColor: string | null;
  /** Track a CTA click event for all active tests */
  trackCtaClick: () => void;
  /** Track a demo booked event for all active tests */
  trackDemoBooked: () => void;
  /** Raw variant assignments by test ID */
  assignments: Record<string, ABVariant>;
}

const ABTestContext = createContext<ABTestContextValue>({
  h1: null,
  ctaCopy: null,
  ctaColor: null,
  trackCtaClick: () => {},
  trackDemoBooked: () => {},
  assignments: {},
});

interface ABTestProviderProps {
  children: ReactNode;
  config: PageABTestConfig | null;
  slug: string;
}

/** Resolve an enabled test to its assigned variant value, recording the assignment. */
function resolveTest(
  test: ABTestConfig | undefined,
  assignments: Record<string, ABVariant>,
): string | null {
  if (!test?.enabled) return null;
  const variant = getVariantAssignment(test.id);
  assignments[test.id] = variant;
  return variant === "A" ? test.variantA : test.variantB;
}

const EMPTY_CONTEXT: ABTestContextValue = {
  h1: null,
  ctaCopy: null,
  ctaColor: null,
  trackCtaClick: () => {},
  trackDemoBooked: () => {},
  assignments: {},
};

/**
 * Provides A/B test variant values to competitor page sections.
 * Handles variant assignment, page_view tracking, and event helpers.
 */
export function ABTestProvider({ children, config, slug }: ABTestProviderProps) {
  const { competitor } = useSwitchingFromContext();

  const value = useMemo<ABTestContextValue>(() => {
    if (!config) return EMPTY_CONTEXT;

    const assignments: Record<string, ABVariant> = {};
    const h1 = resolveTest(config.h1Test, assignments);
    const ctaCopy = resolveTest(config.ctaCopyTest, assignments);
    const ctaColor = resolveTest(config.ctaColorTest, assignments);

    const trackEvents = (eventType: ABTestEvent["eventType"]) => {
      for (const [testId, variant] of Object.entries(assignments)) {
        trackABEvent(testId, variant, eventType, slug, {
          switchingFrom: competitor ?? undefined,
        });
      }
    };

    return {
      h1,
      ctaCopy,
      ctaColor,
      trackCtaClick: () => trackEvents("cta_click"),
      trackDemoBooked: () => trackEvents("demo_booked"),
      assignments,
    };
  }, [config, slug, competitor]);

  // Track page_view on mount for all active tests
  useEffect(() => {
    if (!config) return;
    for (const [testId, variant] of Object.entries(value.assignments)) {
      trackABEvent(testId, variant, "page_view", slug, {
        switchingFrom: competitor ?? undefined,
      });
    }
    // Only fire on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ABTestContext.Provider value={value}>{children}</ABTestContext.Provider>
  );
}

/** Read A/B test context from any child component. */
export function useABTestContext(): ABTestContextValue {
  return useContext(ABTestContext);
}
