/**
 * Access control tests — verify role-based redirects work correctly.
 * Tests each user role against pages they should NOT access.
 */

import { test, expect } from "@playwright/test";
import { TEST_USERS } from "../helpers/pages";

test.describe("Enterprise user (role=user) access control", () => {
  test.use({ storageState: TEST_USERS["enterprise-user"].storageState });

  const restrictedPaths = [
    "/dashboard/people",
    "/dashboard/campaigns",
    "/dashboard/approvals",
    "/dashboard/ex-surveys",
    "/dashboard/organization",
  ];

  for (const path of restrictedPaths) {
    test(`cannot access ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: "commit" });
      await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});

      // Should be redirected away from restricted page
      const url = page.url();
      expect(url).not.toContain(path);
    });
  }

  // Enterprise users CAN access recognition and leaderboard
  const allowedPaths = [
    "/dashboard/recognition",
    "/dashboard/analytics/leaderboard",
  ];

  for (const path of allowedPaths) {
    test(`can access ${path}`, async ({ page }) => {
      await page.goto(path, { waitUntil: "commit" });
      await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
      expect(page.url()).toContain(path);
    });
  }
});

test.describe("Enterprise manager access control", () => {
  test.use({ storageState: TEST_USERS["enterprise-manager"].storageState });

  test("cannot access /dashboard/organization (admin only)", async ({ page }) => {
    await page.goto("/dashboard/organization", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    expect(page.url()).not.toContain("/dashboard/organization");
  });

  test("can access team members (manager role)", async ({ page }) => {
    await page.goto("/dashboard/team", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    expect(page.url()).toContain("/dashboard/people");
  });
});

test.describe("Individual Pro access control", () => {
  test.use({ storageState: TEST_USERS["individual-pro"].storageState });

  test("can access /dashboard/insights (pro tier)", async ({ page }) => {
    await page.goto("/dashboard/insights", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});

    // Should stay on insights or show content (not redirect)
    expect(page.url()).toContain("/dashboard/insights");
  });

  test("cannot access team members (enterprise only)", async ({ page }) => {
    await page.goto("/dashboard/team", { waitUntil: "commit" });
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});
    expect(page.url()).not.toContain("/dashboard/people");
  });
});

test.describe("Unauthenticated access control", () => {
  test("dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "commit" });
    await page.waitForURL("**/login**", { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });

  test("onboarding redirects to login", async ({ page }) => {
    await page.goto("/onboarding", { waitUntil: "commit" });
    await page.waitForURL("**/login**", { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });

  test("settings redirects to login", async ({ page }) => {
    await page.goto("/dashboard/settings", { waitUntil: "commit" });
    await page.waitForURL("**/login**", { timeout: 10_000 });
    expect(page.url()).toContain("/login");
  });
});
