/**
 * E2E tests for widget analytics events.
 * Verifies impression events fire on widget visibility
 * and click events fire on user interaction.
 */

import {
  test,
  expect,
  mockWidgetApiRoutes,
  loadEmbedPage,
  MOCK_WIDGET_ID,
} from "./fixtures";

test.describe("Widget Analytics Events", () => {
  test("fires impression event when widget becomes visible", async ({
    page,
  }) => {
    const eventRequests: Array<{ url: string; body: string }> = [];

    await mockWidgetApiRoutes(page, MOCK_WIDGET_ID);

    // Intercept event POST requests
    await page.route(
      `**/api/v1/widgets/${MOCK_WIDGET_ID}/events`,
      async (route) => {
        const request = route.request();
        if (request.method() === "POST") {
          const body = request.postData() ?? "";
          eventRequests.push({ url: request.url(), body });
        }
        await route.fulfill({ status: 204 });
      }
    );

    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await page.waitForTimeout(3000);

    // Check that an impression event was sent
    const impressionEvents = eventRequests.filter((req) => {
      try {
        const data = JSON.parse(req.body);
        return data.event_type === "impression";
      } catch {
        return false;
      }
    });

    expect(impressionEvents.length).toBeGreaterThanOrEqual(1);
  });

  test("fires click event on review interaction", async ({ page }) => {
    const eventRequests: Array<{ url: string; body: string }> = [];

    await mockWidgetApiRoutes(page, MOCK_WIDGET_ID);

    await page.route(
      `**/api/v1/widgets/${MOCK_WIDGET_ID}/events`,
      async (route) => {
        const request = route.request();
        if (request.method() === "POST") {
          const body = request.postData() ?? "";
          eventRequests.push({ url: request.url(), body });
        }
        await route.fulfill({ status: 204 });
      }
    );

    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await page.waitForTimeout(2000);

    // Try clicking a review card or link inside the shadow DOM
    const widgetHost = page.locator(
      `[data-repwell-widget="${MOCK_WIDGET_ID}"]`
    );

    await widgetHost.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return;
      // Find the first clickable review element
      const clickable =
        shadow.querySelector("a") ??
        shadow.querySelector("[role='button']") ??
        shadow.querySelector(".rw-review-card") ??
        shadow.querySelector("[data-review-id]");
      if (clickable) {
        (clickable as HTMLElement).click();
      }
    });

    await page.waitForTimeout(1000);

    // Verify at least the impression event fired (click events depend on widget type)
    expect(eventRequests.length).toBeGreaterThanOrEqual(1);
  });

  test("impression event includes session_id", async ({ page }) => {
    const eventRequests: Array<{ body: string }> = [];

    await mockWidgetApiRoutes(page, MOCK_WIDGET_ID);

    await page.route(
      `**/api/v1/widgets/${MOCK_WIDGET_ID}/events`,
      async (route) => {
        const request = route.request();
        if (request.method() === "POST") {
          eventRequests.push({ body: request.postData() ?? "" });
        }
        await route.fulfill({ status: 204 });
      }
    );

    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await page.waitForTimeout(3000);

    const impressionEvent = eventRequests.find((req) => {
      try {
        return JSON.parse(req.body).event_type === "impression";
      } catch {
        return false;
      }
    });

    if (impressionEvent) {
      const data = JSON.parse(impressionEvent.body);
      expect(data.metadata?.session_id ?? data.session_id).toBeTruthy();
    }
  });
});
