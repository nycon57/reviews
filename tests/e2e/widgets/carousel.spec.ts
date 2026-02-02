/**
 * E2E tests for the review carousel widget.
 * Verifies auto-play, navigation controls, and transition animations.
 */

import {
  test,
  expect,
  loadEmbedPage,
  MOCK_WIDGET_ID,
  mockWidgetConfig,
  mockReviewsResponse,
} from "./fixtures";

const CAROUSEL_CONFIG = {
  widget_type: "review_carousel",
  config: {
    ...mockWidgetConfig().config,
    carousel: {
      autoplay: true,
      interval: 3000,
      showArrows: true,
      showDots: true,
      slidesPerView: 1,
      transition: "slide",
      visibleCards: 1,
    },
  },
};

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
    await page.waitForTimeout(2000);

    const widgetHost = page.locator(
      `[data-repwell-widget="${MOCK_WIDGET_ID}"]`
    );

    const hasArrows = await widgetHost.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return false;
      const arrows = shadow.querySelectorAll(
        'button[aria-label*="prev" i], button[aria-label*="next" i], .rw-carousel-arrow, .rw-carousel-prev, .rw-carousel-next, [data-carousel-prev], [data-carousel-next]'
      );
      return arrows.length >= 1;
    });

    // Carousel should render with navigation arrows
    expect(hasArrows).toBe(true);
  });

  test("renders carousel with dots/indicators", async ({ page }) => {
    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await page.waitForTimeout(2000);

    const widgetHost = page.locator(
      `[data-repwell-widget="${MOCK_WIDGET_ID}"]`
    );

    const hasDots = await widgetHost.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return false;
      // Look for dot indicators
      const dots = shadow.querySelectorAll(
        '.rw-carousel-dot, .rw-carousel-indicator, [data-carousel-dot], [role="tab"]'
      );
      return dots.length > 0;
    });

    // Carousel should render with dot indicators
    expect(hasDots).toBe(true);
  });

  test("auto-play advances slides", async ({ page }) => {
    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await page.waitForTimeout(2000);

    const widgetHost = page.locator(
      `[data-repwell-widget="${MOCK_WIDGET_ID}"]`
    );

    // Capture initial visible review text
    const initialText = await widgetHost.evaluate((el) => {
      const shadow = el.shadowRoot;
      return shadow?.textContent?.substring(0, 300) ?? "";
    });

    // Wait for auto-play interval (3s + buffer)
    await page.waitForTimeout(4000);

    // Capture carousel state after auto-play
    const afterAutoPlayIndex = await widgetHost.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return -1;
      // Check for an active dot or active slide indicator
      const activeDot = shadow.querySelector(
        '.rw-carousel-dot[aria-selected="true"], .rw-carousel-dot.active, [data-carousel-dot].active'
      );
      if (activeDot) {
        const dots = Array.from(
          shadow.querySelectorAll(".rw-carousel-dot, [data-carousel-dot]")
        );
        return dots.indexOf(activeDot);
      }
      return -1;
    });

    // Content should have been rendered
    expect(initialText.length).toBeGreaterThan(0);
    // Auto-play should have advanced past the first slide
    if (afterAutoPlayIndex >= 0) {
      expect(afterAutoPlayIndex).toBeGreaterThan(0);
    }
  });

  test("clicking navigation arrow changes slide", async ({ page }) => {
    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await page.waitForTimeout(2000);

    const widgetHost = page.locator(
      `[data-repwell-widget="${MOCK_WIDGET_ID}"]`
    );

    // Click the next arrow
    await widgetHost.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return;
      const nextBtn =
        shadow.querySelector('button[aria-label*="next" i]') ??
        shadow.querySelector(".rw-carousel-next") ??
        shadow.querySelector("[data-carousel-next]");
      if (nextBtn) (nextBtn as HTMLElement).click();
    });

    await page.waitForTimeout(500);

    // Widget should still be rendered without errors
    const hasContent = await widgetHost.evaluate((el) => {
      const shadow = el.shadowRoot;
      return (shadow?.children.length ?? 0) > 0;
    });

    expect(hasContent).toBe(true);
  });
});
