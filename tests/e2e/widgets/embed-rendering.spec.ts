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
  mockReviewsResponse,
  waitForWidgetRendered,
  waitForWidgetState,
  getShadowText,
} from "./fixtures";

test.describe("Embed Rendering", () => {
  test("renders widget with correct data inside Shadow DOM", async ({
    page,
  }) => {
    await mockWidgetApiRoutes(page, MOCK_WIDGET_ID);
    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await waitForWidgetRendered(page);

    const widgetHost = page.locator(`[data-repwell-widget="${MOCK_WIDGET_ID}"]`);
    await expect(widgetHost).toHaveAttribute("data-repwell-initialized", /.+/);

    const reviewerName = await getShadowText(
      page,
      ".rw-review__name, .rw-lo-review__name"
    );
    expect(reviewerName).toContain("Reviewer");
  });

  test("shows skeleton loader initially", async ({ page }) => {
    let releaseConfig!: () => void;
    const configGate = new Promise<void>((resolve) => {
      releaseConfig = resolve;
    });

    await page.route(
      `**/api/v1/widgets/${MOCK_WIDGET_ID}/config`,
      async (route) => {
        await configGate;
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

    await page.waitForFunction((wid) => {
      const host = document.querySelector(`[data-repwell-widget="${wid}"]`);
      return !!host?.shadowRoot?.querySelector(
        ".rw-skeleton[aria-busy='true']"
      );
    }, MOCK_WIDGET_ID);

    releaseConfig();
    await waitForWidgetRendered(page);
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
    await waitForWidgetRendered(page);

    const errorText = await getShadowText(page, ".rw-error[role='alert']");
    expect(errorText).toContain("Internal Server Error");
  });

  test("sets minHeight during skeleton and clears it for compact widgets", async ({
    page,
  }) => {
    let releaseConfig!: () => void;
    const configGate = new Promise<void>((resolve) => {
      releaseConfig = resolve;
    });

    await page.route(
      `**/api/v1/widgets/${MOCK_WIDGET_ID}/config`,
      async (route) => {
        await configGate;
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
    await page.waitForFunction((wid) => {
      const host = document.querySelector<HTMLElement>(
        `[data-repwell-widget="${wid}"]`
      );
      return (
        host?.style.minHeight === "280px" &&
        !!host.shadowRoot?.querySelector(".rw-skeleton")
      );
    }, MOCK_WIDGET_ID);

    releaseConfig();
    await waitForWidgetRendered(page);

    const compactWidgetId = `${MOCK_WIDGET_ID}-compact`;
    await mockWidgetApiRoutes(
      page,
      compactWidgetId,
      {
        widget_type: "social_proof_banner",
        config: {
          ...mockWidgetConfig().config,
          socialProofBanner: {
            displayMode: "notification",
            placement: "bottom-right",
            trigger: "immediate",
            triggerValue: 0,
            frequency: "every_visit",
            dismissable: true,
            animation: "fade",
          },
        },
      },
      3
    );

    await loadEmbedPage(page, [{ id: compactWidgetId }]);
    await waitForWidgetState(page, compactWidgetId, [4]);

    const compactMinHeight = await page
      .locator(`[data-repwell-widget="${compactWidgetId}"]`)
      .evaluate((el) => (el as HTMLElement).style.minHeight);
    expect(compactMinHeight).toBe("");
  });

  test("Shadow DOM encapsulates styles", async ({ page }) => {
    await mockWidgetApiRoutes(page, MOCK_WIDGET_ID);
    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }], {
      extraHead:
        '<style>* { color: red !important; font-size: 72px !important; }</style>',
    });
    await waitForWidgetRendered(page);

    const widgetHost = page.locator(`[data-repwell-widget="${MOCK_WIDGET_ID}"]`);
    const shadowStyles = await widgetHost.evaluate((el) => {
      const firstEl = el.shadowRoot?.querySelector(
        ".rw-review__name, .rw-lo-review__name"
      );
      if (!firstEl) {
        throw new Error("Expected a rendered reviewer name in the shadow DOM");
      }
      const computed = getComputedStyle(firstEl!);
      return {
        color: computed.color,
        fontSize: computed.fontSize,
      };
    });

    expect(shadowStyles.color).not.toBe("rgb(255, 0, 0)");
    expect(shadowStyles.fontSize).not.toBe("72px");
  });
});
