/**
 * E2E tests for multiple widgets on a single page.
 * Verifies independent rendering with no cross-widget interference.
 */

import {
  test,
  expect,
  mockWidgetApiRoutes,
  loadEmbedPage,
  MOCK_WIDGET_ID,
  MOCK_WIDGET_ID_2,
} from "./fixtures";

test.describe("Multiple Widgets on Single Page", () => {
  test("renders two widgets independently", async ({ page }) => {
    await mockWidgetApiRoutes(page, MOCK_WIDGET_ID, {
      widget_type: "lo_review",
      name: "Widget A",
    });
    await mockWidgetApiRoutes(page, MOCK_WIDGET_ID_2, {
      widget_type: "star_rating_badge",
      name: "Widget B",
    });

    await loadEmbedPage(page, [
      { id: MOCK_WIDGET_ID },
      { id: MOCK_WIDGET_ID_2 },
    ]);

    await page.waitForTimeout(2000);

    // Both widgets should be initialized
    const widget1 = page.locator(
      `[data-repwell-widget="${MOCK_WIDGET_ID}"]`
    );
    const widget2 = page.locator(
      `[data-repwell-widget="${MOCK_WIDGET_ID_2}"]`
    );

    await expect(widget1).toHaveAttribute("data-repwell-initialized", /.+/);
    await expect(widget2).toHaveAttribute("data-repwell-initialized", /.+/);

    // Each widget should have its own Shadow DOM
    const shadows = await page.evaluate(() => {
      const w1 = document.querySelector(
        '[data-repwell-widget="test-widget-001"]'
      );
      const w2 = document.querySelector(
        '[data-repwell-widget="test-widget-002"]'
      );
      return {
        w1HasShadow: !!w1?.shadowRoot,
        w2HasShadow: !!w2?.shadowRoot,
      };
    });

    expect(shadows.w1HasShadow).toBe(true);
    expect(shadows.w2HasShadow).toBe(true);
  });

  test("widget instances have unique IDs", async ({ page }) => {
    await mockWidgetApiRoutes(page, MOCK_WIDGET_ID);
    await mockWidgetApiRoutes(page, MOCK_WIDGET_ID_2);

    await loadEmbedPage(page, [
      { id: MOCK_WIDGET_ID },
      { id: MOCK_WIDGET_ID_2 },
    ]);

    await page.waitForTimeout(2000);

    const ids = await page.evaluate(() => {
      const w1 = document.querySelector(
        '[data-repwell-widget="test-widget-001"]'
      );
      const w2 = document.querySelector(
        '[data-repwell-widget="test-widget-002"]'
      );
      return {
        id1: w1?.getAttribute("data-repwell-initialized"),
        id2: w2?.getAttribute("data-repwell-initialized"),
      };
    });

    expect(ids.id1).toBeTruthy();
    expect(ids.id2).toBeTruthy();
    expect(ids.id1).not.toBe(ids.id2);
  });

  test("destroying one widget does not affect the other", async ({
    page,
  }) => {
    await mockWidgetApiRoutes(page, MOCK_WIDGET_ID);
    await mockWidgetApiRoutes(page, MOCK_WIDGET_ID_2);

    await loadEmbedPage(page, [
      { id: MOCK_WIDGET_ID },
      { id: MOCK_WIDGET_ID_2 },
    ]);

    await page.waitForTimeout(2000);

    // Destroy widget 1
    await page.evaluate((wid) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).RepWell.destroy(wid);
    }, MOCK_WIDGET_ID);

    // Widget 1 should be cleaned up
    const widget1 = page.locator(
      `[data-repwell-widget="${MOCK_WIDGET_ID}"]`
    );
    await expect(widget1).not.toHaveAttribute("data-repwell-initialized");

    // Widget 2 should still be initialized
    const widget2 = page.locator(
      `[data-repwell-widget="${MOCK_WIDGET_ID_2}"]`
    );
    await expect(widget2).toHaveAttribute("data-repwell-initialized", /.+/);
  });
});
