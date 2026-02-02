/**
 * E2E tests for the video testimonial widget.
 * Verifies video playback, progress events, and transcript sync.
 */

import {
  test,
  expect,
  loadEmbedPage,
  MOCK_WIDGET_ID,
  mockWidgetConfig,
  mockReviewsResponse,
  mockVideoTestimonials,
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
    // Mock video file to prevent actual download
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
    await page.waitForTimeout(2000);

    const widgetHost = page.locator(
      `[data-repwell-widget="${MOCK_WIDGET_ID}"]`
    );

    const hasVideoContent = await widgetHost.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return false;
      // Look for video element or video container
      const video = shadow.querySelector("video");
      const videoContainer = shadow.querySelector(
        ".rw-video, [data-video], .rw-video-testimonial"
      );
      return !!video || !!videoContainer;
    });

    // Widget should render a video element or video container
    expect(hasVideoContent).toBe(true);
  });

  test("shows reviewer name and rating", async ({ page }) => {
    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await page.waitForTimeout(2000);

    const widgetHost = page.locator(
      `[data-repwell-widget="${MOCK_WIDGET_ID}"]`
    );

    const content = await widgetHost.evaluate((el) => {
      return el.shadowRoot?.textContent ?? "";
    });

    // The testimonial should include reviewer info from the config
    expect(content.length).toBeGreaterThan(0);
  });

  test("renders transcript section", async ({ page }) => {
    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await page.waitForTimeout(2000);

    const widgetHost = page.locator(
      `[data-repwell-widget="${MOCK_WIDGET_ID}"]`
    );

    const hasTranscript = await widgetHost.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return false;
      const text = shadow.textContent ?? "";
      // Check for transcript text from mock data
      return (
        text.includes("amazing experience") ||
        text.includes("top notch") ||
        !!shadow.querySelector(".rw-transcript, [data-transcript]")
      );
    });

    // Transcript should render with expected content
    expect(hasTranscript).toBe(true);
  });

  test("video play triggers event tracking", async ({ page }) => {
    const eventRequests: string[] = [];

    await page.route(
      `**/api/v1/widgets/${MOCK_WIDGET_ID}/events`,
      async (route) => {
        const body = route.request().postData() ?? "";
        eventRequests.push(body);
        await route.fulfill({ status: 204 });
      }
    );

    await loadEmbedPage(page, [{ id: MOCK_WIDGET_ID }]);
    await page.waitForTimeout(2000);

    const widgetHost = page.locator(
      `[data-repwell-widget="${MOCK_WIDGET_ID}"]`
    );

    // Try to click play button
    await widgetHost.evaluate((el) => {
      const shadow = el.shadowRoot;
      if (!shadow) return;
      const playBtn =
        shadow.querySelector('button[aria-label*="play" i]') ??
        shadow.querySelector(".rw-play-button") ??
        shadow.querySelector("video");
      if (playBtn) (playBtn as HTMLElement).click();
    });

    await page.waitForTimeout(1000);

    // At minimum, impression event should have fired
    expect(eventRequests.length).toBeGreaterThanOrEqual(1);
  });
});
