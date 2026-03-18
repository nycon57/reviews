/**
 * Interaction tests for Social Graphics dashboard pages.
 */

import { test, expect } from "../helpers/dashboard-fixture";

test.use({ storageState: ".auth/enterprise-admin.json" });

test.describe("Social Graphics — browse page", () => {
  test("graphics page loads with cards", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/social-graphics");

    // Should display graphic cards
    const cards = page.locator("[data-testid*='graphic-card'], [class*='card']").first();
    await expect(cards).toBeVisible({ timeout: 10_000 });
  });

  test("generate dropdown opens with 3 options", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/social-graphics");

    // Open the Generate dropdown
    const generateTrigger = page.getByRole("button", { name: /generate/i });
    await generateTrigger.click();

    // Verify all 3 options are visible
    await expect(
      page.getByRole("menuitem", { name: /from single review/i }).or(page.getByText(/from single review/i))
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: /batch from reviews/i }).or(page.getByText(/batch from reviews/i))
    ).toBeVisible();
    await expect(
      page.getByRole("menuitem", { name: /review of the week/i }).or(page.getByText(/review of the week/i))
    ).toBeVisible();
  });

  test("browse templates toggle switches view", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/social-graphics");

    // Find the toggle between Browse Templates and View Graphics
    const browseTemplatesBtn = page
      .getByRole("button", { name: /browse templates/i })
      .or(page.getByRole("tab", { name: /browse templates/i }));
    const viewGraphicsBtn = page
      .getByRole("button", { name: /view graphics/i })
      .or(page.getByRole("tab", { name: /view graphics/i }));

    // Switch to Browse Templates
    await browseTemplatesBtn.click();
    const browseAriaSelected = await browseTemplatesBtn.getAttribute("aria-selected").catch(() => null);
    const browseDataState = await browseTemplatesBtn.getAttribute("data-state").catch(() => null);
    expect(browseAriaSelected === "true" || browseDataState === "active").toBeTruthy();

    // Switch back to View Graphics
    await viewGraphicsBtn.click();
    const viewAriaSelected = await viewGraphicsBtn.getAttribute("aria-selected").catch(() => null);
    const viewDataState = await viewGraphicsBtn.getAttribute("data-state").catch(() => null);
    expect(viewAriaSelected === "true" || viewDataState === "active").toBeTruthy();
  });

  test("new graphic button navigates to create page", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/social-graphics");

    const newGraphicBtn = page.getByRole("link", { name: /new graphic/i }).or(
      page.getByRole("button", { name: /new graphic/i })
    );
    await newGraphicBtn.click();

    await page.waitForURL("**/social-graphics/new");
    expect(page.url()).toContain("/dashboard/social-graphics/new");
  });

  test("graphic card hover reveals action buttons", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/social-graphics");

    // Locate the first graphic card
    const card = page.locator("[data-testid*='graphic-card'], [class*='card']").first();
    await expect(card).toBeVisible({ timeout: 10_000 });

    // Hover to reveal action buttons
    await card.hover();

    const duplicateBtn = card.getByRole("button", { name: /duplicate/i }).or(
      card.locator("[data-testid*='duplicate']")
    );
    const deleteBtn = card.getByRole("button", { name: /delete/i }).or(
      card.locator("[data-testid*='delete']")
    );

    await expect(duplicateBtn).toBeVisible();
    await expect(deleteBtn).toBeVisible();
  });
});

test.describe("Social Graphics — new graphic page", () => {
  test("fill name and select canvas size", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/social-graphics/new");

    // Fill in the name input
    const nameInput = page.getByLabel(/name/i).or(page.getByPlaceholder(/name/i));
    await nameInput.fill("Test Social Graphic");
    await expect(nameInput).toHaveValue("Test Social Graphic");

    // Select canvas size from dropdown
    const canvasTrigger = page
      .getByRole("combobox", { name: /canvas size/i })
      .or(page.getByLabel(/canvas size/i))
      .or(page.locator("[data-testid*='canvas-size']"));
    await canvasTrigger.click();

    // Pick the first available option
    const firstOption = page.getByRole("option").first();
    await firstOption.click();
  });

  test("cancel button navigates back to graphics list", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/social-graphics/new");

    const cancelBtn = page.getByRole("button", { name: /cancel/i }).or(
      page.getByRole("link", { name: /cancel/i })
    );
    await cancelBtn.click();

    await page.waitForURL("**/social-graphics");
    expect(page.url()).toContain("/dashboard/social-graphics");
    expect(page.url()).not.toContain("/new");
  });
});
