/**
 * Auth Setup Project — logs in as each seed user and saves storageState.
 *
 * Prerequisite: `npm run seed:test-users` must have been run against the test DB.
 * All users share password: TestPassword123!
 */

import { test as setup, expect } from "@playwright/test";
import { TEST_USERS, type TestUserKey } from "./helpers/pages";

for (const [key, user] of Object.entries(TEST_USERS)) {
  setup(`authenticate as ${key}`, async ({ page }) => {
    // Navigate to login page
    await page.goto("/login");

    // Fill in the login form
    await page.getByLabel(/email/i).fill(user.email);
    await page.getByLabel(/password/i).fill(user.password);

    // Submit the form
    await page.getByRole("button", { name: /sign in/i }).click();

    // Wait for redirect to dashboard (or onboarding)
    await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 15_000 });

    // Verify we're authenticated
    expect(page.url()).toMatch(/\/(dashboard|onboarding)/);

    // Save the storage state for this user
    await page.context().storageState({ path: user.storageState });
  });
}
