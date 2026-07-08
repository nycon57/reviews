/**
 * E2E tests for the social proof banner widget.
 * Verifies trigger conditions, dismiss persistence, and display modes.
 */

import {
  test,
  expect,
  loadEmbedPage,
  MOCK_WIDGET_ID,
  mockWidgetConfig,
  mockReviewsResponse,
  waitForWidgetState,
  waitForSocialProofBanner,
} from "./fixtures";

function setupBannerMocks(
  triggerType: "immediate" | "scroll" | "time" | "exit_intent",
  triggerValue = 0,
  overrides: Record<string, unknown> = {}
) {
  return mockWidgetConfig({
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
        ...overrides,
      },
    },
  });
}

async function routeBannerApi(
  page: import("@playwright/test").Page,
  config: ReturnType<typeof mockWidgetConfig>
) {
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
}

async function getBannerText(
  page: import("@playwright/test").Page,
  selector: string
) {
  return page.evaluate(
    ({ widgetId, innerSelector }) => {
      const host = document.querySelector(`[data-repwell-banner="${widgetId}"]`);
      return (
        host?.shadowRoot?.querySelector(innerSelector)?.textContent?.trim() ?? ""
      );
    },
    { widgetId: MOCK_WIDGET_ID, innerSelector: selector }
  );
}

async function isBannerVisible(page: import("@playwright/test").Page) {
  return page.evaluate((widgetId) => {
    const host = document.querySelector(`[data-repwell-banner="${widgetId}"]`);
    const banner = host?.shadowRoot?.querySelector(".rw-spb");
    return banner?.classList.contains("rw-spb--visible") ?? false;
  }, MOCK_WIDGET_ID);
}

test.describe("Social Proof Banner Widget", () => {
  test("renders immediately when trigger is 'immediate'", async ({
    page,
  }) => {
    await routeBannerApi(page, setupBannerMocks("immediate"));

    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await waitForWidgetState(page, MOCK_WIDGET_ID, [4]);
    await waitForSocialProofBanner(page);

    const reviewerName = await getBannerText(
      page,
      ".rw-spb-notification__name"
    );
    expect(reviewerName).toContain("Reviewer");
  });

  test("renders after scroll threshold when trigger is 'scroll'", async ({
    page,
  }) => {
    await routeBannerApi(page, setupBannerMocks("scroll", 20));

    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }], {
      extraBody: '<div style="height: 3000px;">Spacer for scroll</div>',
    });
    await waitForWidgetState(page, MOCK_WIDGET_ID, [4]);
    await waitForSocialProofBanner(page, MOCK_WIDGET_ID, { visible: false });

    await page.evaluate(() => window.scrollTo(0, 1200));
    await waitForSocialProofBanner(page);
  });

  test("renders after time delay when trigger is 'time'", async ({
    page,
  }) => {
    await routeBannerApi(page, setupBannerMocks("time", 500));

    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await waitForWidgetState(page, MOCK_WIDGET_ID, [4]);
    await waitForSocialProofBanner(page, MOCK_WIDGET_ID, { visible: false });

    await waitForSocialProofBanner(page);
  });

  test("dismiss button hides the banner", async ({ page }) => {
    await routeBannerApi(page, setupBannerMocks("immediate"));

    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await waitForWidgetState(page, MOCK_WIDGET_ID, [4]);
    await waitForSocialProofBanner(page);

    await page.evaluate((widgetId) => {
      const host = document.querySelector(`[data-repwell-banner="${widgetId}"]`);
      const closeBtn =
        host?.shadowRoot?.querySelector<HTMLButtonElement>(".rw-spb-close");
      if (!closeBtn) {
        throw new Error("Expected social proof dismiss button to be rendered");
      }
      closeBtn.click();
    }, MOCK_WIDGET_ID);

    await expect
      .poll(() => isBannerVisible(page), { timeout: 2_000 })
      .toBe(false);
  });

  test("renders on exit-intent when trigger is 'exit_intent'", async ({
    page,
  }) => {
    await routeBannerApi(page, setupBannerMocks("exit_intent"));

    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await waitForWidgetState(page, MOCK_WIDGET_ID, [4]);
    await waitForSocialProofBanner(page, MOCK_WIDGET_ID, { visible: false });

    await page.evaluate(() => {
      document.documentElement.dispatchEvent(
        new MouseEvent("mouseleave", { clientY: 0, bubbles: true })
      );
    });
    await waitForSocialProofBanner(page);
  });

  test("dismissed state persists across page loads", async ({ page }) => {
    await routeBannerApi(
      page,
      setupBannerMocks("immediate", 0, { frequency: "once_per_session" })
    );

    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await waitForWidgetState(page, MOCK_WIDGET_ID, [4]);
    await waitForSocialProofBanner(page);

    await page.evaluate((widgetId) => {
      const host = document.querySelector(`[data-repwell-banner="${widgetId}"]`);
      const closeBtn =
        host?.shadowRoot?.querySelector<HTMLButtonElement>(".rw-spb-close");
      if (!closeBtn) {
        throw new Error("Expected social proof dismiss button to be rendered");
      }
      closeBtn.click();
    }, MOCK_WIDGET_ID);

    await expect
      .poll(async () => {
        return page.evaluate((widgetId) => {
          return (
            localStorage.getItem(`rw_spb_${widgetId}`) !== null ||
            sessionStorage.getItem(`rw_spb_${widgetId}`) !== null
          );
        }, MOCK_WIDGET_ID);
      })
      .toBe(true);

    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await waitForWidgetState(page, MOCK_WIDGET_ID, [4]);

    await expect
      .poll(() => isBannerVisible(page), { timeout: 2_000 })
      .toBe(false);
  });
});
