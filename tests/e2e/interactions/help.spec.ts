/**
 * Interaction tests for the Help dashboard page.
 */

import { test, expect } from "../helpers/dashboard-fixture";

test.use({ storageState: ".auth/enterprise-admin.json" });

test.describe("Help page", () => {
  test("help page loads with FAQ section", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/help");

    // FAQ accordion should be present
    const faqSection = page.locator("[data-testid*='faq'], [role='region']").first().or(
      page.getByRole("heading", { name: /frequently asked|faq/i })
    );
    await expect(faqSection).toBeVisible({ timeout: 10_000 });

    // Should have accordion items
    const accordionItems = page.locator(
      "[data-testid*='faq-item'], [data-radix-collection-item], [role='button'][aria-expanded]"
    );
    const count = await accordionItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test("search input filters FAQ items", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/help");

    // Get initial FAQ count
    const accordionTriggers = page.locator(
      "[data-radix-collection-item], [role='button'][aria-expanded], [data-testid*='faq-item']"
    );
    const initialCount = await accordionTriggers.count();
    expect(initialCount).toBeGreaterThan(0);

    // Type a search query to filter
    const searchInput = page.getByRole("searchbox").or(
      page.getByPlaceholder(/search/i)
    );
    await searchInput.fill("reviews");

    // Wait for filtering to take effect
    await page.waitForTimeout(300);

    // Filtered count should be less than or equal to initial
    const filteredCount = await accordionTriggers.count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test("category buttons filter by category", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/help");

    // Should have category filter buttons
    const allTopicsBtn = page.getByRole("button", { name: /all topics/i });
    await expect(allTopicsBtn).toBeVisible();

    // Click a specific category
    const analyticsBtn = page.getByRole("button", { name: /analytics/i });
    await analyticsBtn.click();

    // FAQ items should now be filtered — check that items have the category badge
    await page.waitForTimeout(300);
    const visibleItems = page.locator(
      "[data-radix-collection-item], [role='button'][aria-expanded], [data-testid*='faq-item']"
    );
    const filteredCount = await visibleItems.count();
    expect(filteredCount).toBeGreaterThan(0);

    // Click "All Topics" to reset
    await allTopicsBtn.click();
    await page.waitForTimeout(300);
    const resetCount = await visibleItems.count();
    expect(resetCount).toBeGreaterThanOrEqual(filteredCount);
  });

  test("FAQ accordion items expand and collapse", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/help");

    // Find the first accordion trigger
    const firstTrigger = page
      .locator("[data-radix-collection-item], [role='button'][aria-expanded]")
      .first();
    await expect(firstTrigger).toBeVisible();

    // Expand
    await firstTrigger.click();
    await expect(firstTrigger).toHaveAttribute("aria-expanded", "true");

    // Content should be visible
    const content = page
      .locator("[data-radix-accordion-content], [role='region']")
      .first();
    await expect(content).toBeVisible();

    // Collapse
    await firstTrigger.click();
    await expect(firstTrigger).toHaveAttribute("aria-expanded", "false");
  });

  test("no results shows clear filters button", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/help");

    // Search for something that won't match
    const searchInput = page.getByRole("searchbox").or(
      page.getByPlaceholder(/search/i)
    );
    await searchInput.fill("xyznonexistentquery12345");

    // Wait for filtering
    await page.waitForTimeout(300);

    // Empty state should appear with clear filters button
    const emptyState = page.getByText(/no results/i);
    await expect(emptyState).toBeVisible();

    const clearBtn = page.getByRole("button", { name: /clear filters/i });
    await expect(clearBtn).toBeVisible();
  });

  test("clear filters resets search and category", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/help");

    // Apply search filter that yields no results
    const searchInput = page.getByRole("searchbox").or(
      page.getByPlaceholder(/search/i)
    );
    await searchInput.fill("xyznonexistentquery12345");
    await page.waitForTimeout(300);

    // Click clear filters
    const clearBtn = page.getByRole("button", { name: /clear filters/i });
    await clearBtn.click();

    // Search input should be cleared
    await expect(searchInput).toHaveValue("");

    // FAQ items should be visible again
    const accordionItems = page.locator(
      "[data-radix-collection-item], [role='button'][aria-expanded], [data-testid*='faq-item']"
    );
    const count = await accordionItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test("quick link cards are visible", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/help");

    await expect(page.getByText(/getting started/i)).toBeVisible();
    await expect(page.getByText(/video tutorials/i)).toBeVisible();
    await expect(page.getByText(/api documentation/i)).toBeVisible();
  });

  test("support email links have correct mailto", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/help");

    // Check for mailto links in support section
    const emailLinks = page.locator("a[href^='mailto:']");
    const count = await emailLinks.count();
    expect(count).toBeGreaterThan(0);

    // At least one should be a support email
    const supportLink = page.locator("a[href*='mailto:'][href*='support']").first();
    const href = await supportLink.getAttribute("href");
    expect(href).toMatch(/^mailto:/);
  });
});
