import { expect, test, type Page } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ENTERPRISE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ENTERPRISE_ADMIN_PASSWORD;
const TARGET_USER_EMAIL = process.env.E2E_IMPERSONATION_TARGET_EMAIL;
const ADMIN_TARGET_EMAIL = process.env.E2E_IMPERSONATION_ADMIN_TARGET_EMAIL;

async function loginAsEnterpriseAdmin(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(ADMIN_EMAIL!);
  await page.getByLabel("Password").fill(ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard**");
}

async function openMemberActionsMenu(page: Page, email: string) {
  const memberRow = page.locator("tr", { hasText: email }).first();
  await expect(memberRow).toBeVisible();
  await memberRow.locator("button").last().click();
}

test.describe("organization impersonation", () => {
  test.skip(
    !ADMIN_EMAIL || !ADMIN_PASSWORD || !TARGET_USER_EMAIL,
    "Set E2E_ENTERPRISE_ADMIN_EMAIL, E2E_ENTERPRISE_ADMIN_PASSWORD, and E2E_IMPERSONATION_TARGET_EMAIL."
  );

  test("enterprise admin can start and stop impersonation from organization team table", async ({ page }) => {
    await loginAsEnterpriseAdmin(page);
    await page.goto("/dashboard/organization");
    await page.getByRole("tab", { name: "Users" }).click();

    await openMemberActionsMenu(page, TARGET_USER_EMAIL!);
    await page.getByRole("menuitem", { name: "Impersonate user" }).click();
    await page.getByRole("button", { name: "Start impersonation" }).click();

    await expect(page.getByText("Impersonating")).toBeVisible();
    await expect(page.getByRole("button", { name: "Stop impersonation" })).toBeVisible();

    await page.getByRole("button", { name: "Stop impersonation" }).click();
    await expect(page.getByText("Impersonating")).not.toBeVisible();
  });

  test("admin target is disabled in impersonation menu", async ({ page }) => {
    test.skip(!ADMIN_TARGET_EMAIL, "Set E2E_IMPERSONATION_ADMIN_TARGET_EMAIL.");

    await loginAsEnterpriseAdmin(page);
    await page.goto("/dashboard/organization");
    await page.getByRole("tab", { name: "Users" }).click();

    await openMemberActionsMenu(page, ADMIN_TARGET_EMAIL!);
    const impersonateItem = page.getByRole("menuitem", { name: "Impersonate user" });
    await expect(impersonateItem).toHaveAttribute("data-disabled", "");
  });

  test.skip("cross-org impersonation is rejected server-side", async () => {
    // Requires seeded cross-org fixture users and a direct action invocation harness.
  });

  test.skip("expired impersonation session returns to admin context", async () => {
    // Requires short impersonation session duration in test environment.
  });
});
