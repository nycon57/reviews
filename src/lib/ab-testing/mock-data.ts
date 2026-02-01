// Mock data for A/B test analytics dashboard (S131)
// Used for dashboard rendering until real analytics pipeline is connected

import type {
  ABTestEvent,
  ABVariant,
} from "./types";
import { abTestConfigs, getPageTests } from "./config";

const SLUGS = Object.keys(abTestConfigs);

const SOURCES = [
  "organic_google",
  "direct",
  "social_linkedin",
  "paid_google",
  "referral",
  "social_twitter",
  "organic_bing",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysBack));
  date.setHours(Math.floor(Math.random() * 24));
  date.setMinutes(Math.floor(Math.random() * 60));
  return date.toISOString();
}

function createMockEvent(
  testId: string,
  variant: ABVariant,
  eventType: ABTestEvent["eventType"],
  slug: string,
): ABTestEvent {
  return {
    testId,
    variant,
    eventType,
    slug,
    timestamp: randomDate(30),
    source: randomItem(SOURCES),
    switchingFrom: Math.random() > 0.6 ? slug.replace("-alternative", "") : undefined,
  };
}

/**
 * Generate realistic mock A/B test events for the dashboard.
 * Creates events across all 5 competitor pages over the past 30 days.
 */
export function generateMockABEvents(count: number = 2000): ABTestEvent[] {
  const events: ABTestEvent[] = [];

  for (let i = 0; i < count; i++) {
    const slug = randomItem(SLUGS);
    const config = abTestConfigs[slug];
    if (!config) continue;

    const activeTests = getPageTests(config).filter((t) => t.enabled);
    if (activeTests.length === 0) continue;

    const test = randomItem(activeTests);
    const variant: ABVariant = Math.random() > 0.5 ? "A" : "B";

    events.push(createMockEvent(test.id, variant, "page_view", slug));

    // ~25% chance of CTA click
    if (Math.random() < 0.25) {
      events.push(createMockEvent(test.id, variant, "cta_click", slug));

      // ~10% of clickers book a demo
      if (Math.random() < 0.1) {
        events.push(createMockEvent(test.id, variant, "demo_booked", slug));
      }
    }
  }

  return events.sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );
}
