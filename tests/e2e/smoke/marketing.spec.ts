/**
 * Smoke tests for marketing/public pages.
 * No authentication required — verifies each page loads without JS errors.
 */

import { test, expect } from "@playwright/test";
import { MARKETING_PAGES, AUTH_PAGES } from "../helpers/pages";
import { expectPageLoaded, expectNoErrorBoundary } from "../helpers/assertions";

test.describe("Marketing pages", () => {
  for (const page of MARKETING_PAGES) {
    test(`${page.name} (${page.path}) loads`, async ({ page: p }) => {
      const errors: string[] = [];
      p.on("pageerror", (e) => errors.push(e.message));

      await p.goto(page.path, { waitUntil: "commit" });
      await expectPageLoaded(p);

      // Page should have some visible content
      const body = p.locator("body");
      await expect(body).not.toBeEmpty();

      // No critical JS errors
      const critical = errors.filter(
        (e) => !e.includes("favicon") && !e.includes("hydration")
      );
      expect(critical).toEqual([]);
    });
  }
});

test.describe("Auth pages", () => {
  for (const page of AUTH_PAGES) {
    test(`${page.name} (${page.path}) loads`, async ({ page: p }) => {
      const errors: string[] = [];
      p.on("pageerror", (e) => errors.push(e.message));

      await p.goto(page.path, { waitUntil: "commit" });
      await expectPageLoaded(p);

      const body = p.locator("body");
      await expect(body).not.toBeEmpty();

      const critical = errors.filter(
        (e) => !e.includes("favicon") && !e.includes("hydration")
      );
      expect(critical).toEqual([]);
    });
  }
});
