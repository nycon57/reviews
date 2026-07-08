/**
 * E2E tests for the review carousel widget.
 * Verifies auto-play, navigation controls, and transition state.
 */

import {
  test,
  expect,
  loadEmbedPage,
  MOCK_WIDGET_ID,
  mockWidgetConfig,
  mockReviewsResponse,
  waitForWidgetRendered,
} from "./fixtures";

const CAROUSEL_CONFIG = {
  widget_type: "review_carousel",
  config: {
    ...mockWidgetConfig().config,
    carousel: {
      autoplay: true,
      interval: 500,
      showArrows: true,
      showDots: true,
      slidesPerView: 1,
      transition: "slide",
      visibleCards: 1,
    },
  },
};

async function getActiveDotIndex(page: import("@playwright/test").Page) {
  return page
    .locator(`[data-repwell-widget="${MOCK_WIDGET_ID}"]`)
    .evaluate((el) => {
      const shadow = el.shadowRoot;
      const dots = Array.from(
        shadow?.querySelectorAll(".rw-carousel__dot") ?? []
      );
      const activeDot = shadow?.querySelector(
        ".rw-carousel__dot--active[aria-selected='true']"
      );
      return activeDot ? dots.indexOf(activeDot) : -1;
    });
}

test.describe("Review Carousel Widget", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(
      `**/api/v1/widgets/${MOCK_WIDGET_ID}/config`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify(mockWidgetConfig(CAROUSEL_CONFIG)),
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
          body: JSON.stringify(mockReviewsResponse(5)),
        });
      }
    );
    await page.route(`**/api/v1/widgets/${MOCK_WIDGET_ID}/events`, async (route) => {
      await route.fulfill({ status: 204 });
    });
  });

  test("renders carousel with navigation arrows", async ({ page }) => {
    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await waitForWidgetRendered(page);

    const arrowCount = await page
      .locator(`[data-repwell-widget="${MOCK_WIDGET_ID}"]`)
      .evaluate(
        (el) =>
          el.shadowRoot?.querySelectorAll(
            ".rw-carousel__arrow--prev, .rw-carousel__arrow--next"
          ).length ?? 0
      );

    expect(arrowCount).toBe(2);
  });

  test("renders carousel with dots/indicators", async ({ page }) => {
    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await waitForWidgetRendered(page);

    const dotCount = await page
      .locator(`[data-repwell-widget="${MOCK_WIDGET_ID}"]`)
      .evaluate(
        (el) => el.shadowRoot?.querySelectorAll(".rw-carousel__dot").length ?? 0
      );

    expect(dotCount).toBeGreaterThan(1);
    expect(await getActiveDotIndex(page)).toBe(0);
  });

  test("auto-play advances slides", async ({ page }) => {
    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await waitForWidgetRendered(page);

    expect(await getActiveDotIndex(page)).toBe(0);
    await expect
      .poll(() => getActiveDotIndex(page), {
        intervals: [100, 250, 500],
        timeout: 4_000,
      })
      .not.toBe(0);
  });

  test("clicking navigation arrow changes slide", async ({ page }) => {
    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await waitForWidgetRendered(page);

    const nextIndex = await page
      .locator(`[data-repwell-widget="${MOCK_WIDGET_ID}"]`)
      .evaluate((el) => {
        const nextBtn = el.shadowRoot?.querySelector<HTMLButtonElement>(
          ".rw-carousel__arrow--next"
        );
        if (!nextBtn) {
          throw new Error("Expected carousel next arrow to be rendered");
        }
        nextBtn.click();
        const dots = Array.from(
          el.shadowRoot?.querySelectorAll(".rw-carousel__dot") ?? []
        );
        const activeDot = el.shadowRoot?.querySelector(
          ".rw-carousel__dot--active[aria-selected='true']"
        );
        return activeDot ? dots.indexOf(activeDot) : -1;
      });

    expect(nextIndex).toBe(1);
  });
});
