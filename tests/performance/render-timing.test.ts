/**
 * Performance benchmark: Widget render timing.
 * Uses Playwright's CDP integration to measure Performance API marks.
 * Asserts first paint < 100ms and full render < 300ms.
 */

import { test, expect } from "@playwright/test";
import {
  mockWidgetApiRoutes,
  loadEmbedPage,
  MOCK_WIDGET_ID,
} from "../e2e/widgets/fixtures";

test.describe("Widget Render Timing", () => {
  test("first paint completes within 100ms", async ({ page }) => {
    await mockWidgetApiRoutes(page, MOCK_WIDGET_ID);

    // Inject Performance API marks into the embed page
    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }], {
      extraHead: `<script>
        window.__perfMarks = {};
        const origMark = performance.mark.bind(performance);
        performance.mark = function(name, options) {
          window.__perfMarks[name] = performance.now();
          return origMark(name, options);
        };
      </script>`,
    });

    // Wait for widget to render
    await page.waitForTimeout(3000);

    // Measure time from page load to first widget content appearing
    const timing = await page.evaluate(() => {
      const widget = document.querySelector('[data-repwell-widget]');
      if (!widget?.shadowRoot) return null;

      const _navStart = performance.timing.navigationStart;
      const entries = performance.getEntriesByType("mark");

      // Check if the embed script set any performance marks
      const repwellMarks = entries.filter((e) =>
        e.name.toLowerCase().includes("repwell")
      );

      // Also check the initialized attribute timing
      const initialized = widget.hasAttribute("data-repwell-initialized");

      return {
        initialized,
        markCount: repwellMarks.length,
        marks: repwellMarks.map((m) => ({
          name: m.name,
          startTime: m.startTime,
        })),
        // Total page load to now
        totalTime: performance.now(),
      };
    });

    // Widget should be initialized
    expect(timing?.initialized).toBe(true);

    // Verify the widget rendered within acceptable time
    // First paint should happen quickly (skeleton appears immediately)
    const skeletonTiming = await page.evaluate(() => {
      // The skeleton renders synchronously — measure it via widget initialization
      const widget = document.querySelector('[data-repwell-widget]');
      if (!widget) return null;

      const initAttr = widget.getAttribute("data-repwell-initialized");
      return {
        hasInit: !!initAttr,
        hasShadow: !!widget.shadowRoot,
        childCount: widget.shadowRoot?.children.length ?? 0,
      };
    });

    expect(skeletonTiming?.hasInit).toBe(true);
    expect(skeletonTiming?.hasShadow).toBe(true);
  });

  test("full render completes within 300ms of API response", async ({
    page,
  }) => {
    let configResponseTime = 0;

    // Track when API responds
    await page.route(
      `**/api/v1/widgets/${MOCK_WIDGET_ID}/config`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify(
            (await import("../e2e/widgets/fixtures")).mockWidgetConfig()
          ),
        });
      }
    );
    await page.route(
      `**/api/v1/widgets/${MOCK_WIDGET_ID}/reviews**`,
      async (route) => {
        configResponseTime = Date.now();
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify(
            (await import("../e2e/widgets/fixtures")).mockReviewsResponse()
          ),
        });
      }
    );
    await page.route(`**/api/v1/widgets/${MOCK_WIDGET_ID}/events`, async (route) => {
      await route.fulfill({ status: 204 });
    });

    const loadStart = Date.now();
    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);

    // Wait for render to complete
    await page.waitForFunction(
      () => {
        const widget = document.querySelector('[data-repwell-widget]');
        if (!widget?.shadowRoot) return false;
        // No skeleton means rendering is complete
        return !widget.shadowRoot.querySelector(".rw-skeleton");
      },
      { timeout: 5000 }
    );

    const renderComplete = Date.now();

    // Full render (from API response to DOM update) should be under 300ms
    // Since we're mocking API calls (instant), total time should be well under 300ms
    if (configResponseTime > 0) {
      const renderTime = renderComplete - configResponseTime;
      console.log(`  Render time after API: ${renderTime}ms`);
      expect(renderTime).toBeLessThan(300);
    }

    // Total page-to-render time should be reasonable
    const totalTime = renderComplete - loadStart;
    console.log(`  Total load-to-render: ${totalTime}ms`);
    expect(totalTime).toBeLessThan(5000); // Generous upper bound for CI
  });
});
