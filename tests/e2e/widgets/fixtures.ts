/**
 * Shared Playwright test fixtures for widget E2E tests.
 * Provides mock API responses, helper functions for serving embed pages,
 * and route interception utilities.
 */

import { test as base, type Page, type Route } from "@playwright/test";

// ── Mock Data ──────────────────────────────────────────────────────────

export const MOCK_WIDGET_ID = "test-widget-001";
export const MOCK_WIDGET_ID_2 = "test-widget-002";

export const WIDGET_TYPES = [
  "lo_review",
  "branch_review",
  "company_review",
  "review_carousel",
  "star_rating_badge",
  "video_testimonial",
  "review_wall",
  "nps_score_badge",
  "social_proof_banner",
] as const;

export function mockWidgetConfig(
  overrides: Record<string, unknown> = {}
) {
  return {
    widget_id: MOCK_WIDGET_ID,
    widget_type: "lo_review",
    entity_type: "user",
    entity_id: "user-001",
    name: "Test Widget",
    config: {
      theme: {
        preset: "clean_white",
        colors: { primary: "#2563eb" },
        typography: {},
        layout: { borderRadius: "8px", cardStyle: "elevated" },
      },
      content: {
        showHeader: true,
        headerText: "Customer Reviews",
        showCTA: false,
        showSource: true,
        showDate: true,
        showAvatar: true,
        showBranding: true,
      },
      filters: { minRating: 1, maxReviews: 10, sortOrder: "newest" },
    },
    enable_structured_data: false,
    structured_data_type: null,
    status: "active",
    version: 1,
    entity_profile: {
      full_name: "Jane Doe",
      avatar_url: null,
      photo_url: null,
      nmls_id: "123456",
      title: "Loan Officer",
      average_rating: 4.8,
      total_reviews: 42,
      licensing_states: ["CA", "TX"],
    },
    ab_test: null,
    ...overrides,
  };
}

export function mockReviewsResponse(count = 3) {
  const reviews = Array.from({ length: count }, (_, i) => ({
    id: `review-${i + 1}`,
    reviewer_name: `Reviewer ${i + 1}`,
    rating: 5 - (i % 2),
    text: `This is review number ${i + 1}. Great experience with professional service.`,
    review_date: new Date(Date.now() - i * 86400000).toISOString(),
    source: i % 2 === 0 ? "google" : "internal",
    avatar_url: null,
    loan_type: i % 2 === 0 ? "conventional" : "fha",
    first_time_homebuyer: i === 0,
  }));

  return {
    reviews,
    pagination: { next_cursor: null, limit: 10, has_more: false },
  };
}

export function mockVideoTestimonials() {
  return [
    {
      id: "video-1",
      video_url: "https://example.com/video1.mp4",
      poster_url: "https://example.com/poster1.jpg",
      reviewer_name: "Video Reviewer 1",
      reviewer_title: "Homeowner",
      rating: 5,
      duration: 120,
      transcript: [
        { start: 0, end: 5, text: "I had an amazing experience." },
        { start: 5, end: 10, text: "The service was top notch." },
      ],
    },
  ];
}

export function mockNpsData() {
  return {
    score: 72,
    totalResponses: 150,
    promoterPct: 80,
    passivePct: 12,
    detractorPct: 8,
  };
}

// ── Route Mocking ──────────────────────────────────────────────────────

export async function mockWidgetApiRoutes(
  page: Page,
  widgetId: string,
  configOverrides: Record<string, unknown> = {},
  reviewCount = 3
) {
  // Mock config endpoint
  await page.route(
    `**/api/v1/widgets/${widgetId}/config`,
    async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS",
        },
        body: JSON.stringify(
          mockWidgetConfig({ widget_id: widgetId, ...configOverrides })
        ),
      });
    }
  );

  // Mock reviews endpoint
  await page.route(
    `**/api/v1/widgets/${widgetId}/reviews**`,
    async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(mockReviewsResponse(reviewCount)),
      });
    }
  );

  // Mock events endpoint (fire-and-forget)
  await page.route(
    `**/api/v1/widgets/${widgetId}/events`,
    async (route: Route) => {
      await route.fulfill({ status: 204 });
    }
  );

  // Mock pixel endpoint
  await page.route(
    `**/api/v1/widgets/${widgetId}/pixel**`,
    async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: "image/gif",
        body: Buffer.from(
          "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
          "base64"
        ),
      });
    }
  );
}

// ── Embed Page Helper ──────────────────────────────────────────────────

/**
 * Build an HTML page that loads the embed script and contains widget divs.
 * Uses the built embed.js from public/embed/v1/.
 */
export function buildEmbedPageHTML(
  widgets: Array<{ id: string; extraAttrs?: Record<string, string> }>,
  options: { apiBase?: string; extraHead?: string; extraBody?: string } = {}
) {
  const apiBase = options.apiBase ?? "";
  const widgetDivs = widgets
    .map((w) => {
      const attrs = Object.entries(w.extraAttrs ?? {})
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ");
      return `<div data-repwell-widget="${w.id}" ${attrs}></div>`;
    })
    .join("\n    ");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Widget Test Page</title>
  ${options.extraHead ?? ""}
</head>
<body>
  <h1>Test Page</h1>
  <div id="content">
    ${widgetDivs}
  </div>
  ${options.extraBody ?? ""}
  <script src="/embed/v1/embed.js" data-api-base="${apiBase}"></script>
</body>
</html>`;
}

/**
 * Navigate to a page serving an inline embed HTML document.
 * Uses page.setContent or page.route to serve the HTML.
 */
export async function loadEmbedPage(
  page: Page,
  widgets: Array<{ id: string; extraAttrs?: Record<string, string> }>,
  options: { apiBase?: string; extraHead?: string; extraBody?: string } = {}
) {
  const html = buildEmbedPageHTML(widgets, options);

  // Serve the HTML at a test path
  await page.route("**/test-embed", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "text/html",
      body: html,
    });
  });

  await page.goto("/test-embed");
}

// ── Extended Test Fixture ──────────────────────────────────────────────

type WidgetFixtures = {
  embedPage: (
    widgets: Array<{ id: string; extraAttrs?: Record<string, string> }>,
    configOverrides?: Record<string, unknown>,
    reviewCount?: number
  ) => Promise<void>;
};

export const test = base.extend<WidgetFixtures>({
  embedPage: async ({ page }, use) => {
    const fn = async (
      widgets: Array<{ id: string; extraAttrs?: Record<string, string> }>,
      configOverrides: Record<string, unknown> = {},
      reviewCount = 3
    ) => {
      for (const w of widgets) {
        await mockWidgetApiRoutes(page, w.id, configOverrides, reviewCount);
      }
      await loadEmbedPage(page, widgets);
    };
    await use(fn);
  },
});

export { expect } from "@playwright/test";
