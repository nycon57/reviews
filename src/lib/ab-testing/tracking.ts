// A/B test event tracking (S131)
// Fires events to GTM dataLayer and localStorage for dashboard aggregation

import type { ABTestEvent, ABVariant } from "./types";

const STORAGE_KEY = "rw_ab_events";
const MAX_STORED_EVENTS = 1000;

/**
 * Track an A/B test event (page_view, cta_click, demo_booked).
 * Pushes to GTM dataLayer and stores in localStorage for dashboard reporting.
 */
export function trackABEvent(
  testId: string,
  variant: ABVariant,
  eventType: ABTestEvent["eventType"],
  slug: string,
  extra?: { source?: string; switchingFrom?: string },
): void {
  if (typeof window === "undefined") return;

  const event: ABTestEvent = {
    testId,
    variant,
    eventType,
    slug,
    timestamp: new Date().toISOString(),
    source: extra?.source ?? detectTrafficSource(),
    switchingFrom: extra?.switchingFrom,
  };

  // Push to GTM dataLayer
  const win = window as unknown as { dataLayer?: Record<string, unknown>[] };
  if (Array.isArray(win.dataLayer)) {
    win.dataLayer.push({
      event: "ab_test_event",
      ab_test_id: testId,
      ab_variant: variant,
      ab_event_type: eventType,
      ab_page_slug: slug,
      ab_source: event.source,
      ab_switching_from: event.switchingFrom,
    });
  }

  // Dispatch custom DOM event for analytics wrappers
  window.dispatchEvent(
    new CustomEvent("rw:ab_event", { detail: event }),
  );

  // Store in localStorage for dashboard aggregation
  storeEvent(event);
}

/**
 * Detect traffic source from document.referrer and URL params.
 */
function detectTrafficSource(): string {
  if (typeof window === "undefined") return "unknown";

  const params = new URLSearchParams(window.location.search);

  // Check UTM params first
  const utmSource = params.get("utm_source");
  if (utmSource) return utmSource;

  // Check gclid/fbclid for paid traffic
  if (params.get("gclid")) return "paid_google";
  if (params.get("fbclid")) return "paid_facebook";

  // Check referrer
  const referrer = document.referrer;
  if (!referrer) return "direct";

  try {
    const refUrl = new URL(referrer);
    const host = refUrl.hostname.toLowerCase();

    if (host.includes("google")) return "organic_google";
    if (host.includes("bing")) return "organic_bing";
    if (host.includes("yahoo")) return "organic_yahoo";
    if (host.includes("facebook") || host.includes("fb.com")) return "social_facebook";
    if (host.includes("linkedin")) return "social_linkedin";
    if (host.includes("twitter") || host.includes("x.com")) return "social_twitter";

    // Same-site navigation
    if (refUrl.hostname === window.location.hostname) return "internal";

    return "referral";
  } catch {
    return "unknown";
  }
}

/** Classify a detailed source into a high-level category */
export function classifyTrafficSource(source: string): string {
  if (source.startsWith("organic_")) return "organic";
  if (source.startsWith("paid_")) return "paid";
  if (source.startsWith("social_")) return "social";
  if (source === "direct") return "direct";
  if (source === "referral") return "referral";
  if (source === "internal") return "internal";
  return "other";
}

/**
 * Store an event in localStorage. Caps at MAX_STORED_EVENTS.
 */
function storeEvent(event: ABTestEvent): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const events: ABTestEvent[] = raw ? JSON.parse(raw) : [];
    events.push(event);

    // Trim oldest events if over limit
    const trimmed = events.length > MAX_STORED_EVENTS
      ? events.slice(events.length - MAX_STORED_EVENTS)
      : events;

    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage unavailable or full
  }
}

/** Read all stored A/B test events from localStorage */
export function getStoredABEvents(): ABTestEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Clear stored A/B test events */
export function clearStoredABEvents(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
