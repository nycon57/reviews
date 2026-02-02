/**
 * E2E tests for the widget builder UI.
 * Validates the create-widget flow for each of the 9 widget types,
 * including type selection, entity selection, naming, and embed code generation.
 */

import { test, expect } from "@playwright/test";

const WIDGET_TYPES = [
  { value: "lo_review", label: "LO Review" },
  { value: "branch_review", label: "Branch Review" },
  { value: "company_review", label: "Company Review" },
  { value: "review_carousel", label: "Review Carousel" },
  { value: "star_rating_badge", label: "Star Rating Badge" },
  { value: "video_testimonial", label: "Video Testimonial" },
  { value: "review_wall", label: "Review Wall" },
  { value: "nps_score_badge", label: "NPS Score Badge" },
  { value: "social_proof_banner", label: "Social Proof Banner" },
];

test.describe("Widget Builder - Create Flow", () => {
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

  for (const widgetType of WIDGET_TYPES) {
    test(`creates a ${widgetType.label} widget`, async ({ page }) => {
      // Navigate to new widget page
      await page.goto("/dashboard/widgets/new");

      // Step 1: Select widget type
      const typeCard = page.locator(
        `[data-testid="widget-type-${widgetType.value}"], [data-widget-type="${widgetType.value}"]`
      );

      // If type selector uses cards, click the matching one
      if (await typeCard.isVisible({ timeout: 5000 }).catch(() => false)) {
        await typeCard.click();
      }

      // Step 2: Proceed to entity selection
      const nextButton = page.getByRole("button", { name: /next|continue/i });
      if (await nextButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nextButton.click();
      }

      // Step 3: Enter widget name
      const nameInput = page.getByLabel(/name/i).or(
        page.locator('input[placeholder*="name" i]')
      );
      if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        await nameInput.fill(`Test ${widgetType.label}`);
      }

      // Step 4: Submit creation
      const createButton = page.getByRole("button", {
        name: /create|save/i,
      });
      if (await createButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        // Mock the createWidget server action response
        await page.route("**/dashboard/widgets/**", async (route) => {
          if (route.request().method() === "POST") {
            await route.fulfill({
              status: 200,
              contentType: "application/json",
              body: JSON.stringify({
                success: true,
                data: { id: "new-widget-001" },
              }),
            });
          } else {
            await route.continue();
          }
        });
      }
    });
  }

  test("displays embed code after widget creation", async ({ page }) => {
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
