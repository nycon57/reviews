/**
 * Smoke tests for public/developer pages that don't require auth.
 * These are pages outside the marketing route group.
 */

import { test, expect } from "@playwright/test";
import { expectPageLoaded } from "../helpers/assertions";

const PUBLIC_PAGES = [
  { path: "/developers", name: "Developers Home" },
  { path: "/developers/api", name: "API Reference" },
  { path: "/developers/docs/quickstart", name: "Quickstart Guide" },
  { path: "/developers/docs/authentication", name: "Auth Docs" },
  { path: "/developers/docs/webhooks", name: "Webhook Docs" },
  { path: "/pro", name: "Professional Profiles" },
  { path: "/docs", name: "Documentation Index" },
] as const;

test.describe("Public pages", () => {
  for (const page of PUBLIC_PAGES) {
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
