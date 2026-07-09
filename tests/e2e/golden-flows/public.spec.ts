import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { test, expect, type Page, type Route } from "@playwright/test";
import { GOLDEN_IDS } from "../helpers/golden-data";

const WIDGET_ID = "golden-widget-001";
const NEEDS_DESIGN_AXE_RULES = [
  "aria-prohibited-attr",
  "button-name",
  "color-contrast",
];

test.setTimeout(60_000);

async function mockWidgetRoutes(page: Page) {
  await page.route(`**/api/v1/widgets/${WIDGET_ID}/config`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        widget_id: WIDGET_ID,
        widget_type: "lo_review",
        entity_type: "user",
        entity_id: GOLDEN_IDS.userPro,
        name: "Golden Widget",
        status: "active",
        version: 1,
        enable_structured_data: false,
        config: {
          theme: {
            preset: "clean_white",
            colors: { primary: "#256f6c" },
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
        entity_profile: {
          full_name: "Golden Pro Advisor",
          avatar_url: null,
          photo_url: null,
          nmls_id: "GOLDEN123",
          title: "Senior Mortgage Advisor",
          average_rating: 5,
          total_reviews: 1,
          licensing_states: ["NY"],
        },
        ab_test: null,
      }),
    });
  });

  await page.route(`**/api/v1/widgets/${WIDGET_ID}/reviews**`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        reviews: [
          {
            id: "golden-review-1",
            reviewer_name: "Avery Golden",
            rating: 5,
            text: GOLDEN_IDS.publicReviewText,
            review_date: new Date().toISOString(),
            source: "internal",
            avatar_url: null,
          },
        ],
        pagination: { next_cursor: null, limit: 10, has_more: false },
      }),
    });
  });

  await page.route(`**/api/v1/widgets/${WIDGET_ID}/events`, async (route: Route) => {
    await route.fulfill({ status: 204 });
  });

  await page.route(`**/api/v1/widgets/${WIDGET_ID}/pixel**`, async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "image/gif",
      body: Buffer.from(
        "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
        "base64"
      ),
    });
  });
}

async function loadGoldenEmbedPage(page: Page) {
  const v1Path = join(process.cwd(), "public/embed/v1/embed.js");
  const fallbackPath = join(process.cwd(), "public/embed.js");
  const embedScript = readFileSync(existsSync(v1Path) ? v1Path : fallbackPath, "utf8");
  const html = `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Golden Widget Fixture</title>
      </head>
      <body>
        <main>
          <h1>Golden Widget Fixture</h1>
          <div data-repwell-widget="${WIDGET_ID}"></div>
        </main>
        <script src="/embed/v1/embed.js"></script>
      </body>
    </html>`;

  await page.route("**/embed/v1/embed.js", async (route: Route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/javascript",
      body: embedScript,
    });
  });
  await page.route("**/golden-widget-fixture", async (route: Route) => {
    await route.fulfill({ status: 200, contentType: "text/html", body: html });
  });
  await page.goto("/golden-widget-fixture");
}

async function waitForGoldenWidget(page: Page) {
  await page.waitForFunction(
    ({ widgetId }) => {
      const host = document.querySelector(`[data-repwell-widget="${widgetId}"]`);
      if (!host?.hasAttribute("data-repwell-initialized")) return false;
      const shadow = host.shadowRoot;
      if (!shadow) return false;
      return !shadow.querySelector(".rw-skeleton") && !!shadow.textContent?.includes("Avery Golden");
    },
    { widgetId: WIDGET_ID },
    { timeout: 10_000 }
  );
}

async function shadowText(page: Page) {
  return page.evaluate((widgetId) => {
    const host = document.querySelector(`[data-repwell-widget="${widgetId}"]`);
    return host?.shadowRoot?.textContent ?? "";
  }, WIDGET_ID);
}

async function expectNoSeriousAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .include("main")
    .disableRules(NEEDS_DESIGN_AXE_RULES)
    .analyze();
  const actionable = results.violations.filter((violation) =>
    ["serious", "critical"].includes(violation.impact ?? "")
  );
  expect(actionable).toEqual([]);
}

test("public profile, smart link, embed widget, and serious/critical axe coverage render", async ({
  page,
}) => {
  await page.goto(`/pro/${GOLDEN_IDS.publicProfileSlug}`);
  await expect(page.getByRole("heading", { name: "Golden Pro Advisor" })).toBeVisible();
  await expect(page.getByText(GOLDEN_IDS.publicReviewText).first()).toBeVisible();
  await expect(page.getByText("Office Location")).toBeVisible();
  await expect(page.getByLabel(/explore map for/i)).toBeVisible();
  await expectNoSeriousAxeViolations(page);

  await page.goto(`/s/${GOLDEN_IDS.smartLinkSlug}`);
  await expect(page.getByRole("heading", { name: "Golden Pro Advisor" })).toBeVisible();
  await expect(page.getByText("Avery Golden")).toBeVisible();
  await expect(page.getByText(GOLDEN_IDS.smartLinkQuote)).toBeVisible();

  await mockWidgetRoutes(page);
  await loadGoldenEmbedPage(page);
  await waitForGoldenWidget(page);
  const renderedWidgetText = await shadowText(page);
  expect(renderedWidgetText).toContain("Golden Pro Advisor");
  expect(renderedWidgetText).toContain("Avery Golden");

  await page.goto("/directory");
  await expect(page.getByText("Professional Directory", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Find a Professional" })).toBeVisible();
  await expectNoSeriousAxeViolations(page);
});
