import { expect, type Locator, type Page } from "@playwright/test";
import type { TEST_USERS } from "./pages";

type GoldenTestUser = (typeof TEST_USERS)[keyof typeof TEST_USERS];

export async function loginAs(page: Page, user: GoldenTestUser) {
  await page.goto("/login");
  await page.getByPlaceholder("you@example.com").fill(user.email);
  await page.getByPlaceholder("Enter your password").fill(user.password);
  await page.getByRole("button", { name: /^sign in$/i }).click();
  await page.waitForURL(/\/(dashboard|onboarding)/, { timeout: 20_000 });
  await expect(page).toHaveURL(/\/(dashboard|onboarding)/);
}

export async function gotoDashboardPage(page: Page, path: string) {
  await page.goto(path, { waitUntil: "commit" });
  await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
  await expect(page.locator("main")).toBeVisible({ timeout: 20_000 });
}

export async function openReviewRequestDialog(page: Page): Promise<Locator> {
  await gotoDashboardPage(page, "/dashboard/reviews?tab=requests");

  const sendButton = page.getByRole("button", { name: /send review request/i }).first();
  await expect(sendButton).toBeVisible({ timeout: 20_000 });
  await sendButton.click();

  const dialog = page
    .getByRole("dialog")
    .filter({ has: page.getByRole("heading", { name: "Send Review Request" }) });
  await expect(dialog).toBeVisible({ timeout: 20_000 });
  return dialog;
}
