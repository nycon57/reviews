import { test, expect } from "@playwright/test";
import { TEST_USERS } from "../helpers/pages";
import { loginAs } from "../helpers/golden-auth";
import { closeGoldenDb, getOrgForUserEmail } from "../helpers/golden-data";

test.setTimeout(60_000);

test.afterAll(async () => {
  await closeGoldenDb();
});

test("individual billing shows current plan and upgrade path reaches Stripe handoff or a graceful config error", async ({
  page,
}) => {
  const org = await getOrgForUserEmail(TEST_USERS["individual-basic"].email);
  expect(org).not.toBeNull();
  const expectedPlan = org!.subscription_tier === "pro" ? "Pro" : "Basic";
  const expectedStatus = org!.subscription_status === "trialing" ? "Trial" : "Active";

  await loginAs(page, TEST_USERS["individual-basic"]);
  await page.goto("/dashboard/organization?tab=billing");
  const billingPanel = page.getByRole("tabpanel", { name: "Billing" });
  await expect(billingPanel.getByText("Current Plan", { exact: true })).toBeVisible({
    timeout: 20_000,
  });
  await expect(billingPanel.getByRole("heading", { name: expectedPlan })).toBeVisible();
  await expect(billingPanel.getByText(expectedStatus).first()).toBeVisible();

  await page.getByRole("button", { name: /upgrade to pro/i }).click();
  await expect(page).toHaveURL(/\/pricing\?upgrade=pro/);

  const proCard = page
    .getByRole("heading", { name: "Pro" })
    .locator("xpath=ancestor::div[contains(@class,'rounded')][1]");
  await expect(proCard.getByText("AI-Powered Reputation Intelligence")).toBeVisible();

  const outcomePromise = Promise.race([
    page.waitForURL(/checkout\.stripe\.com/, { timeout: 20_000 }).then(() => "redirect" as const),
    page
      .getByText(/pricing not configured|failed to start checkout|an error occurred/i)
      .waitFor({ state: "visible", timeout: 20_000 })
      .then(() => "graceful-error" as const),
  ]);

  await proCard.getByRole("button", { name: "Start Free Trial" }).click();
  const outcome = await outcomePromise;

  if (outcome === "redirect") {
    expect(page.url()).toContain("checkout.stripe.com");
  } else {
    await expect(
      page.getByText(/pricing not configured|failed to start checkout|an error occurred/i)
    ).toBeVisible();
    expect(page.url()).toContain("/pricing");
  }
});
