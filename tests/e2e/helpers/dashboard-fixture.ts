/**
 * Extended Playwright test fixture for dashboard tests.
 * - Auto-captures page errors
 * - Waits for Suspense resolution
 * - Screenshots on failure
 */

import { test as base, type Page } from "@playwright/test";

type DashboardFixtures = {
  /** Collected page errors during the test */
  pageErrors: string[];
  /** Navigate to a dashboard page and wait for it to load */
  dashboardPage: (path: string) => Promise<Page>;
};

export const test = base.extend<DashboardFixtures>({
  pageErrors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => {
      errors.push(error.message);
    });
    await use(errors);
  },

  dashboardPage: async ({ page, pageErrors: _errors }, use) => {
    const navigate = async (path: string): Promise<Page> => {
      await page.goto(path, { waitUntil: "commit" });

      // Wait for Suspense boundaries to resolve
      // Look for common loading patterns and wait for them to disappear
      try {
        await page.waitForLoadState("networkidle", { timeout: 15_000 });
      } catch {
        // networkidle can timeout on pages with polling — that's OK
      }

      // Wait for any Suspense fallbacks to resolve
      const suspenseFallback = page
        .locator(".animate-pulse, [data-testid='skeleton']")
        .first();
      if (await suspenseFallback.isVisible({ timeout: 1000 }).catch(() => false)) {
        await suspenseFallback.waitFor({ state: "hidden", timeout: 15_000 }).catch(() => {
          // Some skeletons may persist (e.g., images loading) — not a failure
        });
      }

      return page;
    };

    await use(navigate);
  },
});

export { expect } from "@playwright/test";
