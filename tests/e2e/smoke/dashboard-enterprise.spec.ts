/**
 * Smoke tests for dashboard pages as enterprise-admin user.
 * Enterprise admin should have access to ALL dashboard pages.
 */

import { test, expect } from "../helpers/dashboard-fixture";
import { ALL_DASHBOARD_PAGES, TEST_USERS } from "../helpers/pages";
import { expectPageLoaded } from "../helpers/assertions";

test.use({ storageState: TEST_USERS["enterprise-admin"].storageState });

test.describe("Enterprise Admin — all pages load", () => {
  for (const page of ALL_DASHBOARD_PAGES) {
    test(`${page.name} (${page.path}) loads`, async ({ page: p, pageErrors }) => {
      await p.goto(page.path, { waitUntil: "commit" });
      await expectPageLoaded(p);

      // Should stay on the requested page (no redirect)
      expect(p.url()).toContain(page.path);

      // No critical page errors
      const critical = pageErrors.filter(
        (e) => !e.includes("favicon") && !e.includes("hydration")
      );
      expect(critical).toEqual([]);
    });
  }
});
