/**
 * Smoke tests for dashboard pages as individual-basic user.
 * Verifies all common pages load, pro pages show upgrade prompt,
 * and enterprise pages redirect.
 */

import { test, expect } from "../helpers/dashboard-fixture";
import {
  DASHBOARD_COMMON_PAGES,
  DASHBOARD_PRO_PAGES,
  DASHBOARD_ENTERPRISE_PAGES,
  TEST_USERS,
} from "../helpers/pages";
import { expectPageLoaded } from "../helpers/assertions";

test.use({ storageState: TEST_USERS["individual-basic"].storageState });

test.describe("Individual Basic — common pages", () => {
  for (const pg of DASHBOARD_COMMON_PAGES) {
    test(`${pg.name} loads`, async ({ page, pageErrors }) => {
      await page.goto(pg.path, { waitUntil: "commit" });
      await expectPageLoaded(page);

      const critical = pageErrors.filter(
        (e) => !e.includes("favicon") && !e.includes("hydration")
      );
      expect(critical).toEqual([]);
    });
  }
});

test.describe("Individual Basic — pro pages show upgrade", () => {
  for (const pg of DASHBOARD_PRO_PAGES) {
    test(`${pg.name} shows upgrade or redirects`, async ({ page }) => {
      await page.goto(pg.path, { waitUntil: "commit" });
      await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});

      // Pro pages for basic users should either:
      // 1. Redirect to dashboard
      // 2. Show an upgrade prompt/lock
      const url = page.url();
      const hasUpgradePrompt = await page
        .locator('[data-testid="upgrade-prompt"], [data-testid="tier-gate"]')
        .isVisible({ timeout: 5000 })
        .catch(() => false);
      const wasRedirected = url.includes("/dashboard") && !url.includes(pg.path);

      expect(
        hasUpgradePrompt || wasRedirected,
        `${pg.name} should show upgrade prompt or redirect for basic tier`
      ).toBe(true);
    });
  }
});

test.describe("Individual Basic — enterprise pages redirect", () => {
  for (const pg of DASHBOARD_ENTERPRISE_PAGES) {
    test(`${pg.name} redirects away`, async ({ page }) => {
      await page.goto(pg.path, { waitUntil: "commit" });
      await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});

      // Enterprise pages should redirect individual users to dashboard home
      expect(page.url()).not.toContain(pg.path);
    });
  }
});
