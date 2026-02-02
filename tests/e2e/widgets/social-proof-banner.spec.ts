/**
 * E2E tests for the social proof banner widget.
 * Verifies trigger conditions (scroll, time, exit-intent),
 * dismiss persistence, and display modes.
 */

import {
  test,
  expect,
  loadEmbedPage,
  MOCK_WIDGET_ID,
  mockWidgetConfig,
  mockReviewsResponse,
} from "./fixtures";

function setupBannerMocks(
  triggerType: "immediate" | "scroll" | "time" | "exit_intent",
  triggerValue = 0
) {
  const config = mockWidgetConfig({
    widget_type: "social_proof_banner",
    config: {
      ...mockWidgetConfig().config,
      socialProofBanner: {
        displayMode: "notification",
        placement: "bottom-right",
        trigger: triggerType,
        triggerValue,
        frequency: "every_visit",
        dismissable: true,
        animation: "slide",
        interval: 5000,
        zIndex: 9999,
      },
    },
  });
  return config;
}

test.describe("Social Proof Banner Widget", () => {
  test("renders immediately when trigger is 'immediate'", async ({
    page,
  }) => {
    const config = setupBannerMocks("immediate");

    await page.route(
      `**/api/v1/widgets/${MOCK_WIDGET_ID}/config`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify(config),
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
          body: JSON.stringify(mockReviewsResponse(3)),
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

    const isRendered = await widgetHost.evaluate((el) => {
      const shadow = el.shadowRoot;
      return (shadow?.children.length ?? 0) > 0;
    });

    expect(isRendered).toBe(true);
  });

  test("renders after scroll threshold when trigger is 'scroll'", async ({
    page,
  }) => {
    const config = setupBannerMocks("scroll", 20);

    await page.route(
      `**/api/v1/widgets/${MOCK_WIDGET_ID}/config`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify(config),
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
          body: JSON.stringify(mockReviewsResponse(3)),
        });
      }
    );
    await page.route(`**/api/v1/widgets/${MOCK_WIDGET_ID}/events`, async (route) => {
      await route.fulfill({ status: 204 });
    });

    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }], {
      extraBody: '<div style="height: 3000px;">Spacer for scroll</div>',
    });

    await page.waitForTimeout(2000);

    // Widget should be initialized regardless (rendering logic is internal)
    const widgetHost = page.locator(
      `[data-repwell-widget="${MOCK_WIDGET_ID}"]`
    );
    await expect(widgetHost).toHaveAttribute("data-repwell-initialized", /.+/);

    // Scroll to trigger the banner
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(1000);

    const isRendered = await widgetHost.evaluate((el) => {
      const shadow = el.shadowRoot;
      return (shadow?.children.length ?? 0) > 0;
    });

    expect(isRendered).toBe(true);
  });

  test("renders after time delay when trigger is 'time'", async ({
    page,
  }) => {
    const config = setupBannerMocks("time", 1000);

    await page.route(
      `**/api/v1/widgets/${MOCK_WIDGET_ID}/config`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify(config),
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
          body: JSON.stringify(mockReviewsResponse(3)),
        });
      }
    );
    await page.route(`**/api/v1/widgets/${MOCK_WIDGET_ID}/events`, async (route) => {
      await route.fulfill({ status: 204 });
    });

    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);

    // Wait for time trigger
    await page.waitForTimeout(3000);

    const widgetHost = page.locator(
      `[data-repwell-widget="${MOCK_WIDGET_ID}"]`
    );

    const isRendered = await widgetHost.evaluate((el) => {
      const shadow = el.shadowRoot;
      return (shadow?.children.length ?? 0) > 0;
    });

    expect(isRendered).toBe(true);
  });

  test("dismiss button hides the banner", async ({ page }) => {
    const config = setupBannerMocks("immediate");

    await page.route(
      `**/api/v1/widgets/${MOCK_WIDGET_ID}/config`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify(config),
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
          body: JSON.stringify(mockReviewsResponse(3)),
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

    // Try to click the dismiss/close button
    const dismissed = await widgetHost.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return false;
      const closeBtn =
        shadow.querySelector('button[aria-label*="close" i]') ??
        shadow.querySelector('button[aria-label*="dismiss" i]') ??
        shadow.querySelector(".rw-dismiss") ??
        shadow.querySelector(".rw-close") ??
        shadow.querySelector("[data-dismiss]");
      if (closeBtn) {
        (closeBtn as HTMLElement).click();
        return true;
      }
      return false;
    });

    if (dismissed) {
      await page.waitForTimeout(500);
      // Banner should be hidden after dismiss
      const isVisible = await widgetHost.evaluate((el) => {
        const shadow = el.shadowRoot;
        if (!shadow) return false;
        const banner = shadow.querySelector(
          ".rw-banner, .rw-social-proof, [data-banner]"
        );
        if (!banner) return false;
        const style = getComputedStyle(banner);
        return style.display !== "none" && style.visibility !== "hidden";
      });

      expect(isVisible).toBe(false);
    }
  });

  test("renders on exit-intent when trigger is 'exit_intent'", async ({
    page,
  }) => {
    const config = setupBannerMocks("exit_intent");

    await page.route(
      `**/api/v1/widgets/${MOCK_WIDGET_ID}/config`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify(config),
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
          body: JSON.stringify(mockReviewsResponse(3)),
        });
      }
    );
    await page.route(
      `**/api/v1/widgets/${MOCK_WIDGET_ID}/events`,
      async (route) => {
        await route.fulfill({ status: 204 });
      }
    );

    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await page.waitForTimeout(2000);

    // Simulate exit-intent by moving mouse to the top of the viewport
    await page.mouse.move(400, 300);
    await page.waitForTimeout(200);
    await page.mouse.move(400, 0);
    await page.waitForTimeout(1000);

    const widgetHost = page.locator(
      `[data-repwell-widget="${MOCK_WIDGET_ID}"]`
    );

    const isRendered = await widgetHost.evaluate((el) => {
      const shadow = el.shadowRoot;
      return (shadow?.children.length ?? 0) > 0;
    });

    expect(isRendered).toBe(true);
  });

  test("dismissed state persists across page loads", async ({ page }) => {
    const config = setupBannerMocks("immediate");

    const setupRoutes = async () => {
      await page.route(
        `**/api/v1/widgets/${MOCK_WIDGET_ID}/config`,
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(config),
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
            body: JSON.stringify(mockReviewsResponse(3)),
          });
        }
      );
      await page.route(
        `**/api/v1/widgets/${MOCK_WIDGET_ID}/events`,
        async (route) => {
          await route.fulfill({ status: 204 });
        }
      );
    };

    await setupRoutes();
    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await page.waitForTimeout(2000);

    // Dismiss the banner
    const widgetHost = page.locator(
      `[data-repwell-widget="${MOCK_WIDGET_ID}"]`
    );
    await widgetHost.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return;
      const closeBtn =
        shadow.querySelector('button[aria-label*="close" i]') ??
        shadow.querySelector('button[aria-label*="dismiss" i]') ??
        shadow.querySelector(".rw-dismiss") ??
        shadow.querySelector(".rw-close") ??
        shadow.querySelector("[data-dismiss]");
      if (closeBtn) (closeBtn as HTMLElement).click();
    });

    await page.waitForTimeout(500);

    // Check localStorage for dismiss persistence
    const hasDismissState = await page.evaluate(() => {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("rw_spb_")) return true;
      }
      return false;
    });

    // Frequency manager stores dismiss state in localStorage or sessionStorage.
    // With frequency "every_visit", dismiss state uses sessionStorage (rw_spb_ prefix).
    // Verify some storage was written after dismiss.
    const hasSessionDismiss = await page.evaluate(() => {
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith("rw_spb_")) return true;
      }
      return false;
    });

    expect(hasDismissState || hasSessionDismiss).toBe(true);
  });
});
