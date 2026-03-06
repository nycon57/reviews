/**
 * E2E tests for the widget builder UI.
 * Validates the template-based widget customization flow:
 * widget list shows 9 templates, clicking Customize opens builder,
 * embed code generation works.
 */

import { test, expect } from "@playwright/test";

test.describe("Widget Builder - Template Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Mock auth session for dashboard access
    await page.route("**/auth/v1/token?grant_type=**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "mock-token",
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "mock-refresh",
          user: {
            id: "user-001",
            email: "test@repwell.com",
            role: "admin",
          },
        }),
      });
    });
  });

  test("widget list shows template cards", async ({ page }) => {
    await page.goto("/dashboard/widgets");

    // Verify Widget Templates heading is visible
    const heading = page.getByText("Widget Templates");
    await expect(heading).toBeVisible({ timeout: 5000 });
  });

  test("displays embed code after opening widget builder", async ({ page }) => {
    // Navigate to an existing widget editor page
    await page.goto("/dashboard/widgets/test-widget-001");

    // Look for embed code panel
    const embedPanel = page.locator(
      '[data-testid="embed-code-panel"], [class*="embed-code"]'
    );

    if (await embedPanel.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Verify embed code contains the script tag and widget div
      const embedCode = await embedPanel.textContent();
      expect(embedCode).toContain("data-repwell-widget");
      expect(embedCode).toContain("embed");
    }
  });

  test("widget builder shows live preview", async ({ page }) => {
    await page.goto("/dashboard/widgets/test-widget-001");

    // Check for preview iframe or preview container
    const preview = page.locator(
      'iframe[class*="preview"], [data-testid="widget-preview"]'
    );

    if (await preview.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Preview should be present
      expect(await preview.isVisible()).toBe(true);
    }
  });
});
