/**
 * E2E tests for the video testimonial widget.
 * Verifies video rendering, transcript rendering, and play tracking.
 */

import {
  test,
  expect,
  loadEmbedPage,
  MOCK_WIDGET_ID,
  mockWidgetConfig,
  mockReviewsResponse,
  mockVideoTestimonials,
  waitForWidgetRendered,
  waitForWidgetEventRequest,
  getShadowText,
} from "./fixtures";

const VIDEO_CONFIG = {
  widget_type: "video_testimonial",
  config: {
    ...mockWidgetConfig().config,
    video: {
      transcriptPosition: "below",
      layout: "list",
    },
  },
  video_testimonials: mockVideoTestimonials(),
};

test.describe("Video Testimonial Widget", () => {
  test.beforeEach(async ({ page }) => {
    await page.route(
      `**/api/v1/widgets/${MOCK_WIDGET_ID}/config`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "*" },
          body: JSON.stringify(mockWidgetConfig(VIDEO_CONFIG)),
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
          body: JSON.stringify(mockReviewsResponse(0)),
        });
      }
    );
    await page.route(`**/api/v1/widgets/${MOCK_WIDGET_ID}/events`, async (route) => {
      await route.fulfill({ status: 204 });
    });
    await page.route("**/video1.mp4", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "video/mp4",
        body: Buffer.alloc(100),
      });
    });
    await page.route("**/poster1.jpg", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "image/jpeg",
        body: Buffer.alloc(100),
      });
    });
  });

  test("renders video testimonial widget", async ({ page }) => {
    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await waitForWidgetRendered(page);

    const hasVideoContent = await page
      .locator(`[data-repwell-widget="${MOCK_WIDGET_ID}"]`)
      .evaluate((el) => {
        const shadow = el.shadowRoot;
        return (
          !!shadow?.querySelector(".rw-vt__player-wrap[role='region']") &&
          !!shadow.querySelector(".rw-vt__play-btn[role='button']")
        );
      });

    expect(hasVideoContent).toBe(true);
  });

  test("shows reviewer name and rating", async ({ page }) => {
    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await waitForWidgetRendered(page);

    const reviewerName = await getShadowText(page, ".rw-vt__reviewer-name");
    const starCount = await page
      .locator(`[data-repwell-widget="${MOCK_WIDGET_ID}"]`)
      .evaluate(
        (el) => el.shadowRoot?.querySelectorAll(".rw-vt__stars .rw-star").length ?? 0
      );

    expect(reviewerName).toBe("Video Reviewer 1");
    expect(starCount).toBe(5);
  });

  test("renders transcript section", async ({ page }) => {
    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await waitForWidgetRendered(page);

    const transcript = await getShadowText(page, ".rw-vt__transcript");
    expect(transcript).toContain("amazing experience");
    expect(transcript).toContain("top notch");
  });

  test("video play triggers event tracking", async ({ page }) => {
    await page.addInitScript(() => {
      HTMLMediaElement.prototype.play = function play() {
        this.dispatchEvent(new Event("play"));
        return Promise.resolve();
      };
    });

    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await waitForWidgetRendered(page);

    const playRequest = waitForWidgetEventRequest(
      page,
      MOCK_WIDGET_ID,
      (event) => event.event_type === "video_play"
    );

    await page
      .locator(`[data-repwell-widget="${MOCK_WIDGET_ID}"]`)
      .evaluate((el) => {
        const playBtn = el.shadowRoot?.querySelector<HTMLElement>(
          ".rw-vt__play-btn[role='button']"
        );
        if (!playBtn) {
          throw new Error("Expected video play button to be rendered");
        }
        playBtn.click();
      });

    const playEvent = await playRequest;
    expect(playEvent.metadata?.video_id).toBe("video-1");
  });
});
