import {
  test,
  expect,
  loadEmbedPage,
  MOCK_WIDGET_ID,
  mockWidgetConfig,
  mockReviewsResponse,
  waitForWidgetRendered,
} from "./fixtures";

const ENTITY_ONE = "123e4567-e89b-12d3-a456-426614174001";
const ENTITY_TWO = "123e4567-e89b-12d3-a456-426614174002";

test.describe("Dynamic Entity Overrides", () => {
  test("passes entity override params for each widget instance", async ({ page }) => {
    const configEntityIds: string[] = [];
    const reviewsEntityIds: string[] = [];

    await page.route(`**/api/v1/widgets/${MOCK_WIDGET_ID}/config**`, async (route) => {
      const url = new URL(route.request().url());
      configEntityIds.push(url.searchParams.get("entityId") ?? "");

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(mockWidgetConfig()),
      });
    });

    await page.route(`**/api/v1/widgets/${MOCK_WIDGET_ID}/reviews**`, async (route) => {
      const url = new URL(route.request().url());
      reviewsEntityIds.push(url.searchParams.get("entityId") ?? "");

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify(mockReviewsResponse()),
      });
    });

    await page.route(`**/api/v1/widgets/${MOCK_WIDGET_ID}/events`, async (route) => {
      await route.fulfill({ status: 204 });
    });

    await loadEmbedPage(page, [
      {
        id: MOCK_WIDGET_ID,
        extraAttrs: {
          "data-repwell-entity-type": "user",
          "data-repwell-entity-id": ENTITY_ONE,
        },
      },
      {
        id: MOCK_WIDGET_ID,
        extraAttrs: {
          "data-repwell-entity-type": "user",
          "data-repwell-entity-id": ENTITY_TWO,
        },
      },
    ]);

    await page.waitForFunction(
      ([widgetId, expectedCount]) => {
        const hosts = Array.from(
          document.querySelectorAll(`[data-repwell-widget="${widgetId}"]`)
        );
        return (
          hosts.length === expectedCount &&
          hosts.every(
            (host) =>
              host.hasAttribute("data-repwell-initialized") &&
              !!host.shadowRoot &&
              !host.shadowRoot.querySelector(".rw-skeleton")
          )
        );
      },
      [MOCK_WIDGET_ID, 2]
    );

    expect(configEntityIds).toEqual(expect.arrayContaining([ENTITY_ONE, ENTITY_TWO]));
    expect(reviewsEntityIds).toEqual(expect.arrayContaining([ENTITY_ONE, ENTITY_TWO]));
  });

  test("shows explicit override validation errors instead of generic fallback", async ({ page }) => {
    await page.route(`**/api/v1/widgets/${MOCK_WIDGET_ID}/config**`, async (route) => {
      await route.fulfill({
        status: 400,
        contentType: "application/json",
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({
          error: "Entity overrides are not supported for this widget type",
          code: "UNSUPPORTED_ENTITY_OVERRIDE",
        }),
      });
    });

    await loadEmbedPage(page, [
      {
        id: MOCK_WIDGET_ID,
        extraAttrs: {
          "data-repwell-entity-type": "user",
          "data-repwell-entity-id": ENTITY_ONE,
        },
      },
    ]);
    await waitForWidgetRendered(page);

    const widgetHost = page.locator(`[data-repwell-widget="${MOCK_WIDGET_ID}"]`);
    const shadowText = await widgetHost.evaluate((el) => el.shadowRoot?.textContent ?? "");

    expect(shadowText).toContain("Entity overrides are not supported for this widget type");
  });
});
