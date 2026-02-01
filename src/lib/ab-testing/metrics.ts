// A/B test metrics computation (S131)
// Aggregates stored events into dashboard-ready metrics

import type {
  ABTestConfig,
  ABTestEvent,
  ABTestMetrics,
  ABVariantMetrics,
  CompetitorPageMetrics,
  TrafficSourceBreakdown,
  WeeklyReportData,
} from "./types";
import { abTestConfigs, getPageTests } from "./config";
import { classifyTrafficSource } from "./tracking";
import { competitorConfigs } from "@/lib/competitor-pages";

/** Calculate z-score for A/B test significance (two-proportion z-test) */
function calculateSignificance(
  rateA: number,
  nA: number,
  rateB: number,
  nB: number,
): boolean {
  if (nA < 30 || nB < 30) return false; // Minimum sample size

  const pooledRate = (rateA * nA + rateB * nB) / (nA + nB);
  if (pooledRate === 0 || pooledRate === 1) return false;

  const se = Math.sqrt(pooledRate * (1 - pooledRate) * (1 / nA + 1 / nB));
  if (se === 0) return false;

  const z = Math.abs(rateA - rateB) / se;
  return z >= 1.96; // p < 0.05
}

/** Build variant metrics from filtered events */
function buildVariantMetrics(
  events: ABTestEvent[],
  variant: "A" | "B",
): ABVariantMetrics {
  const filtered = events.filter((e) => e.variant === variant);
  const views = filtered.filter((e) => e.eventType === "page_view").length;
  const ctaClicks = filtered.filter((e) => e.eventType === "cta_click").length;
  const demosBooked = filtered.filter(
    (e) => e.eventType === "demo_booked",
  ).length;

  return {
    variant,
    views,
    ctaClicks,
    demosBooked,
    ctr: views > 0 ? ctaClicks / views : 0,
    conversionRate: views > 0 ? demosBooked / views : 0,
  };
}

/** Build a lookup map from test ID to its config. */
function buildTestConfigMap(): Map<string, ABTestConfig> {
  const map = new Map<string, ABTestConfig>();
  for (const pageConfig of Object.values(abTestConfigs)) {
    for (const test of getPageTests(pageConfig)) {
      map.set(test.id, test);
    }
  }
  return map;
}

/** Compute A/B test metrics from raw events */
export function computeABTestMetrics(
  events: ABTestEvent[],
): ABTestMetrics[] {
  const testIds = new Set(events.map((e) => e.testId));
  const configMap = buildTestConfigMap();
  const results: ABTestMetrics[] = [];

  for (const testId of testIds) {
    const testEvents = events.filter((e) => e.testId === testId);
    const variantA = buildVariantMetrics(testEvents, "A");
    const variantB = buildVariantMetrics(testEvents, "B");

    const testConfig = configMap.get(testId);
    const testName = testConfig?.name ?? testId;
    const testType = testConfig?.type ?? "h1";

    const isSignificant = calculateSignificance(
      variantA.conversionRate,
      variantA.views,
      variantB.conversionRate,
      variantB.views,
    );

    const winner = isSignificant
      ? variantA.conversionRate > variantB.conversionRate ? "A" : "B"
      : null;

    results.push({
      testId,
      testName,
      testType,
      variantA,
      variantB,
      isSignificant,
      winner,
    });
  }

  return results;
}

/** Compute per-page metrics from raw events */
export function computePageMetrics(
  events: ABTestEvent[],
): CompetitorPageMetrics[] {
  const slugs = new Set(events.map((e) => e.slug));
  const results: CompetitorPageMetrics[] = [];

  for (const slug of slugs) {
    const pageEvents = events.filter((e) => e.slug === slug);
    const views = pageEvents.filter((e) => e.eventType === "page_view").length;
    const ctaClicks = pageEvents.filter(
      (e) => e.eventType === "cta_click",
    ).length;
    const demoConversions = pageEvents.filter(
      (e) => e.eventType === "demo_booked",
    ).length;

    const config = competitorConfigs[slug];
    const competitorName = config?.competitorName ?? slug;

    results.push({
      slug,
      competitorName,
      visits: views,
      bounceRate: views > 0 ? Math.max(0, 1 - ctaClicks / views) * 100 : 0,
      avgTimeOnPage: 0, // Requires real analytics integration
      ctaClicks,
      demoConversions,
      ctr: views > 0 ? ctaClicks / views : 0,
      conversionRate: views > 0 ? demoConversions / views : 0,
    });
  }

  return results;
}

/**
 * Aggregate page-view events into a sorted breakdown by a keying function.
 * Shared logic for traffic source and switching-from distributions.
 */
function aggregatePageViews(
  events: ABTestEvent[],
  keyFn: (e: ABTestEvent) => string | undefined,
): TrafficSourceBreakdown[] {
  const counts: Record<string, number> = {};
  let total = 0;

  for (const event of events) {
    if (event.eventType !== "page_view") continue;
    const key = keyFn(event);
    if (key == null) continue;
    counts[key] = (counts[key] ?? 0) + 1;
    total++;
  }

  if (total === 0) return [];

  return Object.entries(counts)
    .map(([source, visits]) => ({
      source,
      visits,
      percentage: (visits / total) * 100,
    }))
    .sort((a, b) => b.visits - a.visits);
}

/** Compute traffic source breakdown from events */
export function computeTrafficSources(
  events: ABTestEvent[],
): TrafficSourceBreakdown[] {
  return aggregatePageViews(events, (e) =>
    classifyTrafficSource(e.source ?? "unknown"),
  );
}

/** Compute switching_from distribution from events */
export function computeSwitchingFromDistribution(
  events: ABTestEvent[],
): TrafficSourceBreakdown[] {
  return aggregatePageViews(events, (e) => e.switchingFrom);
}

/** Generate weekly report data structure */
export function generateWeeklyReportData(
  events: ABTestEvent[],
): WeeklyReportData {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const weekEvents = events.filter(
    (e) => new Date(e.timestamp) >= weekStart,
  );

  const pages = computePageMetrics(weekEvents);
  const activeTests = computeABTestMetrics(weekEvents);
  const trafficSources = computeTrafficSources(weekEvents);

  const totalVisits = pages.reduce((sum, p) => sum + p.visits, 0);
  const totalCtaClicks = pages.reduce((sum, p) => sum + p.ctaClicks, 0);
  const totalDemoConversions = pages.reduce(
    (sum, p) => sum + p.demoConversions,
    0,
  );

  const topPage = pages.sort((a, b) => b.visits - a.visits)[0];

  return {
    weekStarting: weekStart.toISOString().split("T")[0],
    weekEnding: now.toISOString().split("T")[0],
    pages,
    topPerformingPage: topPage?.slug ?? "",
    totalVisits,
    totalCtaClicks,
    totalDemoConversions,
    overallCtr: totalVisits > 0 ? totalCtaClicks / totalVisits : 0,
    overallConversionRate:
      totalVisits > 0 ? totalDemoConversions / totalVisits : 0,
    activeTests,
    trafficSources,
  };
}
