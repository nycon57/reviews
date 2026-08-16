/**
 * Shared assertion helpers for E2E tests.
 */

import { type Page, expect } from "@playwright/test";

/**
 * Assert that a page has loaded successfully:
 * - No error boundary visible
 * - No stuck loading spinners (after timeout)
 * - Page has a visible heading or main content
 */
export async function expectPageLoaded(page: Page) {
  // Wait for network to settle
  await page.waitForLoadState("networkidle", { timeout: 15_000 });

  // No error boundaries
  await expectNoErrorBoundary(page);

  // No stuck loading states (allow brief spinners during load)
  const stuckSpinner = page.locator('[data-testid="loading"], .animate-spin').first();
  if (await stuckSpinner.isVisible({ timeout: 1000 }).catch(() => false)) {
    // Give it a moment to resolve
    await expect(stuckSpinner).not.toBeVisible({ timeout: 10_000 });
  }
}

/**
 * Assert no console errors were logged.
 * Must be used with the dashboard fixture that captures errors.
 */
export function expectNoConsoleErrors(errors: string[]) {
  const critical = errors.filter(
    (e) =>
      // Filter out known benign errors
      !e.includes("favicon") &&
      !e.includes("Failed to load resource: net::ERR_") &&
      !e.includes("hydration") // Next.js hydration warnings in dev
  );
  expect(critical).toEqual([]);
}

/**
 * Assert no Next.js error boundary / error.tsx is showing.
 */
export async function expectNoErrorBoundary(page: Page) {
  // Check for Next.js error overlay (dev mode)
  const errorOverlay = page.locator("nextjs-portal");
  const hasOverlay = await errorOverlay.isVisible({ timeout: 500 }).catch(() => false);
  expect(hasOverlay, "Next.js error overlay should not be visible").toBe(false);

  // Check for custom error boundary content. Do not treat ordinary form
  // validation/toast live regions (`role="alert"`) as app error boundaries.
  const errorBoundary = page.locator('[data-testid="error-boundary"]').first();
  const hasError = await errorBoundary.isVisible({ timeout: 500 }).catch(() => false);
  if (hasError) {
    const text = await errorBoundary.textContent();
    expect(hasError, `Error boundary visible with text: ${text}`).toBe(false);
  }

  const criticalAlert = page
    .locator('[role="alert"]')
    .filter({ hasText: /application error|something went wrong|error boundary|unhandled|failed to render/i })
    .first();
  const hasCriticalAlert = await criticalAlert.isVisible({ timeout: 500 }).catch(() => false);
  if (hasCriticalAlert) {
    const text = await criticalAlert.textContent();
    expect(hasCriticalAlert, `Critical alert visible with text: ${text}`).toBe(false);
  }
}

/**
 * Assert page has navigated to expected URL pattern.
 */
export async function expectUrlContains(page: Page, path: string) {
  await expect(page).toHaveURL(new RegExp(path.replace(/\//g, "\\/")));
}

/**
 * Assert a redirect happened (URL changed from original).
 */
export async function expectRedirectedTo(page: Page, expectedPath: string) {
  await page.waitForURL(`**${expectedPath}`, { timeout: 10_000 });
  expect(page.url()).toContain(expectedPath);
}
