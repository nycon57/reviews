/**
 * E2E tests for domain restriction.
 * Validates that widgets are blocked on unauthorized domains
 * and allowed on authorized domains.
 */

import {
  test,
  expect,
  loadEmbedPage,
  MOCK_WIDGET_ID,
  mockWidgetConfig,
  mockReviewsResponse,
} from "./fixtures";

test.describe("Domain Restriction", () => {
  test("widget renders when domain is authorized", async ({ page }) => {
    // Mock API to return 200 (domain allowed)
    await page.route(
      `**/api/v1/widgets/${MOCK_WIDGET_ID}/config`,
      async (route) => {
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
          body: JSON.stringify(mockReviewsResponse()),
        });
      }
    );
    await page.route(`**/api/v1/widgets/${MOCK_WIDGET_ID}/events`, async (route) => {
      await route.fulfill({ status: 204 });
    });

    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await page.waitForTimeout(2000);

    const widgetHost = page.locator(
      `[data-repwell-widget="${MOCK_WIDGET_ID}"]`
    );
    await expect(widgetHost).toHaveAttribute("data-repwell-initialized", /.+/);

    // Should not show domain error
    const hasError = await widgetHost.evaluate((el) => {
      const shadow = el.shadowRoot;
      return (shadow?.textContent ?? "").includes("not authorized");
    });
    expect(hasError).toBe(false);
  });

  test("widget shows error when domain is blocked (403)", async ({
    page,
  }) => {
    // Mock API to return 403 (domain not allowed)
    await page.route(
      `**/api/v1/widgets/${MOCK_WIDGET_ID}/config`,
      async (route) => {
        await route.fulfill({
          status: 403,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({
            error: "Origin not allowed",
            code: "FORBIDDEN",
          }),
        });
      }
    );

    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await page.waitForTimeout(2000);

    const widgetHost = page.locator(
      `[data-repwell-widget="${MOCK_WIDGET_ID}"]`
    );

    // Should show domain authorization error
    const shadowText = await widgetHost.evaluate((el) => {
      const shadow = el.shadowRoot;
      return shadow?.textContent ?? "";
    });

    expect(shadowText.toLowerCase()).toContain("not authorized");
  });

  test("console warns about domain restriction", async ({ page }) => {
    const consoleMessages: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "warning") {
        consoleMessages.push(msg.text());
      }
    });

    await page.route(
      `**/api/v1/widgets/${MOCK_WIDGET_ID}/config`,
      async (route) => {
        await route.fulfill({
          status: 403,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify({
            error: "Origin not allowed",
            code: "FORBIDDEN",
          }),
        });
      }
    );

    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await page.waitForTimeout(2000);

    const domainWarning = consoleMessages.some(
      (msg) =>
        msg.includes("not authorized") || msg.includes("DomainNotAllowed")
    );
    expect(domainWarning).toBe(true);
  });
});
