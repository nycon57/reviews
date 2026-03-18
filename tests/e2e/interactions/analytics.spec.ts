/**
 * Interaction tests for Analytics and Reports dashboard pages.
 */

import { test, expect } from "../helpers/dashboard-fixture";

test.use({ storageState: ".auth/enterprise-admin.json" });

test.describe("Analytics", () => {
  test("analytics page loads with chart sections", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/analytics");

    // Should render chart components in the analytics overview
    const charts = page.locator("canvas, svg, [data-testid*='chart'], .recharts-wrapper");
    await expect(charts.first()).toBeVisible({ timeout: 10_000 });
  });

  test("navigate to trends sub-page", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/analytics");

    const trendsLink = page.getByRole("link", { name: /trends/i }).or(
      page.getByRole("tab", { name: /trends/i })
    );
    await trendsLink.click();

    await page.waitForURL("**/analytics/trends");
    expect(page.url()).toContain("/dashboard/analytics/trends");
  });

  test("navigate to leaderboard sub-page", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/analytics");

    const leaderboardLink = page.getByRole("link", { name: /leaderboard/i }).or(
      page.getByRole("tab", { name: /leaderboard/i })
    );
    await leaderboardLink.click();

    await page.waitForURL("**/analytics/leaderboard");
    expect(page.url()).toContain("/dashboard/analytics/leaderboard");
  });
});

test.describe("Reports", () => {
  test("reports page tabs switch correctly", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/reports");

    const generateTab = page.getByRole("tab", { name: /generate report/i });
    const scheduledTab = page.getByRole("tab", { name: /scheduled reports/i });
    const exportTab = page.getByRole("tab", { name: /export history/i });

    await expect(generateTab).toBeVisible();
    await expect(scheduledTab).toBeVisible();
    await expect(exportTab).toBeVisible();

    // Switch to Scheduled Reports
    await scheduledTab.click();
    await expect(scheduledTab).toHaveAttribute("aria-selected", "true");

    // Switch to Export History
    await exportTab.click();
    await expect(exportTab).toHaveAttribute("aria-selected", "true");

    // Switch back to Generate Report
    await generateTab.click();
    await expect(generateTab).toHaveAttribute("aria-selected", "true");
  });

  test("report template selection enables generate button", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/reports");

    const generateBtn = page.getByRole("button", { name: /generate/i });

    // Generate button should be disabled until a template is selected
    await expect(generateBtn).toBeDisabled();

    // Click first template card/item
    const templateCard = page
      .locator("[data-testid*='template'], [role='option'], [role='radio']")
      .first()
      .or(page.locator("button:has-text('template'), [class*='template']").first());
    await templateCard.click();

    // Generate button should now be enabled
    await expect(generateBtn).toBeEnabled();
  });

  test("date range selector shows preset options", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/reports");

    // Open date range selector
    const dateRangeTrigger = page
      .getByRole("button", { name: /date range|last \d+ days|this month|custom/i })
      .or(page.locator("[data-testid*='date-range']"));
    await dateRangeTrigger.click();

    // Should display preset options
    const presets = page.getByRole("option").or(page.locator("[data-testid*='preset']"));
    const presetCount = await presets.count();
    expect(presetCount).toBeGreaterThan(0);
  });

  test("export dropdown shows CSV/PDF/JSON options", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/reports");

    // Open export dropdown
    const exportTrigger = page.getByRole("button", { name: /export/i });
    await exportTrigger.click();

    // All three export formats should be available
    await expect(page.getByRole("menuitem", { name: /csv/i }).or(page.getByText("CSV"))).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /pdf/i }).or(page.getByText("PDF"))).toBeVisible();
    await expect(page.getByRole("menuitem", { name: /json/i }).or(page.getByText("JSON"))).toBeVisible();
  });

  test("generated report shows chart visualizations", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/reports");

    // Select a template
    const templateCard = page
      .locator("[data-testid*='template'], [role='option'], [role='radio']")
      .first()
      .or(page.locator("button:has-text('template'), [class*='template']").first());
    await templateCard.click();

    // Click generate
    const generateBtn = page.getByRole("button", { name: /generate/i });
    await generateBtn.click();

    // Wait for report to render with Recharts visualizations
    const chart = page.locator(".recharts-wrapper, canvas, svg[class*='chart']").first();
    await expect(chart).toBeVisible({ timeout: 15_000 });
  });
});
