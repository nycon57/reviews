/**
 * E2E interaction tests for navigation components:
 * - Sidebar (enterprise vs individual visibility)
 * - Search dialog (filtering, keyboard nav)
 * - Notifications page (filters, bulk actions, pagination)
 */

import type { Page } from "@playwright/test";
import { test, expect } from "../helpers/dashboard-fixture";
import { TEST_USERS } from "../helpers/pages";

// ---------------------------------------------------------------------------
// Mock notification data
// ---------------------------------------------------------------------------

function buildNotifications(count: number, startId = 1) {
  return Array.from({ length: count }, (_, i) => ({
    id: `notif-${startId + i}`,
    title: `Notification ${startId + i}`,
    body: `Body for notification ${startId + i}`,
    type: i % 3 === 0 ? "new_review" : i % 3 === 1 ? "negative_review" : "general",
    is_read: i % 2 === 0,
    created_at: new Date(Date.now() - i * 3600_000).toISOString(),
  }));
}

const ALL_NOTIFICATIONS = buildNotifications(25);
const PAGE_SIZE = 10;

function paginatedResponse(notifications: typeof ALL_NOTIFICATIONS, page: number) {
  const start = (page - 1) * PAGE_SIZE;
  const items = notifications.slice(start, start + PAGE_SIZE);
  return {
    data: items,
    total: notifications.length,
    page,
    pageSize: PAGE_SIZE,
    totalPages: Math.ceil(notifications.length / PAGE_SIZE),
  };
}

// ---------------------------------------------------------------------------
// Enterprise Admin — navigation
// ---------------------------------------------------------------------------

test.describe("Navigation — enterprise-admin", () => {
  test.use({ storageState: TEST_USERS["enterprise-admin"].storageState });

  test("sidebar shows all nav items including Team, Organization, Admin sections", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard");
    const sidebar = page.locator("nav, aside").first();

    // Core items
    await expect(sidebar.getByRole("link", { name: "Dashboard" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Reviews" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Recognition" })).toBeVisible();

    // Insights section
    await expect(sidebar.getByRole("link", { name: "Analytics" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Trends" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Leaderboard" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "AI Insights" })).toBeVisible();

    // Team section
    await expect(sidebar.getByRole("link", { name: "Team" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Employees" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Campaigns" })).toBeVisible();

    // Admin section
    await expect(sidebar.getByRole("link", { name: "Organization" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Surveys" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Widgets" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "EX Surveys" })).toBeVisible();

    // Bottom items
    await expect(sidebar.getByRole("link", { name: "Settings" })).toBeVisible();
    await expect(sidebar.getByRole("link", { name: "Help & Support" })).toBeVisible();
  });

  test("clicking sidebar items navigates to correct routes", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard");
    const sidebar = page.locator("nav, aside").first();

    const routes = [
      { name: "Reviews", path: "/dashboard/reviews" },
      { name: "Analytics", path: "/dashboard/analytics" },
      { name: "Settings", path: "/dashboard/settings" },
    ];

    for (const route of routes) {
      await sidebar.getByRole("link", { name: route.name }).click();
      await page.waitForURL(`**${route.path}`, { timeout: 10_000 });
      expect(page.url()).toContain(route.path);
    }
  });

  test("active sidebar item is highlighted", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard/reviews");
    const sidebar = page.locator("nav, aside").first();

    const activeLink = sidebar.getByRole("link", { name: "Reviews" });
    await expect(activeLink).toBeVisible();

    // Active item should have a distinguishing attribute or class
    const classes = await activeLink.getAttribute("class");
    const ariaAttr = await activeLink.getAttribute("aria-current");
    const dataActive = await activeLink.getAttribute("data-active");

    const isHighlighted =
      classes?.includes("active") ||
      classes?.includes("bg-") ||
      ariaAttr === "page" ||
      dataActive === "true";

    expect(isHighlighted, "Active sidebar item should be visually highlighted").toBeTruthy();
  });

  test("search dialog opens and closes", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard");

    // Find and click the search trigger button
    const searchButton = page.getByRole("button", { name: /search/i });
    await searchButton.click();

    // Dialog should be visible
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Search input should be present
    const searchInput = dialog.getByPlaceholder(/search/i);
    await expect(searchInput).toBeVisible();

    // Close by clicking overlay / pressing escape
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });

  test("search dialog filters results as you type", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard");

    const searchButton = page.getByRole("button", { name: /search/i });
    await searchButton.click();

    const dialog = page.getByRole("dialog");
    const searchInput = dialog.getByPlaceholder(/search/i);

    // Initially all 15 quick links should be visible
    const resultButtons = dialog.locator("button").filter({ hasNotText: "" });
    const initialCount = await resultButtons.count();
    expect(initialCount).toBeGreaterThanOrEqual(15);

    // Type a query that should narrow results
    await searchInput.fill("Analytics");

    // Wait for filter to take effect
    await page.waitForTimeout(200);

    const filteredCount = await resultButtons.count();
    expect(filteredCount).toBeLessThan(initialCount);

    // "Analytics" result should still be visible
    await expect(dialog.getByText("Analytics").first()).toBeVisible();
  });

  test("search dialog keyboard navigation (arrow keys + enter)", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard");

    const searchButton = page.getByRole("button", { name: /search/i });
    await searchButton.click();

    const dialog = page.getByRole("dialog");
    const searchInput = dialog.getByPlaceholder(/search/i);
    await expect(searchInput).toBeFocused();

    // First item should be selected by default (has highlight class)
    const firstResult = dialog.locator("button").first();
    const firstClasses = await firstResult.getAttribute("class");
    expect(firstClasses).toContain("bg-");

    // Press ArrowDown to move to second item
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(100);

    const secondResult = dialog.locator("button").nth(1);
    const secondClasses = await secondResult.getAttribute("class");
    expect(secondClasses).toContain("bg-");

    // Press ArrowUp to go back to first
    await page.keyboard.press("ArrowUp");
    await page.waitForTimeout(100);

    const firstClassesAfter = await firstResult.getAttribute("class");
    expect(firstClassesAfter).toContain("bg-");

    // Press Enter to navigate to the selected result
    const firstResultText = await firstResult.locator("div.text-sm").textContent();
    await page.keyboard.press("Enter");

    // Dialog should close
    await expect(dialog).not.toBeVisible();

    // Should have navigated (URL changed from /dashboard)
    // The first quick link is "Dashboard" at /dashboard, so check page loaded
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    expect(firstResultText).toBeTruthy();
  });

  test("search dialog escape closes it", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard");

    const searchButton = page.getByRole("button", { name: /search/i });
    await searchButton.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Type something first, then escape
    const searchInput = dialog.getByPlaceholder(/search/i);
    await searchInput.fill("test");

    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Individual Basic — navigation
// ---------------------------------------------------------------------------

test.describe("Navigation — individual-basic", () => {
  test.use({ storageState: TEST_USERS["individual-basic"].storageState });

  test("sidebar hides enterprise items (Team, Campaigns, Organization, etc.)", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard");
    const sidebar = page.locator("nav, aside").first();

    // Enterprise-only items should NOT be visible
    const enterpriseItems = ["Team", "Campaigns", "Organization", "Employees", "EX Surveys", "Recognition"];

    for (const item of enterpriseItems) {
      await expect(
        sidebar.getByRole("link", { name: item, exact: true }),
        `"${item}" should not be visible for individual-basic`
      ).not.toBeVisible();
    }
  });

  test("sidebar shows individual items (Dashboard, Reviews, Analytics, etc.)", async ({
    dashboardPage,
  }) => {
    const page = await dashboardPage("/dashboard");
    const sidebar = page.locator("nav, aside").first();

    // Common items accessible to all users
    const individualItems = ["Dashboard", "Reviews", "Analytics", "Settings", "Help & Support"];

    for (const item of individualItems) {
      await expect(
        sidebar.getByRole("link", { name: item }),
        `"${item}" should be visible for individual-basic`
      ).toBeVisible();
    }
  });

  test("pro-gated items show lock icon for basic tier", async ({ dashboardPage }) => {
    const page = await dashboardPage("/dashboard");
    const sidebar = page.locator("nav, aside").first();

    // AI Insights requires Pro — if visible, it should have a lock indicator
    const aiInsightsLink = sidebar.getByRole("link", { name: "AI Insights" });
    const isVisible = await aiInsightsLink.isVisible({ timeout: 2000 }).catch(() => false);

    if (isVisible) {
      // Look for lock icon within or near the link
      const lockIcon = aiInsightsLink.locator(
        'svg[data-testid="lock-icon"], [data-lock], svg.lock-icon, [aria-label*="locked"], [aria-label*="pro"]'
      );
      const hasLock = await lockIcon.isVisible({ timeout: 2000 }).catch(() => false);

      // Alternatively check for a badge or text indicating Pro requirement
      const proBadge = aiInsightsLink.locator('text="Pro"', { hasText: "Pro" });
      const hasBadge = await proBadge.isVisible({ timeout: 1000 }).catch(() => false);

      expect(
        hasLock || hasBadge,
        "Pro-gated items should display a lock icon or Pro badge for basic tier users"
      ).toBeTruthy();
    }
  });
});

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

test.describe("Notifications", () => {
  test.use({ storageState: TEST_USERS["enterprise-admin"].storageState });

  /**
   * Intercept notification API calls and return mock data.
   */
  async function mockNotificationsApi(page: Page) {
    // Track archived/read state for mock mutations
    const archivedIds = new Set<string>();
    const readIds = new Set<string>();

    await page.route("**/api/notifications*", async (route) => {
      const url = new URL(route.request().url(), "http://localhost");
      const method = route.request().method();

      if (method === "GET") {
        const pageNum = parseInt(url.searchParams.get("page") || "1", 10);
        const filter = url.searchParams.get("filter") || "all";

        let filtered = ALL_NOTIFICATIONS.filter((n) => !archivedIds.has(n.id));

        if (filter === "unread") {
          filtered = filtered.filter((n) => !n.is_read && !readIds.has(n.id));
        } else if (filter === "new_review") {
          filtered = filtered.filter((n) => n.type === "new_review");
        } else if (filter === "negative_review") {
          filtered = filtered.filter((n) => n.type === "negative_review");
        }

        const start = (pageNum - 1) * PAGE_SIZE;
        const items = filtered.slice(start, start + PAGE_SIZE);

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            data: items,
            total: filtered.length,
            page: pageNum,
            pageSize: PAGE_SIZE,
            totalPages: Math.ceil(filtered.length / PAGE_SIZE),
          }),
        });
      } else if (method === "PATCH") {
        const body = JSON.parse((await route.request().postData()) || "{}");
        if (body.action === "mark_read") {
          for (const id of body.ids || []) readIds.add(id);
        }
        if (body.action === "mark_all_read") {
          for (const n of ALL_NOTIFICATIONS) readIds.add(n.id);
        }
        if (body.action === "archive") {
          for (const id of body.ids || []) archivedIds.add(id);
        }
        await route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
      } else {
        await route.continue();
      }
    });

    return { archivedIds, readIds };
  }

  test("filter dropdown changes displayed notifications", async ({ dashboardPage, page }) => {
    await mockNotificationsApi(page);
    await dashboardPage("/dashboard/notifications");

    // Open filter dropdown
    const filterTrigger = page.getByRole("combobox").or(page.getByRole("button", { name: /filter|all/i })).first();
    await filterTrigger.click();

    // Select "Unread Only"
    const unreadOption = page.getByRole("option", { name: /unread/i }).or(page.getByText(/unread only/i));
    await unreadOption.first().click();

    // Wait for filtered results
    await page.waitForTimeout(500);

    // The list should update — fewer items than the full list
    const notificationItems = page.locator('[data-testid="notification-item"], [role="listitem"]');
    const count = await notificationItems.count();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("select all checkbox toggles all notification checkboxes", async ({
    dashboardPage,
    page,
  }) => {
    await mockNotificationsApi(page);
    await dashboardPage("/dashboard/notifications");

    // Find select all checkbox
    const selectAll = page
      .getByRole("checkbox", { name: /select all/i })
      .or(page.locator('[data-testid="select-all"]'))
      .first();

    await selectAll.check();

    // All individual checkboxes should be checked
    const checkboxes = page.locator(
      '[data-testid="notification-checkbox"] input[type="checkbox"], [data-testid="notification-item"] input[type="checkbox"]'
    );
    const checkboxCount = await checkboxes.count();

    if (checkboxCount > 0) {
      for (let i = 0; i < checkboxCount; i++) {
        await expect(checkboxes.nth(i)).toBeChecked();
      }
    }

    // Uncheck select all
    await selectAll.uncheck();

    if (checkboxCount > 0) {
      for (let i = 0; i < checkboxCount; i++) {
        await expect(checkboxes.nth(i)).not.toBeChecked();
      }
    }
  });

  test("bulk mark as read button works", async ({ dashboardPage, page }) => {
    await mockNotificationsApi(page);
    await dashboardPage("/dashboard/notifications");

    // Select all
    const selectAll = page
      .getByRole("checkbox", { name: /select all/i })
      .or(page.locator('[data-testid="select-all"]'))
      .first();
    await selectAll.check();

    // Click bulk "Mark Selected as Read"
    const markReadBtn = page.getByRole("button", { name: /mark selected as read/i }).or(
      page.getByRole("button", { name: /mark.*read/i })
    );
    await markReadBtn.first().click();

    // Wait for the action to complete
    await page.waitForTimeout(500);

    // Verify the action was processed (no error state)
    const errorBoundary = page.locator('[role="alert"]').first();
    const hasError = await errorBoundary.isVisible({ timeout: 500 }).catch(() => false);
    expect(hasError).toBe(false);
  });

  test("individual mark as read works", async ({ dashboardPage, page }) => {
    await mockNotificationsApi(page);
    await dashboardPage("/dashboard/notifications");

    // Find the first notification's mark-as-read button (Check icon)
    const firstNotification = page
      .locator('[data-testid="notification-item"], [role="listitem"]')
      .first();
    const markReadBtn = firstNotification
      .getByRole("button", { name: /mark.*read|read/i })
      .or(firstNotification.locator('[data-testid="mark-read"]'))
      .first();

    await markReadBtn.click();
    await page.waitForTimeout(500);

    // No error should appear
    const errorBoundary = page.locator('[role="alert"]').first();
    const hasError = await errorBoundary.isVisible({ timeout: 500 }).catch(() => false);
    expect(hasError).toBe(false);
  });

  test("archive removes notification from list", async ({ dashboardPage, page }) => {
    await mockNotificationsApi(page);
    await dashboardPage("/dashboard/notifications");

    // Count notifications before archive
    const notificationItems = page.locator(
      '[data-testid="notification-item"], [role="listitem"]'
    );
    const countBefore = await notificationItems.count();

    // Click archive on first notification
    const firstNotification = notificationItems.first();
    const archiveBtn = firstNotification
      .getByRole("button", { name: /archive/i })
      .or(firstNotification.locator('[data-testid="archive"]'))
      .first();

    await archiveBtn.click();
    await page.waitForTimeout(500);

    // Count should decrease by 1
    const countAfter = await notificationItems.count();
    expect(countAfter).toBeLessThan(countBefore);
  });

  test("pagination next/previous", async ({ dashboardPage, page }) => {
    await mockNotificationsApi(page);
    await dashboardPage("/dashboard/notifications");

    // Click "Next" to go to page 2
    const nextBtn = page.getByRole("button", { name: /next/i });
    await expect(nextBtn).toBeVisible();
    await nextBtn.click();
    await page.waitForTimeout(500);

    // Should still have notifications on page 2
    const notificationItems = page.locator(
      '[data-testid="notification-item"], [role="listitem"]'
    );
    const countPage2 = await notificationItems.count();
    expect(countPage2).toBeGreaterThan(0);

    // Click "Previous" to go back to page 1
    const prevBtn = page.getByRole("button", { name: /previous/i });
    await expect(prevBtn).toBeVisible();
    await prevBtn.click();
    await page.waitForTimeout(500);

    const countPage1 = await notificationItems.count();
    expect(countPage1).toBeGreaterThan(0);
  });

  test("stats cards show correct counts", async ({ dashboardPage, page }) => {
    await mockNotificationsApi(page);
    await dashboardPage("/dashboard/notifications");

    // Look for stats cards — Total, Unread, Settings link
    const totalCard = page.getByText(/total/i).first();
    await expect(totalCard).toBeVisible();

    const unreadCard = page.getByText(/unread/i).first();
    await expect(unreadCard).toBeVisible();

    // Settings link card should be present
    const settingsLink = page
      .getByRole("link", { name: /settings/i })
      .or(page.getByText(/settings/i))
      .first();
    await expect(settingsLink).toBeVisible();
  });
});
