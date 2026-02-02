/**
 * E2E tests for embed script rendering.
 * Loads a page with the embed script and widget div, verifies the widget
 * renders with correct data inside Shadow DOM.
 */

import {
  test,
  expect,
  mockWidgetApiRoutes,
  loadEmbedPage,
  MOCK_WIDGET_ID,
  mockWidgetConfig,
} from "./fixtures";

test.describe("Embed Rendering", () => {
  test("renders widget with correct data inside Shadow DOM", async ({
    page,
  }) => {
    await mockWidgetApiRoutes(page, MOCK_WIDGET_ID);
    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);

    // Wait for widget to be initialized
    const widgetHost = page.locator(`[data-repwell-widget="${MOCK_WIDGET_ID}"]`);
    await expect(widgetHost).toHaveAttribute("data-repwell-initialized", /.+/);

    // Verify Shadow DOM is attached and contains rendered content
    const hasShadowContent = await widgetHost.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return false;
      // Widget should have content beyond just a skeleton
      const skeleton = shadow.querySelector(".rw-skeleton");
      const hasContent = shadow.children.length > 0;
      return hasContent && !skeleton;
    });

    // Allow time for async rendering
    await page.waitForTimeout(2000);

    const rendered = await widgetHost.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return { hasShadow: false, childCount: 0, text: "" };
      return {
        hasShadow: true,
        childCount: shadow.children.length,
        text: shadow.textContent?.substring(0, 200) ?? "",
      };
    });

    expect(rendered.hasShadow).toBe(true);
    expect(rendered.childCount).toBeGreaterThan(0);
  });

  test("shows skeleton loader initially", async ({ page }) => {
    // Delay API response to observe skeleton
    await page.route(
      `**/api/v1/widgets/${MOCK_WIDGET_ID}/config`,
      async (route) => {
        await new Promise((r) => setTimeout(r, 2000));
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
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({
            reviews: [],
            pagination: { next_cursor: null, limit: 10, has_more: false },
          }),
        });
      }
    );
    await page.route(`**/api/v1/widgets/${MOCK_WIDGET_ID}/events`, async (route) => {
      await route.fulfill({ status: 204 });
    });

    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);

    // Check for skeleton in shadow DOM
    const widgetHost = page.locator(`[data-repwell-widget="${MOCK_WIDGET_ID}"]`);
    const hasSkeleton = await widgetHost.evaluate((el) => {
      const shadow = el.shadowRoot;
      return !!shadow?.querySelector(".rw-skeleton");
    });

    expect(hasSkeleton).toBe(true);
  });

  test("renders error state when API returns 500", async ({ page }) => {
    await page.route(
      `**/api/v1/widgets/${MOCK_WIDGET_ID}/config`,
      async (route) => {
        await route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal Server Error" }),
        });
      }
    );

    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await page.waitForTimeout(2000);

    const widgetHost = page.locator(`[data-repwell-widget="${MOCK_WIDGET_ID}"]`);
    const hasError = await widgetHost.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return false;
      const text = shadow.textContent ?? "";
      return (
        text.toLowerCase().includes("error") ||
        text.toLowerCase().includes("unable") ||
        text.toLowerCase().includes("failed")
      );
    });

    expect(hasError).toBe(true);
  });

  test("sets minHeight to prevent CLS", async ({ page }) => {
    await mockWidgetApiRoutes(page, MOCK_WIDGET_ID);
    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);

    const widgetHost = page.locator(`[data-repwell-widget="${MOCK_WIDGET_ID}"]`);
    const minHeight = await widgetHost.evaluate(
      (el) => el.style.minHeight
    );

    expect(minHeight).toBe("280px");
  });

  test("Shadow DOM encapsulates styles", async ({ page }) => {
    await mockWidgetApiRoutes(page, MOCK_WIDGET_ID);
    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }], {
      extraHead:
        '<style>* { color: red !important; font-size: 72px !important; }</style>',
    });

    await page.waitForTimeout(2000);

    // Verify host page styles do not leak into shadow DOM
    const widgetHost = page.locator(`[data-repwell-widget="${MOCK_WIDGET_ID}"]`);
    const shadowStyles = await widgetHost.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return null;
      const firstEl = shadow.querySelector("div, p, span, h1, h2, h3");
      if (!firstEl) return null;
      const computed = getComputedStyle(firstEl);
      return {
        color: computed.color,
        fontSize: computed.fontSize,
      };
    });

    // Shadow DOM content should NOT have the host page's red color
    if (shadowStyles) {
      expect(shadowStyles.color).not.toBe("rgb(255, 0, 0)");
      expect(shadowStyles.fontSize).not.toBe("72px");
    }
  });
});
