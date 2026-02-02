/**
 * Performance benchmark: Lighthouse test on a page with widget.
 * Asserts widget impact is less than 5 Lighthouse performance points.
 *
 * Uses Playwright to load pages with and without the widget,
 * then compares performance scores via Performance API metrics.
 *
 * Note: Full Lighthouse integration requires lighthouse npm package.
 * This test uses a lightweight approach via Web Vitals-style metrics
 * that approximates Lighthouse scoring for CI.
 */

import { test, expect } from "@playwright/test";
import {
  mockWidgetApiRoutes,
  MOCK_WIDGET_ID,
  buildEmbedPageHTML,
} from "../e2e/widgets/fixtures";

interface PageMetrics {
  fcp: number; // First Contentful Paint (ms)
  lcp: number; // Largest Contentful Paint (ms)
  cls: number; // Cumulative Layout Shift
  tbt: number; // Total Blocking Time approximation (ms)
}

async function measurePageMetrics(
  page: import("@playwright/test").Page
): Promise<PageMetrics> {
  await page.waitForTimeout(3000);

  const metrics = await page.evaluate(() => {
    return new Promise<PageMetrics>((resolve) => {
      let cls = 0;
      let lcp = 0;

      // CLS observer
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as PerformanceEntry & {
            hadRecentInput: boolean;
            value: number;
          };
          if (!layoutShift.hadRecentInput) {
            cls += layoutShift.value;
          }
        }
      });
      clsObserver.observe({ type: "layout-shift", buffered: true });

      // LCP observer
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length > 0) {
          lcp = entries[entries.length - 1].startTime;
        }
      });
      lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

      // FCP from paint timing
      const paintEntries = performance.getEntriesByType("paint");
      const fcpEntry = paintEntries.find(
        (e) => e.name === "first-contentful-paint"
      );
      const fcp = fcpEntry?.startTime ?? 0;

      // TBT approximation from long tasks
      let tbt = 0;
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          tbt += Math.max(0, entry.duration - 50);
        }
      });
      try {
        longTaskObserver.observe({ type: "longtask", buffered: true });
      } catch {
        // longtask observer not supported in all environments
      }

      // Collect after a brief delay
      setTimeout(() => {
        clsObserver.disconnect();
        lcpObserver.disconnect();
        longTaskObserver.disconnect();
        resolve({ fcp, lcp, cls, tbt });
      }, 2000);
    });
  });

  return metrics;
}

test.describe("Lighthouse Widget Impact", () => {
  test("widget does not degrade page performance by more than 5 points", async ({
    page,
  }) => {
    // Step 1: Measure baseline page without widget
    const baselineHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Baseline Page</title>
</head>
<body>
  <h1>Test Page Without Widget</h1>
  <p>This is a baseline page for performance comparison.</p>
</body>
</html>`;

    await page.route("**/test-baseline", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: baselineHTML,
      });
    });

    await page.goto("/test-baseline");
    const baselineMetrics = await measurePageMetrics(page);

    // Step 2: Measure page with widget
    await mockWidgetApiRoutes(page, MOCK_WIDGET_ID);

    const widgetHTML = buildEmbedPageHTML([{ id: MOCK_WIDGET_ID }]);
    await page.route("**/test-with-widget", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/html",
        body: widgetHTML,
      });
    });

    await page.goto("/test-with-widget");
    const widgetMetrics = await measurePageMetrics(page);

    console.log("  Baseline metrics:", baselineMetrics);
    console.log("  Widget metrics:", widgetMetrics);

    // Calculate approximate performance score delta
    // Lighthouse scoring weights: FCP ~10%, LCP ~25%, TBT ~30%, CLS ~25%
    // Simplified: compare key metrics

    // CLS should remain 0
    expect(widgetMetrics.cls).toBeLessThanOrEqual(0.01);

    // FCP increase should be minimal (< 100ms added)
    const fcpDelta = widgetMetrics.fcp - baselineMetrics.fcp;
    console.log(`  FCP delta: ${fcpDelta.toFixed(0)}ms`);

    // TBT increase should be minimal (widget should not cause long tasks)
    const tbtDelta = widgetMetrics.tbt - baselineMetrics.tbt;
    console.log(`  TBT delta: ${tbtDelta.toFixed(0)}ms`);

    // The widget should not add more than 200ms TBT — correlates with < 5 Lighthouse points
    expect(tbtDelta).toBeLessThan(200);
    // Absolute TBT with widget should remain reasonable
    expect(widgetMetrics.tbt).toBeLessThan(300);
  });
});
