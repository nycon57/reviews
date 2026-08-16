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
  mockWidgetConfig,
  waitForWidgetRendered,
  waitForWidgetEventRequest,
} from "./fixtures";

test.describe("Widget Analytics Events", () => {
  test("fires impression event when widget becomes visible", async ({
    page,
  }) => {
    await mockWidgetApiRoutes(page, MOCK_WIDGET_ID);

    const impressionRequest = waitForWidgetEventRequest(
      page,
      MOCK_WIDGET_ID,
      (event) => event.event_type === "impression"
    );

    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await waitForWidgetRendered(page);

    const impression = await impressionRequest;
    expect(impression.event_type).toBe("impression");
  });

  test("fires click event on CTA interaction", async ({ page }) => {
    await mockWidgetApiRoutes(page, MOCK_WIDGET_ID, {
      config: {
        ...mockWidgetConfig().config,
        content: {
          ...mockWidgetConfig().config.content,
          showCTA: true,
          ctaText: "Read more reviews",
          ctaUrl: "https://example.com/reviews",
        },
      },
    });

    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await waitForWidgetRendered(page);

    const clickRequest = waitForWidgetEventRequest(
      page,
      MOCK_WIDGET_ID,
      (event) => event.event_type === "click_cta"
    );

    await page
      .locator(`[data-repwell-widget="${MOCK_WIDGET_ID}"]`)
      .evaluate((el) => {
        const cta = el.shadowRoot?.querySelector<HTMLAnchorElement>(".rw-cta");
        if (!cta) {
          throw new Error("Expected CTA link to be rendered");
        }
        cta.click();
      });

    const clickEvent = await clickRequest;
    expect(clickEvent.event_type).toBe("click_cta");
    expect(clickEvent.metadata?.session_id).toBeTruthy();
  });

  test("impression event includes session_id", async ({ page }) => {
    await mockWidgetApiRoutes(page, MOCK_WIDGET_ID);

    const impressionRequest = waitForWidgetEventRequest(
      page,
      MOCK_WIDGET_ID,
      (event) =>
        event.event_type === "impression" && !!event.metadata?.session_id
    );

    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await waitForWidgetRendered(page);

    const impression = await impressionRequest;
    expect(impression.metadata?.session_id).toBeTruthy();
  });
});
