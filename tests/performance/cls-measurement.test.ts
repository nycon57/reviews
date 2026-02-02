/**
 * Performance benchmark: Cumulative Layout Shift (CLS) measurement.
 * Asserts that the widget contributes 0 CLS to the host page.
 */

import { test, expect } from "@playwright/test";
import {
  mockWidgetApiRoutes,
  loadEmbedPage,
  MOCK_WIDGET_ID,
} from "../e2e/widgets/fixtures";

test.describe("Widget CLS Measurement", () => {
  test("widget contributes zero layout shift", async ({ page }) => {
    await mockWidgetApiRoutes(page, MOCK_WIDGET_ID);

    // Inject CLS observer into the page
    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }], {
      extraHead: `<script>
        window.__clsScore = 0;
        window.__clsEntries = [];

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              window.__clsScore += entry.value;
              window.__clsEntries.push({
                value: entry.value,
                sources: entry.sources?.map(s => ({
                  node: s.node?.tagName,
                  previousRect: s.previousRect,
                  currentRect: s.currentRect,
                })) ?? [],
              });
            }
          }
        });

        observer.observe({ type: 'layout-shift', buffered: true });
      </script>`,
    });

    // Wait for widget to fully render
    await page.waitForTimeout(3000);

    // Collect CLS data
    const clsData = await page.evaluate(() => {
      return {
        score: (window as { __clsScore?: number }).__clsScore ?? 0,
        entries: (window as { __clsEntries?: unknown[] }).__clsEntries ?? [],
      };
    });

    console.log(`  CLS Score: ${clsData.score}`);
    console.log(`  Layout shift entries: ${clsData.entries.length}`);

    // Widget should contribute 0 CLS
    // The embed script sets minHeight="280px" to reserve space
    expect(clsData.score).toBe(0);
  });

  test("widget host element has reserved height before render", async ({
    page,
  }) => {
    // Delay API to observe the pre-render state
    await page.route(
      `**/api/v1/widgets/${MOCK_WIDGET_ID}/config`,
      async (route) => {
        await new Promise((r) => setTimeout(r, 1000));
        const { mockWidgetConfig } = await import("../e2e/widgets/fixtures");
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify(mockWidgetConfig()),
        });
      }
    );
    await page.route(
      `**/api/v1/widgets/${MOCK_WIDGET_ID}/reviews**`,
      async (route) => {
        const { mockReviewsResponse } = await import(
          "../e2e/widgets/fixtures"
        );
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify(mockReviewsResponse()),
        });
      }
    );
    await page.route(`**/api/v1/widgets/${MOCK_WIDGET_ID}/events`, async (route) => {
      await route.fulfill({ status: 204 });
    });

    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);

    // Check minHeight is set before API response
    const minHeight = await page.evaluate(() => {
      const widget = document.querySelector('[data-repwell-widget]');
      return widget ? (widget as HTMLElement).style.minHeight : "";
    });

    expect(minHeight).toBe("280px");
  });
});
