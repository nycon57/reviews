/**
 * Performance benchmark: Memory profiling with multiple widgets.
 * Asserts < 2MB total heap increase when rendering 5 widgets.
 * Uses Chrome DevTools Protocol heap snapshot via Playwright.
 */

import { test, expect } from "@playwright/test";
import {
  loadEmbedPage,
  mockWidgetConfig,
  mockReviewsResponse,
} from "../e2e/widgets/fixtures";

const WIDGET_IDS = [
  "mem-widget-001",
  "mem-widget-002",
  "mem-widget-003",
  "mem-widget-004",
  "mem-widget-005",
];

const MAX_HEAP_INCREASE_BYTES = 2 * 1024 * 1024; // 2MB

test.describe("Widget Memory Profiling", () => {
  test("5 widgets use less than 2MB of heap", async ({ page }) => {
    // Mock API routes for all 5 widgets
    for (const id of WIDGET_IDS) {
      await page.route(
        `**/api/v1/widgets/${id}/config`,
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(mockWidgetConfig({ widget_id: id })),
          });
        }
      );
      await page.route(
        `**/api/v1/widgets/${id}/reviews**`,
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(mockReviewsResponse(5)),
          });
        }
      );
      await page.route(`**/api/v1/widgets/${id}/events`, async (route) => {
        await route.fulfill({ status: 204 });
      });
    }

    // Measure baseline heap before widgets
    const cdpSession = await page.context().newCDPSession(page);

    // Navigate to a blank page first to get baseline
    await page.goto("about:blank");
    await page.waitForTimeout(500);

    // Force GC and measure baseline
    await cdpSession.send("HeapProfiler.collectGarbage");
    const baselineMetrics = await cdpSession.send(
      "Performance.getMetrics"
    );
    const baselineHeap =
      baselineMetrics.metrics.find((m) => m.name === "JSHeapUsedSize")
        ?.value ?? 0;

    // Load page with 5 widgets
    await loadEmbedPage(
      page,
      WIDGET_IDS.map((id) => ({ id }))
    );

    // Wait for all widgets to render
    await page.waitForTimeout(5000);

    // Force GC and measure post-widget heap
    await cdpSession.send("HeapProfiler.collectGarbage");
    const postMetrics = await cdpSession.send("Performance.getMetrics");
    const postHeap =
      postMetrics.metrics.find((m) => m.name === "JSHeapUsedSize")?.value ??
      0;

    const heapIncrease = postHeap - baselineHeap;
    const heapIncreaseMB = heapIncrease / (1024 * 1024);

    console.log(`  Baseline heap: ${(baselineHeap / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Post-widget heap: ${(postHeap / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap increase: ${heapIncreaseMB.toFixed(2)} MB`);
    console.log(`  Budget: ${(MAX_HEAP_INCREASE_BYTES / 1024 / 1024).toFixed(2)} MB`);

    expect(heapIncrease).toBeLessThanOrEqual(MAX_HEAP_INCREASE_BYTES);
  });

  test("destroying widgets releases memory", async ({ page }) => {
    const id = "mem-cleanup-001";

    await page.route(`**/api/v1/widgets/${id}/config`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(mockWidgetConfig({ widget_id: id })),
      });
    });
    await page.route(`**/api/v1/widgets/${id}/reviews**`, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(mockReviewsResponse(5)),
      });
    });
    await page.route(`**/api/v1/widgets/${id}/events`, async (route) => {
      await route.fulfill({ status: 204 });
    });

    await loadEmbedPage(page, [{ id }]);
    await page.waitForTimeout(2000);

    const cdpSession = await page.context().newCDPSession(page);

    // Measure heap with widget
    await cdpSession.send("HeapProfiler.collectGarbage");
    const withWidget = await cdpSession.send("Performance.getMetrics");
    const heapWith =
      withWidget.metrics.find((m) => m.name === "JSHeapUsedSize")?.value ?? 0;

    // Destroy the widget
    await page.evaluate((widgetId) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).RepWell.destroy(widgetId);
    }, id);

    await page.waitForTimeout(500);

    // Force GC and measure again
    await cdpSession.send("HeapProfiler.collectGarbage");
    const afterDestroy = await cdpSession.send("Performance.getMetrics");
    const heapAfter =
      afterDestroy.metrics.find((m) => m.name === "JSHeapUsedSize")?.value ??
      0;

    console.log(`  Heap with widget: ${(heapWith / 1024 / 1024).toFixed(2)} MB`);
    console.log(`  Heap after destroy: ${(heapAfter / 1024 / 1024).toFixed(2)} MB`);

    // Heap should not grow after destroy (some tolerance for GC timing)
    expect(heapAfter).toBeLessThanOrEqual(heapWith * 1.1);
  });
});
